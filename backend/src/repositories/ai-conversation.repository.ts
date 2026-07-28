import { prisma } from '../database/client';
import { AiConversation, Prisma } from '@prisma/client';
import { CreateConversationDTO, UpdateConversationDTO, PaginatedResult, PaginationParams } from '../types/ai.types';

export class AiConversationRepository {
  async create(userId: string, data: CreateConversationDTO): Promise<AiConversation> {
    return prisma.aiConversation.create({
      data: {
        userId,
        title: data.title || 'New Study Chat',
        summary: data.summary || null,
        modelUsed: data.modelUsed || 'gemini-2.0-flash',
        temperature: data.temperature ?? 0.7,
        conversationColor: data.conversationColor || null,
        metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : Prisma.DbNull,
      },
    });
  }

  async findById(id: string, userId: string): Promise<AiConversation | null> {
    return prisma.aiConversation.findFirst({
      where: {
        id,
        userId,
        isDeleted: false,
      },
      include: {
        attachments: true,
      },
    });
  }

  async listByUser(
    userId: string,
    params: PaginationParams & { isPinned?: boolean; isArchived?: boolean }
  ): Promise<PaginatedResult<AiConversation>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    const where: Prisma.AiConversationWhereInput = {
      userId,
      isDeleted: false,
      isPinned: params.isPinned !== undefined ? params.isPinned : undefined,
      isArchived: params.isArchived !== undefined ? params.isArchived : undefined,
    };

    if (params.search?.trim()) {
      const query = params.search.trim();
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { summary: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.aiConversation.findMany({
        where,
        orderBy: [
          { isPinned: 'desc' },
          { lastMessageAt: 'desc' },
        ],
        skip: offset,
        take: limit,
      }),
      prisma.aiConversation.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, userId: string, data: UpdateConversationDTO): Promise<AiConversation> {
    return prisma.aiConversation.update({
      where: { id, userId },
      data: {
        title: data.title !== undefined ? data.title : undefined,
        summary: data.summary !== undefined ? data.summary : undefined,
        isPinned: data.isPinned !== undefined ? data.isPinned : undefined,
        isArchived: data.isArchived !== undefined ? data.isArchived : undefined,
        conversationColor: data.conversationColor !== undefined ? data.conversationColor : undefined,
        metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  async softDelete(id: string, userId: string): Promise<AiConversation> {
    return prisma.aiConversation.update({
      where: { id, userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async findFullById(id: string, userId: string) {
    return prisma.aiConversation.findFirst({
      where: {
        id,
        userId,
        isDeleted: false,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
        },
        flashcards: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async restore(id: string, userId: string): Promise<AiConversation> {
    return prisma.aiConversation.update({
      where: { id, userId },
      data: {
        isDeleted: false,
        isArchived: false,
        deletedAt: null,
      },
    });
  }

  async incrementStats(id: string, messageCountIncrement = 1, tokenCountIncrement = 0): Promise<void> {
    await prisma.aiConversation.update({
      where: { id },
      data: {
        totalMessages: { increment: messageCountIncrement },
        totalTokens: { increment: tokenCountIncrement },
        lastMessageAt: new Date(),
      },
    });
  }
}

export const aiConversationRepository = new AiConversationRepository();

