import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { Request } from "express";
import { prisma } from "../database/client";
import { mailService } from "./mail.service";
import {
  ConflictError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
} from "../utils/errors";
import { config } from "../utils/config";
import { logger } from "../utils/logger";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TokenPayload {
  user_id: string;
  email: string;
  role: string;
}

interface StoredOTP {
  otp: string;
  expiresAt: number;
  attempts: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generate a signed JWT access token (short-lived). */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.ACCESS_TOKEN_EXPIRY as any,
    issuer: "studyhub-api",
  });
}

/** Verify and decode an access token. Returns payload or throws. */
export function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, config.JWT_SECRET, {
      issuer: "studyhub-api",
    }) as TokenPayload;
  } catch (err: any) {
    throw new UnauthorizedError("Invalid or expired access token");
  }
}

/** SHA-256 hash of a raw refresh token (deterministic — enables O(1) lookup). */
function hashRefreshToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class AuthService {
  /**
   * In-memory OTP store (email → { otp, expiresAt, attempts }).
   * Fine for single-instance servers; replace with Redis for multi-instance.
   */
  private static otpStore = new Map<string, StoredOTP>();

  // ── OTP ────────────────────────────────────────────────────────────────────

  async sendOtp(email: string): Promise<void> {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) throw new ConflictError("Email already registered");

    const otp = mailService.generateOTP();
    AuthService.otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 min
      attempts: 0,
    });

    const sent = await mailService.sendOTPEmail(email, otp);
    if (!sent) throw new Error("Failed to dispatch verification email");
  }

  async verifyOtpAndCreateUser(
    fullName: string,
    email: string,
    passwordPlain: string,
    otp: string,
  ): Promise<string> {
    const stored = AuthService.otpStore.get(email);
    if (!stored)
      throw new BadRequestError("Verification code not found or expired");

    if (stored.expiresAt < Date.now()) {
      AuthService.otpStore.delete(email);
      throw new BadRequestError("Verification code has expired");
    }

    // Limit brute-force on OTP
    stored.attempts += 1;
    if (stored.attempts > 5) {
      AuthService.otpStore.delete(email);
      throw new BadRequestError(
        "Too many invalid attempts. Request a new code.",
      );
    }

    if (stored.otp !== otp)
      throw new BadRequestError("Invalid verification code");

    AuthService.otpStore.delete(email);

    // Double-check uniqueness (race condition guard)
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) throw new ConflictError("Email already registered");

    const passwordHash = await bcrypt.hash(passwordPlain, 12);
    const userId = uuidv4();

    await prisma.user.create({
      data: {
        id: userId,
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: "student",
      },
    });

    logger.info(`👤 New user registered: ${userId} (${email})`);
    return userId;
  }

  // ── Login / Logout ─────────────────────────────────────────────────────────

  async login(email: string, passwordPlain: string, req: Request) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) throw new UnauthorizedError("Invalid email or password");

    const match = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!match) throw new UnauthorizedError("Invalid email or password");

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload: TokenPayload = {
      user_id: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = generateAccessToken(payload);
    const { rawToken, family } = await this.issueRefreshToken(user.id, req);

    logger.info(`🔑 User logged in: ${user.id}`);

    return {
      access_token,
      refresh_token_raw: rawToken,
      family,
      user: {
        user_id: user.id,
        full_name: user.fullName ?? "Student",
        email: user.email,
        role: user.role,
      },
    };
  }

  async logout(userId: string, family?: string): Promise<void> {
    if (userId && family) {
      // Revoke the specific refresh token family
      await prisma.refreshToken.updateMany({
        where: { userId, family, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else if (userId) {
      // Revoke ALL refresh tokens for this user (logout-everywhere)
      await prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    logger.info(`🔌 Session revoked for user ${userId}`);
  }

  // ── Refresh Token Rotation ─────────────────────────────────────────────────

  async refreshTokens(rawToken: string, req: Request) {
    const tokenHash = hashRefreshToken(rawToken);

    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: { select: { id: true, email: true, role: true, fullName: true } },
      },
    });

    if (!stored) throw new UnauthorizedError("Invalid refresh token");

    // Token already revoked → possible reuse attack → revoke entire family
    if (stored.revokedAt !== null) {
      logger.warn(
        `⚠️ Refresh token reuse detected! Family ${stored.family} for user ${stored.userId}. Revoking all family tokens.`,
      );
      await prisma.refreshToken.updateMany({
        where: { userId: stored.userId, family: stored.family },
        data: { revokedAt: new Date() },
      });
      throw new ForbiddenError("Session compromised. Please log in again.");
    }

    // Token expired
    if (stored.expiresAt < new Date()) {
      await prisma.refreshToken.update({
        where: { tokenHash },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedError(
        "Refresh token expired. Please log in again.",
      );
    }

    const user = stored.user;

    // Revoke the consumed token and issue a new one (rotation)
    const newTokenId = uuidv4();
    const { rawToken: newRawToken } = await this.issueRefreshToken(
      user.id,
      req,
      stored.family,
    );
    await prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date(), replacedBy: newTokenId },
    });

    const payload: TokenPayload = {
      user_id: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = generateAccessToken(payload);
    logger.info(`🔄 Tokens rotated for user ${user.id}`);

    return {
      access_token,
      refresh_token_raw: newRawToken,
      family: stored.family,
      user: {
        user_id: user.id,
        full_name: user.fullName ?? "Student",
        email: user.email,
        role: user.role,
      },
    };
  }

  // ── Internal helpers ───────────────────────────────────────────────────────

  private async issueRefreshToken(
    userId: string,
    req: Request,
    existingFamily?: string,
  ): Promise<{ rawToken: string; family: string }> {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashRefreshToken(rawToken);
    const family = existingFamily ?? uuidv4();
    const expiresAt = new Date(
      Date.now() + config.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    await prisma.refreshToken.create({
      data: {
        id: uuidv4(),
        userId,
        tokenHash,
        family,
        expiresAt,
        userAgent: req.headers["user-agent"] ?? null,
        ipAddress: req.ip ?? req.socket?.remoteAddress ?? null,
      },
    });

    // Purge expired tokens for this user periodically
    prisma.refreshToken
      .deleteMany({ where: { userId, expiresAt: { lt: new Date() } } })
      .catch(() => {
        /* best-effort cleanup */
      });

    return { rawToken, family };
  }
}

export const authService = new AuthService();
