import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import {
  sendOtpSchema,
  verifyOtpSignupSchema,
  loginSchema,
} from "../validators/auth.validator";
import { BadRequestError, UnauthorizedError } from "../utils/errors";
import { config } from "../utils/config";

/** Shared cookie options for the refresh token HttpOnly cookie. */
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: config.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  path: "/auth/refresh",
  ...(config.COOKIE_DOMAIN ? { domain: config.COOKIE_DOMAIN } : {}),
};

/** Clear cookie helper — matches REFRESH_COOKIE_OPTIONS except maxAge=0. */
const clearRefreshCookie = (res: Response) => {
  res.clearCookie("studyhub_rt", {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "strict",
    path: "/auth/refresh",
    ...(config.COOKIE_DOMAIN ? { domain: config.COOKIE_DOMAIN } : {}),
  });
};

export class AuthController {
  async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const body = sendOtpSchema.parse(req.body);
      await authService.sendOtp(body.email);
      res.json({ success: true, message: "OTP sent to your email" });
    } catch (err) {
      next(err);
    }
  }

  async verifyOtpSignup(req: Request, res: Response, next: NextFunction) {
    try {
      const body = verifyOtpSignupSchema.parse(req.body);
      const userId = await authService.verifyOtpAndCreateUser(
        body.fullName,
        body.email,
        body.password,
        body.otp,
      );
      res.status(201).json({
        success: true,
        message: "Account created successfully",
        userId,
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const body = loginSchema.parse(req.body);
      const result = await authService.login(body.email, body.password, req);

      // Set refresh token in HttpOnly cookie — not accessible from JS
      res.cookie(
        "studyhub_rt",
        result.refresh_token_raw,
        REFRESH_COOKIE_OPTIONS,
      );

      // Return access token in response body (stored in memory / localStorage by client)
      res.json({
        success: true,
        access_token: result.access_token,
        user: result.user,
      });
    } catch (err) {
      // Keep as next(err) so error middleware handles it with proper status code
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const rawToken = req.cookies?.studyhub_rt;
      if (!rawToken) throw new UnauthorizedError("No refresh token provided");

      const result = await authService.refreshTokens(rawToken, req);

      // Rotate: set new refresh token cookie
      res.cookie(
        "studyhub_rt",
        result.refresh_token_raw,
        REFRESH_COOKIE_OPTIONS,
      );

      res.json({
        success: true,
        access_token: result.access_token,
        user: result.user,
      });
    } catch (err) {
      clearRefreshCookie(res);
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.user_id;
      const rawToken = req.cookies?.studyhub_rt;

      if (userId) {
        // Get the family from the refresh token to revoke just this session
        // For simplicity, logout revokes all sessions for the user
        await authService.logout(userId);
      } else if (rawToken) {
        // Token not fully authenticated but we still clear cookie
      }

      clearRefreshCookie(res);
      res.json({ success: true, message: "Logged out successfully" });
    } catch (err) {
      clearRefreshCookie(res);
      next(err);
    }
  }

  getSession(req: Request, res: Response, next: NextFunction) {
    if (!req.user) return next(new BadRequestError("Active session not found"));
    res.json({ success: true, user: req.user });
  }
}

export const authController = new AuthController();
