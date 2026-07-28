import { PrismaClient, AiQuiz, AiQuizQuestion, AiQuizAttempt, Prisma } from '@prisma/client';
import { PaginatedResult } from '../types/ai.types';

const prisma = new PrismaClient();

export class AiQuizRepository {
  /**
   * Create Quiz with Questions in a transaction.
   */
  async createQuiz(data: {
    userId: string;
    conversationId?: string;
    title: string;
    description?: string;
    topic?: string;
    sourceType?: string;
    difficulty?: string;
    timeLimitSec?: number;
    isTemplate?: boolean;
    questions: Array<{
      questionText: string;
      questionType: string;
      options?: string[];
      correctAnswer: string;
      explanation?: string;
      codeSnippet?: string;
      aiConfidence?: number;
      orderIndex: number;
    }>;
  }): Promise<AiQuiz & { questions: AiQuizQuestion[] }> {
    return prisma.aiQuiz.create({
      data: {
        userId: data.userId,
        conversationId: data.conversationId || null,
        title: data.title,
        description: data.description || null,
        topic: data.topic || null,
        sourceType: data.sourceType || 'custom',
        difficulty: data.difficulty || 'medium',
        timeLimitSec: data.timeLimitSec || 300,
        isTemplate: data.isTemplate || false,
        questions: {
          create: data.questions.map((q) => ({
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options ? (q.options as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || null,
            codeSnippet: q.codeSnippet || null,
            aiConfidence: q.aiConfidence || 0.9,
            orderIndex: q.orderIndex,
          })),
        },
      },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  }

  /**
   * Find Quiz by ID with Questions.
   */
  async findQuizById(id: string): Promise<(AiQuiz & { questions: AiQuizQuestion[]; attempts: AiQuizAttempt[] }) | null> {
    return prisma.aiQuiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
        attempts: {
          orderBy: { completedAt: 'desc' },
          take: 5,
        },
      },
    });
  }

  /**
   * List Quizzes with filtering and pagination.
   */
  async findQuizzes(params: {
    userId: string;
    conversationId?: string;
    isTemplate?: boolean;
    isFavorite?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<AiQuiz & { _count: { questions: number; attempts: number } }>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 50));
    const skip = (page - 1) * limit;

    const where: Prisma.AiQuizWhereInput = {
      userId: params.userId,
      isArchived: false,
    };

    if (params.conversationId) where.conversationId = params.conversationId;
    if (params.isTemplate !== undefined) where.isTemplate = params.isTemplate;
    if (params.isFavorite !== undefined) where.isFavorite = params.isFavorite;

    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { topic: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.aiQuiz.findMany({
        where,
        include: {
          _count: {
            select: { questions: true, attempts: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.aiQuiz.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Record Quiz Attempt.
   */
  async createAttempt(data: {
    quizId: string;
    userId: string;
    score: number;
    totalQuestions: number;
    correctCount: number;
    timeTakenSec: number;
    userAnswers: Record<string, any>;
    metadata?: Record<string, any>;
  }): Promise<AiQuizAttempt> {
    return prisma.aiQuizAttempt.create({
      data: {
        quizId: data.quizId,
        userId: data.userId,
        score: data.score,
        totalQuestions: data.totalQuestions,
        correctCount: data.correctCount,
        timeTakenSec: data.timeTakenSec,
        userAnswers: data.userAnswers as Prisma.InputJsonValue,
        metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
  }

  /**
   * Find attempts for a quiz.
   */
  async findAttempts(quizId: string, userId: string): Promise<AiQuizAttempt[]> {
    return prisma.aiQuizAttempt.findMany({
      where: { quizId, userId },
      orderBy: { completedAt: 'desc' },
    });
  }

  /**
   * Single question update / regeneration.
   */
  async updateQuestion(
    id: string,
    data: { questionText?: string; options?: string[]; correctAnswer?: string; explanation?: string }
  ): Promise<AiQuizQuestion> {
    return prisma.aiQuizQuestion.update({
      where: { id },
      data: {
        ...(data.questionText && { questionText: data.questionText }),
        ...(data.options && { options: data.options as unknown as Prisma.InputJsonValue }),
        ...(data.correctAnswer && { correctAnswer: data.correctAnswer }),
        ...(data.explanation !== undefined && { explanation: data.explanation }),
      },
    });
  }

  /**
   * Delete Quiz.
   */
  async deleteQuiz(id: string): Promise<void> {
    await prisma.aiQuiz.delete({
      where: { id },
    });
  }
}

export const aiQuizRepository = new AiQuizRepository();
export default aiQuizRepository;
