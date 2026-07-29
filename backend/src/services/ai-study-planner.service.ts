import aiStudyPlannerRepository from '../repositories/ai-study-planner.repository';
import aiStudyPlannerGeneratorService from './ai-study-planner-generator.service';
import { AiStudyPlan, AiStudyGoal, AiStudySession, AiStudyTask } from '@prisma/client';
import {
  GenerateStudyPlanDTO,
  CreateStudyGoalDTO,
  LogStudySessionDTO,
  LearningProgressSummary,
  SmartRecommendationItem,
} from '../types/ai.types';

export class AiStudyPlannerService {
  /**
   * Generate an AI Study Plan with tasks and start/end dates.
   */
  async generatePlan(
    userId: string,
    params: GenerateStudyPlanDTO
  ): Promise<AiStudyPlan & { tasks: AiStudyTask[] }> {
    const generated = await aiStudyPlannerGeneratorService.generateStudyPlan(userId, params);

    const startDate = new Date();
    const days = params.daysDuration || 7;
    const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);

    const taskItems = generated.tasks.map((t, idx) => {
      const taskDueDate = new Date(startDate.getTime() + t.dayOffset * 24 * 60 * 60 * 1000);
      return {
        title: t.title,
        description: t.description,
        taskType: t.taskType,
        dueDate: taskDueDate,
        durationMin: t.durationMin,
        orderIndex: idx + 1,
      };
    });

    return aiStudyPlannerRepository.createPlan({
      userId,
      conversationId: params.conversationId,
      title: generated.title,
      description: generated.description,
      planType: params.planType || 'weekly',
      status: 'active',
      startDate,
      endDate,
      targetGoal: generated.targetGoal,
      tasks: taskItems,
    });
  }

  /**
   * List user study plans.
   */
  async listPlans(userId: string, status?: string): Promise<Array<AiStudyPlan & { _count: { tasks: number } }>> {
    return aiStudyPlannerRepository.findUserPlans(userId, status);
  }

  /**
   * Get plan details by ID.
   */
  async getPlanById(id: string): Promise<(AiStudyPlan & { tasks: AiStudyTask[] }) | null> {
    return aiStudyPlannerRepository.findPlanById(id);
  }

  /**
   * Update plan status.
   */
  async updatePlanStatus(id: string, status: string): Promise<AiStudyPlan> {
    return aiStudyPlannerRepository.updatePlanStatus(id, status);
  }

  /**
   * Update task status.
   */
  async updateTaskStatus(taskId: string, status: string): Promise<AiStudyTask> {
    return aiStudyPlannerRepository.updateTaskStatus(taskId, status);
  }

  /**
   * Create goal.
   */
  async createGoal(userId: string, data: CreateStudyGoalDTO): Promise<AiStudyGoal> {
    return aiStudyPlannerRepository.createGoal({
      ...data,
      userId,
    });
  }

  /**
   * List user goals.
   */
  async listGoals(userId: string): Promise<AiStudyGoal[]> {
    return aiStudyPlannerRepository.findUserGoals(userId);
  }

  /**
   * Log focus study session.
   */
  async logSession(userId: string, data: LogStudySessionDTO): Promise<AiStudySession> {
    return aiStudyPlannerRepository.createSession({
      ...data,
      userId,
    });
  }

  /**
   * Get learning progress summary & heatmap.
   */
  async getProgressSummary(userId: string): Promise<LearningProgressSummary> {
    return aiStudyPlannerRepository.getUserProgressSummary(userId);
  }

  /**
   * Get categorized smart AI recommendations.
   */
  async getSmartRecommendations(userId: string): Promise<SmartRecommendationItem[]> {
    const summary = await aiStudyPlannerRepository.getUserProgressSummary(userId);

    const recommendations: SmartRecommendationItem[] = [];

    if (summary.activeStreakDays < 3) {
      recommendations.push({
        category: 'deadlines',
        title: '🔥 Build Your Daily Streak',
        description: 'Log a 25-minute focus session today to build a continuous study streak!',
        priority: 'high',
      });
    }

    if (summary.quizAccuracyPct < 75) {
      recommendations.push({
        category: 'weak_topics',
        title: '🎯 Review Low Quiz Accuracy Topics',
        description: 'Your recent quiz score is below 75%. Retake weak quiz questions or generate flashcards.',
        priority: 'high',
      });
    }

    recommendations.push({
      category: 'revision',
      title: '📖 Scheduled Revision Check',
      description: 'Review active notes and flashcard decks before your next upcoming quiz session.',
      priority: 'medium',
    });

    recommendations.push({
      category: 'upcoming_goals',
      title: '🚀 Milestone Goal Progress',
      description: 'You have active study goals in progress. Complete daily tasks to hit 100% completion.',
      priority: 'medium',
    });

    return recommendations;
  }
}

export const aiStudyPlannerService = new AiStudyPlannerService();
export default aiStudyPlannerService;
