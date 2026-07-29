import aiIntelligenceRepository from '../repositories/ai-intelligence.repository';
import { LearnerProfileMetrics } from '../types/ai.types';

export class AiLearnerProfileService {
  async getProfileMetrics(userId: string): Promise<LearnerProfileMetrics> {
    const profile = await aiIntelligenceRepository.getLearnerProfile(userId);

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 14);

    return {
      healthScore: profile.healthScore,
      knowledgeScore: profile.knowledgeScore,
      consistencyScore: profile.consistencyScore,
      focusScore: profile.focusScore,
      productivityScore: profile.productivityScore,
      learningVelocity: profile.learningVelocity,
      xpTotal: profile.xpTotal,
      currentLevel: profile.currentLevel,
      forecastedCompletionDate: targetDate.toISOString().slice(0, 10),
      forecastConfidencePct: 91,
    };
  }
}

export const aiLearnerProfileService = new AiLearnerProfileService();
export default aiLearnerProfileService;
