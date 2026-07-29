import { Request, Response, NextFunction } from 'express';

export function sanitizationMiddleware(req: Request, res: Response, next: NextFunction) {
  // Set security response headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Verify request body size limit (prevent payload flooding)
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024; // 10MB limit

  if (contentLength > MAX_PAYLOAD_BYTES) {
    res.status(413).json({
      success: false,
      error: 'Payload Too Large. Maximum allowed size is 10MB.',
    });
    return;
  }

  next();
}
