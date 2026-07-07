import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/auth.service";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";

/**
 * Validates the JWT access token from the Authorization header.
 * Attaches decoded user payload to req.user on success.
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return next(new UnauthorizedError("Access token required"));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      user_id: payload.user_id,
      full_name: "", // Not stored in JWT payload — fetch from DB if needed
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch {
    next(new ForbiddenError("Invalid or expired access token"));
  }
};

/**
 * Middleware factory that additionally enforces minimum role.
 * Role hierarchy: student < admin < owner
 */
const ROLE_RANK: Record<string, number> = { student: 0, admin: 1, owner: 2 };

export const requireRole = (minRole: "admin" | "owner") => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError("Not authenticated"));
    const userRank = ROLE_RANK[req.user.role] ?? -1;
    const minRank = ROLE_RANK[minRole];
    if (userRank < minRank) {
      return next(new ForbiddenError("Insufficient permissions"));
    }
    next();
  };
};
