import api from './api';
import {
  LearnerProfileMetrics,
  TopicMasteryItem,
  DetailedRecommendationItem,
  WeeklyIntelligenceReport,
  AchievementItem,
} from '../types/ai.types';

export const intelligenceService = {
  getProfile: async (): Promise<LearnerProfileMetrics> => {
    const res = await api.get<{ success: boolean; data: LearnerProfileMetrics }>('/api/ai/intelligence/profile');
    return res.data.data;
  },

  getMasteries: async (): Promise<TopicMasteryItem[]> => {
    const res = await api.get<{ success: boolean; data: TopicMasteryItem[] }>('/api/ai/intelligence/mastery');
    return res.data.data;
  },

  getWeakTopics: async (): Promise<TopicMasteryItem[]> => {
    const res = await api.get<{ success: boolean; data: TopicMasteryItem[] }>('/api/ai/intelligence/weak-topics');
    return res.data.data;
  },

  getRecommendations: async (): Promise<DetailedRecommendationItem[]> => {
    const res = await api.get<{ success: boolean; data: DetailedRecommendationItem[] }>('/api/ai/intelligence/recommendations');
    return res.data.data;
  },

  sendRecommendationFeedback: async (id: string, status: 'helpful' | 'dismissed' | 'snoozed'): Promise<void> => {
    await api.post(`/api/ai/intelligence/recommendations/${id}/feedback`, { status });
  },

  getWeeklyReport: async (): Promise<WeeklyIntelligenceReport> => {
    const res = await api.get<{ success: boolean; data: WeeklyIntelligenceReport }>('/api/ai/intelligence/weekly-report');
    return res.data.data;
  },

  getAchievements: async (): Promise<AchievementItem[]> => {
    const res = await api.get<{ success: boolean; data: AchievementItem[] }>('/api/ai/intelligence/achievements');
    return res.data.data;
  },
};

export default intelligenceService;
