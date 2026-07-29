import { Request, Response } from 'express';
import aiIntelligenceService from '../services/ai-intelligence.service';
import { logger } from '../utils/logger';

export class AiIntelligenceController {
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId || 'default-user';
      const profile = await aiIntelligenceService.getProfile(userId);
      res.json({ success: true, data: profile });
    } catch (err: any) {
      logger.error(`[AI INTELLIGENCE CONTROLLER] getProfile error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getMasteries(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId || 'default-user';
      const masteries = await aiIntelligenceService.getMasteries(userId);
      res.json({ success: true, data: masteries });
    } catch (err: any) {
      logger.error(`[AI INTELLIGENCE CONTROLLER] getMasteries error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getWeakTopics(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId || 'default-user';
      const weakTopics = await aiIntelligenceService.getWeakTopics(userId);
      res.json({ success: true, data: weakTopics });
    } catch (err: any) {
      logger.error(`[AI INTELLIGENCE CONTROLLER] getWeakTopics error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId || 'default-user';
      const recs = await aiIntelligenceService.getRecommendations(userId);
      res.json({ success: true, data: recs });
    } catch (err: any) {
      logger.error(`[AI INTELLIGENCE CONTROLLER] getRecommendations error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async updateRecommendationStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updated = await aiIntelligenceService.updateRecommendationStatus(id, status);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      logger.error(`[AI INTELLIGENCE CONTROLLER] updateRecommendationStatus error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getWeeklyReport(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId || 'default-user';
      const report = await aiIntelligenceService.getWeeklyReport(userId);
      res.json({ success: true, data: report });
    } catch (err: any) {
      logger.error(`[AI INTELLIGENCE CONTROLLER] getWeeklyReport error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getAchievements(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId || 'default-user';
      const achievements = await aiIntelligenceService.getAchievements(userId);
      res.json({ success: true, data: achievements });
    } catch (err: any) {
      logger.error(`[AI INTELLIGENCE CONTROLLER] getAchievements error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const aiIntelligenceController = new AiIntelligenceController();
export default aiIntelligenceController;
