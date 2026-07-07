import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. Handled Operational App Errors
  if (err instanceof AppError) {
    logger.warn(`[API ERROR] ${err.statusCode} | ${req.method} ${req.path} | Message: ${err.message}`);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // 2. Handle Zod validation errors
  if (err instanceof ZodError) {
    const errorMsg = err.errors.map(x => `${x.path.join('.')}: ${x.message}`).join(', ');
    logger.warn(`[VALIDATION ERROR] 400 | ${req.method} ${req.path} | Errors: ${errorMsg}`);
    return res.status(400).json({
      success: false,
      message: `Validation failed: ${errorMsg}`
    });
  }

  // 3. Handle Prisma / PG unique constraint errors (e.g. 23505)
  // Prisma unique constraint code is P2002
  const errAny = err as any;
  if (errAny.code === 'P2002' || errAny.code === '23505') {
    logger.warn(`[CONFLICT ERROR] 409 | ${req.method} ${req.path} | Unique constraint violation`);
    return res.status(409).json({
      success: false,
      message: 'Email or entity already exists'
    });
  }

  // 4. Unhandled Internal System Errors
  logger.error(`[SYSTEM ERROR] 500 | ${req.method} ${req.path} | Error: ${err.stack || err.message}`);
  return res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred'
  });
};
