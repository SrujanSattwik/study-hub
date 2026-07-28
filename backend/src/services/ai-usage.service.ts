import { aiUsageRepository } from '../repositories/ai-usage.repository';

export class AiUsageService {
  async recordUsage(userId: string, promptTokens: number, completionTokens: number) {
    return aiUsageRepository.recordUsage(userId, promptTokens, completionTokens);
  }

  async getUserStats(userId: string) {
    return aiUsageRepository.getUserStats(userId);
  }
}

export const aiUsageService = new AiUsageService();
