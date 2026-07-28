import { prisma } from '../database/client';
import { AiMessage, Prisma } from '@prisma/client';
import { CreateMessageDTO, UpdateMessageDTO, PaginatedResult, PaginationParams } from '../types/ai.types';

export class AiMessageRepository {
  async create(data: CreateMessageDTO): Promise<AiMessage> {
    return prisma.aiMessage.create({
      data: {
        conversationId: data.conversationId,
        parentMessageId: data.parentMessageId || null,
        role: data.role,
        content: data.content,
        markdown: data.markdown || data.content,
        tokenCount: data.tokenCount || null,
        finishReason: data.finishReason || null,
        generationTime: data.generationTime || null,
        model: data.model || null,
        metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : Prisma.DbNull,
      },
    });
  }

  async findById(id: string): Promise<AiMessage | null> {
    return prisma.aiMessage.findUnique({
      where: { id },
      include: {
        parent: true,
        replies: true,
      },
    });
  }

  async listByConversation(
    conversationId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<AiMessage>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 50));
    const offset = (page - 1) * limit;

    const where: Prisma.AiMessageWhereInput = {
      conversationId,
    };

    if (params.search?.trim()) {
      where.content = { contains: params.search.trim(), mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      prisma.aiMessage.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: offset,
        take: limit,
      }),
      prisma.aiMessage.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, data: UpdateMessageDTO): Promise<AiMessage> {
    return prisma.aiMessage.update({
      where: { id },
      data: {
        content: data.content !== undefined ? data.content : undefined,
        markdown: data.markdown !== undefined ? data.markdown : undefined,
        htmlCache: data.htmlCache !== undefined ? data.htmlCache : undefined,
        isEdited: data.isEdited !== undefined ? data.isEdited : true,
      },
    });
  }

  async delete(id: string): Promise<AiMessage> {
    return prisma.aiMessage.delete({
      where: { id },
    });
  }
}

export const aiMessageRepository = new AiMessageRepository();
