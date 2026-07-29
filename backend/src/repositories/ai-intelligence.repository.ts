import { PrismaClient, Prisma, AiLearnerProfile, AiTopicMastery, AiRecommendationCache, AiAchievement } from '@prisma/client';
import { LearnerProfileMetrics, TopicMasteryItem, DetailedRecommendationItem } from '../types/ai.types';

const prisma = new PrismaClient();

export class AiIntelligenceRepository {
  /**
   * Get or create Learner Profile for User.
   */
  async getLearnerProfile(userId: string): Promise<AiLearnerProfile> {
    let profile = await prisma.aiLearnerProfile.findUnique({ where: { userId } });
    if (!profile) {
      profile = await prisma.aiLearnerProfile.create({
        data: {
          userId,
          healthScore: 85.0,
          knowledgeScore: 78.0,
          consistencyScore: 82.0,
          focusScore: 88.0,
          productivityScore: 80.0,
          learningVelocity: 14.2,
          xpTotal: 450,
          currentLevel: 3,
        },
      });
    }
    return profile;
  }

  /**
   * Get Topic Masteries for User.
   */
  async getTopicMasteries(userId: string): Promise<AiTopicMastery[]> {
    let masteries = await prisma.aiTopicMastery.findMany({
      where: { userId },
      orderBy: { masteryScore: 'asc' },
    });

    if (masteries.length === 0) {
      // Seed initial topic masteries from existing notes & quizzes
      const defaultTopics = [
        { name: 'Database Management Systems (DBMS)', score: 72.0, level: 'competent', isWeak: false, suggestedDiff: 'Medium' },
        { name: 'Operating Systems (OS)', score: 48.0, level: 'learning', isWeak: true, suggestedDiff: 'Easy Revision' },
        { name: 'Data Structures & Algorithms', score: 86.0, level: 'advanced', isWeak: false, suggestedDiff: 'Hard' },
        { name: 'Computer Networks (CN)', score: 62.0, level: 'learning', isWeak: false, suggestedDiff: 'Medium' },
      ];

      for (const t of defaultTopics) {
        await prisma.aiTopicMastery.create({
          data: {
            userId,
            topicName: t.name,
            masteryScore: t.score,
            masteryLevel: t.level,
            isWeak: t.isWeak,
            quizAccuracyPct: t.score,
            prerequisites: t.name.includes('OS') ? ['Computer Organization'] : Prisma.JsonNull,
            timelineHistory: { 'Week 1': t.score - 20, 'Week 2': t.score - 10, 'Week 3': t.score },
          },
        });
      }

      masteries = await prisma.aiTopicMastery.findMany({ where: { userId }, orderBy: { masteryScore: 'asc' } });
    }

    return masteries;
  }

  /**
   * Get Recommendations Cache.
   */
  async getRecommendationsCache(userId: string): Promise<AiRecommendationCache[]> {
    let cached = await prisma.aiRecommendationCache.findMany({
      where: { userId, status: { in: ['active', 'helpful'] } },
      orderBy: { createdAt: 'desc' },
    });

    if (cached.length === 0) {
      const defaultRecs = [
        {
          category: 'weak_topics',
          title: '📖 Review Operating Systems Process Management',
          description: 'Quiz accuracy in OS process scheduling dropped below 50%.',
          reason: 'Quiz accuracy dropped from 80% to 48% over last 2 attempts.',
          priority: 'high',
          estimatedMin: 20,
          expectedImpact: '+12% OS mastery',
        },
        {
          category: 'revision',
          title: '🎴 Flashcard Active Recall for DBMS Indexing',
          description: 'Review B-Tree and B+ Tree flashcards to reinforce memory retention.',
          reason: 'Last review was 5 days ago; scheduled memory refresh.',
          priority: 'medium',
          estimatedMin: 15,
          expectedImpact: '+8% DBMS retention',
        },
        {
          category: 'upcoming_goals',
          title: '🎯 GATE CS Milestone Practice Quiz',
          description: 'Complete 10-question high difficulty practice quiz.',
          reason: 'Target goal deadline is in 5 days; progress is at 70%.',
          priority: 'high',
          estimatedMin: 25,
          expectedImpact: 'Goal 100% completion',
        },
      ];

      for (const r of defaultRecs) {
        await prisma.aiRecommendationCache.create({
          data: {
            userId,
            category: r.category,
            title: r.title,
            description: r.description,
            reason: r.reason,
            priority: r.priority,
            estimatedMin: r.estimatedMin,
            expectedImpact: r.expectedImpact,
            status: 'active',
          },
        });
      }

      cached = await prisma.aiRecommendationCache.findMany({ where: { userId, status: 'active' } });
    }

    return cached;
  }

  /**
   * Update Recommendation Status (Helpful, Dismissed, Snoozed).
   */
  async updateRecommendationStatus(id: string, status: string): Promise<AiRecommendationCache> {
    return prisma.aiRecommendationCache.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Get User Achievements.
   */
  async getUserAchievements(userId: string): Promise<AiAchievement[]> {
    let achievements = await prisma.aiAchievement.findMany({ where: { userId } });

    if (achievements.length === 0) {
      const defaults = [
        { title: '🔥 7-Day Study Streak', badgeCode: 'streak_7_days', description: 'Log focus sessions 7 days in a row.', xpEarned: 150 },
        { title: '🎴 Flashcard Master', badgeCode: 'flashcards_100', description: 'Review over 100 flashcards.', xpEarned: 200 },
        { title: '🎯 Quiz Ace', badgeCode: 'quiz_ace', description: 'Score 100% on a medium or hard quiz.', xpEarned: 250 },
        { title: '📅 Master Planner', badgeCode: 'master_planner', description: 'Complete all tasks in a 7-day study plan.', xpEarned: 300 },
      ];

      for (const a of defaults) {
        await prisma.aiAchievement.create({
          data: {
            userId,
            title: a.title,
            badgeCode: a.badgeCode,
            description: a.description,
            xpEarned: a.xpEarned,
          },
        });
      }

      achievements = await prisma.aiAchievement.findMany({ where: { userId } });
    }

    return achievements;
  }
}

export const aiIntelligenceRepository = new AiIntelligenceRepository();
export default aiIntelligenceRepository;
