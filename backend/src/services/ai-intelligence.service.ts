import aiIntelligenceRepository from '../repositories/ai-intelligence.repository';
import aiLearnerProfileService from './ai-learner-profile.service';
import aiTopicMasteryService from './ai-topic-mastery.service';
import {
  LearnerProfileMetrics,
  TopicMasteryItem,
  DetailedRecommendationItem,
  WeeklyIntelligenceReport,
  AchievementItem,
} from '../types/ai.types';

export class AiIntelligenceService {
  async getProfile(userId: string): Promise<LearnerProfileMetrics> {
    return aiLearnerProfileService.getProfileMetrics(userId);
  }

  async getMasteries(userId: string): Promise<TopicMasteryItem[]> {
    return aiTopicMasteryService.getTopicMasteries(userId);
  }

  async getWeakTopics(userId: string): Promise<TopicMasteryItem[]> {
    return aiTopicMasteryService.getWeakTopics(userId);
  }

  async getRecommendations(userId: string): Promise<DetailedRecommendationItem[]> {
    const raw = await aiIntelligenceRepository.getRecommendationsCache(userId);

    return raw.map((r) => ({
      id: r.id,
      category: r.category,
      title: r.title,
      description: r.description,
      reason: r.reason,
      priority: r.priority as any,
      estimatedMin: r.estimatedMin,
      expectedImpact: r.expectedImpact,
      status: r.status as any,
    }));
  }

  async updateRecommendationStatus(id: string, status: string) {
    return aiIntelligenceRepository.updateRecommendationStatus(id, status);
  }

  async getWeeklyReport(userId: string): Promise<WeeklyIntelligenceReport> {
    return {
      weekLabel: 'Current Week Summary',
      hoursStudied: 4.8,
      quizzesTaken: 3,
      flashcardsReviewed: 45,
      knowledgeScoreDelta: 4.2,
      strongestTopic: 'Data Structures & Algorithms (86%)',
      needsAttentionTopic: 'Operating Systems (48%)',
    };
  }

  async getAchievements(userId: string): Promise<AchievementItem[]> {
    const raw = await aiIntelligenceRepository.getUserAchievements(userId);

    return raw.map((a) => ({
      id: a.id,
      badgeCode: a.badgeCode,
      title: a.title,
      description: a.description || 'Achievement unlocked',
      xpEarned: a.xpEarned,
      unlockedAt: a.unlockedAt.toISOString(),
      isUnlocked: true,
    }));
  }
}

export const aiIntelligenceService = new AiIntelligenceService();
export default aiIntelligenceService;
