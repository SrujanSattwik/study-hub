import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const perfLogger = (req: Request, res: Response, next: NextFunction) => {
  const reqStart = process.hrtime.bigint();
  req._dbMs = 0;
  req._cacheHit = false;

  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    const totalMs = Number(process.hrtime.bigint() - reqStart) / 1e6;
    const serializeStart = process.hrtime.bigint();
    const result = originalJson(body);
    const serializeMs = Number(process.hrtime.bigint() - serializeStart) / 1e6;
    const processingMs = totalMs - (req._dbMs || 0) - serializeMs;
    const cacheTag = req._cacheHit ? 'CACHE HIT' : 'DB';
    
    logger.info(
      `[PERF] ${req.method} ${req.path} | Total: ${totalMs.toFixed(1)}ms | DB: ${(req._dbMs || 0).toFixed(1)}ms | ` +
      `Processing: ${processingMs.toFixed(1)}ms | Serialize: ${serializeMs.toFixed(1)}ms | ${cacheTag}`
    );
    return result;
  };
  
  next();
};
