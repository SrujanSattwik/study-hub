import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';

export class AiController {
  async ask(req: Request, res: Response, next: NextFunction) {
    try {
      const { parts, question } = req.body;
      const answer = await aiService.askGemini(parts, question);
      res.json({ answer });
    } catch (err) {
      next(err);
    }
  }
}
export const aiController = new AiController();
