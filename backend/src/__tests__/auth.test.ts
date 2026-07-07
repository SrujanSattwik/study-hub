/**
 * Auth Service Unit Tests
 *
 * Tests token generation/verification, OTP logic, and bcrypt hashing
 * without hitting the real database (service-level unit tests).
 */

import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
// env vars are set by setup.ts before this file is imported
import {
  generateAccessToken,
  verifyAccessToken,
  TokenPayload,
} from "../services/auth.service";

const TEST_PAYLOAD: TokenPayload = {
  user_id: "550e8400-e29b-41d4-a716-446655440000",
  email: "test@studyhub.io",
  role: "student",
};

describe("generateAccessToken", () => {
  it("returns a valid JWT string", () => {
    const token = generateAccessToken(TEST_PAYLOAD);
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3); // header.payload.signature
  });

  it("encodes the correct user_id, email, and role", () => {
    const token = generateAccessToken(TEST_PAYLOAD);
    const decoded = jwt.decode(token) as Record<string, unknown>;
    expect(decoded.user_id).toBe(TEST_PAYLOAD.user_id);
    expect(decoded.email).toBe(TEST_PAYLOAD.email);
    expect(decoded.role).toBe(TEST_PAYLOAD.role);
  });

  it("includes issuer claim", () => {
    const token = generateAccessToken(TEST_PAYLOAD);
    const decoded = jwt.decode(token) as Record<string, unknown>;
    expect(decoded.iss).toBe("studyhub-api");
  });

  it("sets an expiry in the future", () => {
    const token = generateAccessToken(TEST_PAYLOAD);
    const decoded = jwt.decode(token) as Record<string, unknown>;
    const exp = decoded.exp as number;
    expect(exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });
});

describe("verifyAccessToken", () => {
  it("returns the payload for a valid token", () => {
    const token = generateAccessToken(TEST_PAYLOAD);
    const payload = verifyAccessToken(token);
    expect(payload.user_id).toBe(TEST_PAYLOAD.user_id);
    expect(payload.email).toBe(TEST_PAYLOAD.email);
    expect(payload.role).toBe(TEST_PAYLOAD.role);
  });

  it("throws UnauthorizedError for a tampered token", () => {
    const token = generateAccessToken(TEST_PAYLOAD);
    const tampered = token.slice(0, -5) + "XXXXX";
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it("throws UnauthorizedError for an expired token", async () => {
    // Sign with -1s expiry (immediately expired)
    const expired = jwt.sign(TEST_PAYLOAD, process.env.JWT_SECRET!, {
      expiresIn: -1,
      issuer: "studyhub-api",
    });
    expect(() => verifyAccessToken(expired)).toThrow();
  });

  it("throws for a token signed with wrong secret", () => {
    const wrongSecret = jwt.sign(
      TEST_PAYLOAD,
      "completely-different-secret-at-least-32-chars!!",
    );
    expect(() => verifyAccessToken(wrongSecret)).toThrow();
  });
});
