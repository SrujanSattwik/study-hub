import { Request, Response, NextFunction } from 'express';
import { aiUsageService } from '../services/ai-usage.service';
import { BadRequestError } from '../utils/errors';

export class AiUsageController {
  async getUsageStats(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.user_id) throw new BadRequestError('User details missing');
      const stats = await aiUsageService.getUserStats(req.user.user_id);
      res.json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const aiUsageController = new AiUsageController();
