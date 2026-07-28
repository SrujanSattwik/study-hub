import { prisma } from '../database/client';
import { AiUsage } from '@prisma/client';

export class AiUsageRepository {
  async recordUsage(
    userId: string,
    promptTokens: number,
    completionTokens: number
  ): Promise<AiUsage> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalTokens = promptTokens + completionTokens;

    const existing = await prisma.aiUsage.findFirst({
      where: {
        userId,
        date: {
          gte: today,
        },
      },
    });

    if (existing) {
      return prisma.aiUsage.update({
        where: { id: existing.id },
        data: {
          promptTokens: { increment: promptTokens },
          completionTokens: { increment: completionTokens },
          totalTokens: { increment: totalTokens },
          requestCount: { increment: 1 },
        },
      });
    }

    return prisma.aiUsage.create({
      data: {
        userId,
        promptTokens,
        completionTokens,
        totalTokens,
        requestCount: 1,
        date: today,
      },
    });
  }

  async getUserStats(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayUsage, monthlyUsage, totalConversations, totalFlashcards] = await Promise.all([
      prisma.aiUsage.aggregate({
        where: { userId, date: { gte: today } },
        _sum: { promptTokens: true, completionTokens: true, totalTokens: true, requestCount: true },
      }),
      prisma.aiUsage.aggregate({
        where: { userId, date: { gte: firstDayOfMonth } },
        _sum: { promptTokens: true, completionTokens: true, totalTokens: true, requestCount: true },
      }),
      prisma.aiConversation.count({ where: { userId, isDeleted: false } }),
      prisma.aiFlashcard.count({ where: { userId } }),
    ]);

    return {
      today: {
        promptTokens: todayUsage._sum.promptTokens || 0,
        completionTokens: todayUsage._sum.completionTokens || 0,
        totalTokens: todayUsage._sum.totalTokens || 0,
        requestCount: todayUsage._sum.requestCount || 0,
      },
      monthly: {
        promptTokens: monthlyUsage._sum.promptTokens || 0,
        completionTokens: monthlyUsage._sum.completionTokens || 0,
        totalTokens: monthlyUsage._sum.totalTokens || 0,
        requestCount: monthlyUsage._sum.requestCount || 0,
      },
      totalConversations,
      totalFlashcards,
    };
  }
}

export const aiUsageRepository = new AiUsageRepository();
