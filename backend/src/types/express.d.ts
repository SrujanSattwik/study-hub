import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      _dbMs: number;
      _cacheHit: boolean;
      user?: {
        user_id: string;
        full_name: string;
        email: string;
        role: Role | string;
      };
    }
  }
}
