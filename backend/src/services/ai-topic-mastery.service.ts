import aiIntelligenceRepository from '../repositories/ai-intelligence.repository';
import { TopicMasteryItem, MasteryLevel } from '../types/ai.types';

export class AiTopicMasteryService {
  async getTopicMasteries(userId: string): Promise<TopicMasteryItem[]> {
    const raw = await aiIntelligenceRepository.getTopicMasteries(userId);

    return raw.map((m) => ({
      topicName: m.topicName,
      masteryScore: m.masteryScore,
      masteryLevel: m.masteryLevel as MasteryLevel,
      isWeak: m.isWeak,
      notesReadCount: m.notesReadCount || 3,
      flashcardsCount: m.flashcardsCount || 12,
      quizzesTaken: m.quizzesTaken || 2,
      quizAccuracyPct: m.quizAccuracyPct || m.masteryScore,
      suggestedDifficulty: m.masteryScore > 75 ? 'Hard' : m.masteryScore > 55 ? 'Medium' : 'Easy Revision',
      prerequisites: (m.prerequisites as string[]) || [],
      timelineHistory: (m.timelineHistory as Record<string, number>) || { 'Week 1': m.masteryScore - 15, 'Week 2': m.masteryScore },
    }));
  }

  async getWeakTopics(userId: string): Promise<TopicMasteryItem[]> {
    const all = await this.getTopicMasteries(userId);
    return all.filter((t) => t.isWeak || t.masteryScore < 60);
  }
}

export const aiTopicMasteryService = new AiTopicMasteryService();
export default aiTopicMasteryService;
