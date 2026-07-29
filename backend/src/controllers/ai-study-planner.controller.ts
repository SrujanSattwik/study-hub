import { Request, Response } from 'express';
import aiStudyPlannerService from '../services/ai-study-planner.service';
import { logger } from '../utils/logger';

export class AiStudyPlannerController {
  async generatePlan(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId || 'default-user';
      const { conversationId, topic, planType, targetGoal, daysDuration, dailyHoursLimit } = req.body;

      const plan = await aiStudyPlannerService.generatePlan(userId, {
        conversationId,
        topic,
        planType,
        targetGoal,
        daysDuration: daysDuration ? parseInt(daysDuration, 10) : 7,
        dailyHoursLimit: dailyHoursLimit ? parseInt(dailyHoursLimit, 10) : 2,
      });

      res.status(201).json({ success: true, data: plan });
    } catch (err: any) {
      logger.error(`[AI PLANNER CONTROLLER] generatePlan error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async listPlans(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId || 'default-user';
      const { status } = req.query;

      const plans = await aiStudyPlannerService.listPlans(userId, status as string);
      res.json({ success: true, data: plans });
    } catch (err: any) {
      logger.error(`[AI PLANNER CONTROLLER] listPlans error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getPlanById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const plan = await aiStudyPlannerService.getPlanById(id);

      if (!plan) {
        res.status(404).json({ success: false, error: 'Plan not found' });
        return;
      }

      res.json({ success: true, data: plan });
    } catch (err: any) {
      logger.error(`[AI PLANNER CONTROLLER] getPlanById error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async updatePlanStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updated = await aiStudyPlannerService.updatePlanStatus(id, status);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      logger.error(`[AI PLANNER CONTROLLER] updatePlanStatus error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async updateTaskStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updated = await aiStudyPlannerService.updateTaskStatus(id, status);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      logger.error(`[AI PLANNER CONTROLLER] updateTaskStatus error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async createGoal(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId || 'default-user';
      const { title, description, targetCategory, targetValue, unit, targetDate } = req.body;

      const goal = await aiStudyPlannerService.createGoal(userId, {
        userId,
        title,
        description,
        targetCategory,
        targetValue: targetValue ? parseInt(targetValue, 10) : 100,
        unit: unit || 'tasks',
        targetDate: targetDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      });

      res.status(201).json({ success: true, data: goal });
    } catch (err: any) {
      logger.error(`[AI PLANNER CONTROLLER] createGoal error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async listGoals(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId || 'default-user';
      const goals = await aiStudyPlannerService.listGoals(userId);
      res.json({ success: true, data: goals });
    } catch (err: any) {
      logger.error(`[AI PLANNER CONTROLLER] listGoals error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async logSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId || 'default-user';
      const { durationSec, sessionType, tasksCompletedCount, notesUsed, flashcardsReviewed, quizzesTaken, startedAt } = req.body;

      const session = await aiStudyPlannerService.logSession(userId, {
        userId,
        durationSec: durationSec ? parseInt(durationSec, 10) : 1500,
        sessionType,
        tasksCompletedCount: tasksCompletedCount ? parseInt(tasksCompletedCount, 10) : 0,
        notesUsed: notesUsed ? parseInt(notesUsed, 10) : 0,
        flashcardsReviewed: flashcardsReviewed ? parseInt(flashcardsReviewed, 10) : 0,
        quizzesTaken: quizzesTaken ? parseInt(quizzesTaken, 10) : 0,
        startedAt,
      });

      res.status(201).json({ success: true, data: session });
    } catch (err: any) {
      logger.error(`[AI PLANNER CONTROLLER] logSession error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getProgressSummary(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId || 'default-user';
      const summary = await aiStudyPlannerService.getProgressSummary(userId);
      res.json({ success: true, data: summary });
    } catch (err: any) {
      logger.error(`[AI PLANNER CONTROLLER] getProgressSummary error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getSmartRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId || 'default-user';
      const items = await aiStudyPlannerService.getSmartRecommendations(userId);
      res.json({ success: true, data: items });
    } catch (err: any) {
      logger.error(`[AI PLANNER CONTROLLER] getSmartRecommendations error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const aiStudyPlannerController = new AiStudyPlannerController();
export default aiStudyPlannerController;
