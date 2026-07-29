import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export function observabilityMiddleware(req: Request, res: Response, next: NextFunction) {
  // Attach correlation ID to request and response header
  const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('x-correlation-id', correlationId);

  const startHrTime = process.hrtime();

  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedMs = Math.round((elapsedHrTime[0] * 1000) + (elapsedHrTime[1] / 1e6));

    const userId = (req as any).user?.id || (req as any).user?.userId || 'anonymous';
    const statusCode = res.statusCode;

    logger.info(`[HTTP] ${req.method} ${req.originalUrl} ${statusCode} - ${elapsedMs}ms`, {
      correlationId,
      userId,
      route: req.originalUrl,
      method: req.method,
      statusCode,
      latencyMs: elapsedMs,
    });
  });

  next();
}
