import { prisma } from '../database/client';
import { AiFlashcard, FlashcardDifficulty, Prisma } from '@prisma/client';
import { CreateFlashcardDTO, UpdateFlashcardDTO, PaginatedResult, PaginationParams } from '../types/ai.types';

export class AiFlashcardRepository {
  async create(userId: string, data: CreateFlashcardDTO): Promise<AiFlashcard> {
    return prisma.aiFlashcard.create({
      data: {
        userId,
        conversationId: data.conversationId || null,
        title: data.title,
        question: data.question,
        answer: data.answer,
        formula: data.formula || null,
        tags: data.tags || null,
        difficulty: data.difficulty || FlashcardDifficulty.medium,
        isFavorite: data.isFavorite || false,
        metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : Prisma.DbNull,
      },
    });
  }

  async findById(id: string, userId: string): Promise<AiFlashcard | null> {
    return prisma.aiFlashcard.findFirst({
      where: { id, userId },
    });
  }

  async listByUser(
    userId: string,
    params: PaginationParams & { isFavorite?: boolean; difficulty?: FlashcardDifficulty }
  ): Promise<PaginatedResult<AiFlashcard>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    const where: Prisma.AiFlashcardWhereInput = {
      userId,
      isFavorite: params.isFavorite !== undefined ? params.isFavorite : undefined,
      difficulty: params.difficulty !== undefined ? params.difficulty : undefined,
    };

    if (params.search?.trim()) {
      const query = params.search.trim();
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { question: { contains: query, mode: 'insensitive' } },
        { answer: { contains: query, mode: 'insensitive' } },
        { formula: { contains: query, mode: 'insensitive' } },
        { tags: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.aiFlashcard.findMany({
        where,
        orderBy: [
          { isFavorite: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: offset,
        take: limit,
      }),
      prisma.aiFlashcard.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, userId: string, data: UpdateFlashcardDTO): Promise<AiFlashcard> {
    return prisma.aiFlashcard.update({
      where: { id, userId },
      data: {
        title: data.title !== undefined ? data.title : undefined,
        question: data.question !== undefined ? data.question : undefined,
        answer: data.answer !== undefined ? data.answer : undefined,
        formula: data.formula !== undefined ? data.formula : undefined,
        tags: data.tags !== undefined ? data.tags : undefined,
        difficulty: data.difficulty !== undefined ? data.difficulty : undefined,
        isFavorite: data.isFavorite !== undefined ? data.isFavorite : undefined,
      },
    });
  }

  async delete(id: string, userId: string): Promise<AiFlashcard> {
    return prisma.aiFlashcard.delete({
      where: { id, userId },
    });
  }
}

export const aiFlashcardRepository = new AiFlashcardRepository();
