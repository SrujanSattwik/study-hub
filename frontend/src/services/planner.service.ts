import api from './api';
import {
  AiStudyPlan,
  AiStudyTask,
  AiStudyGoal,
  AiStudySession,
  GenerateStudyPlanDTO,
  LearningProgressSummary,
  SmartRecommendationItem,
} from '../types/ai.types';

export const plannerService = {
  /**
   * Generate AI Study Plan.
   */
  generatePlan: async (dto: GenerateStudyPlanDTO): Promise<AiStudyPlan> => {
    const res = await api.post<{ success: boolean; data: AiStudyPlan }>('/api/ai/planner/plans/generate', dto);
    return res.data.data;
  },

  /**
   * List Study Plans.
   */
  listPlans: async (status?: string): Promise<AiStudyPlan[]> => {
    const res = await api.get<{ success: boolean; data: AiStudyPlan[] }>('/api/ai/planner/plans', { params: { status } });
    return res.data.data;
  },

  /**
   * Get Plan Details by ID.
   */
  getPlanDetails: async (id: string): Promise<AiStudyPlan> => {
    const res = await api.get<{ success: boolean; data: AiStudyPlan }>(`/api/ai/planner/plans/${id}`);
    return res.data.data;
  },

  /**
   * Update Plan Status.
   */
  updatePlanStatus: async (id: string, status: string): Promise<AiStudyPlan> => {
    const res = await api.patch<{ success: boolean; data: AiStudyPlan }>(`/api/ai/planner/plans/${id}/status`, { status });
    return res.data.data;
  },

  /**
   * Update Task Status.
   */
  updateTaskStatus: async (taskId: string, status: string): Promise<AiStudyTask> => {
    const res = await api.patch<{ success: boolean; data: AiStudyTask }>(`/api/ai/planner/tasks/${taskId}`, { status });
    return res.data.data;
  },

  /**
   * Create Goal.
   */
  createGoal: async (data: { title: string; description?: string; targetCategory?: string; targetValue?: number; targetDate: string }): Promise<AiStudyGoal> => {
    const res = await api.post<{ success: boolean; data: AiStudyGoal }>('/api/ai/planner/goals', data);
    return res.data.data;
  },

  /**
   * List Goals.
   */
  listGoals: async (): Promise<AiStudyGoal[]> => {
    const res = await api.get<{ success: boolean; data: AiStudyGoal[] }>('/api/ai/planner/goals');
    return res.data.data;
  },

  /**
   * Log Study Focus Session.
   */
  logSession: async (data: { durationSec: number; sessionType?: string; tasksCompletedCount?: number }): Promise<AiStudySession> => {
    const res = await api.post<{ success: boolean; data: AiStudySession }>('/api/ai/planner/sessions', data);
    return res.data.data;
  },

  /**
   * Get Learning Progress Summary & Heatmap.
   */
  getProgressSummary: async (): Promise<LearningProgressSummary> => {
    const res = await api.get<{ success: boolean; data: LearningProgressSummary }>('/api/ai/planner/progress');
    return res.data.data;
  },

  /**
   * Get Categorized Recommendations.
   */
  getRecommendations: async (): Promise<SmartRecommendationItem[]> => {
    const res = await api.get<{ success: boolean; data: SmartRecommendationItem[] }>('/api/ai/planner/recommendations');
    return res.data.data;
  },
};

export default plannerService;
