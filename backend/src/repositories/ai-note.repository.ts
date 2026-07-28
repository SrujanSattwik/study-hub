import { PrismaClient, AiNote, Prisma } from '@prisma/client';
import { CreateNoteDTO, UpdateNoteDTO, PaginatedResult } from '../types/ai.types';

const prisma = new PrismaClient();

export class AiNoteRepository {
  /**
   * Create a new AI Note.
   */
  async create(data: CreateNoteDTO): Promise<AiNote> {
    return prisma.aiNote.create({
      data: {
        userId: data.userId,
        conversationId: data.conversationId || null,
        title: data.title,
        noteType: data.noteType,
        content: data.content,
        summary: data.summary || null,
        tags: data.tags || null,
        isFavorite: data.isFavorite || false,
        metadata: data.metadata || Prisma.JsonNull,
      },
    });
  }

  /**
   * Find a note by ID.
   */
  async findById(id: string): Promise<AiNote | null> {
    return prisma.aiNote.findUnique({
      where: { id },
      include: {
        conversation: {
          select: { id: true, title: true },
        },
      },
    });
  }

  /**
   * Find notes by user ID with pagination and filtering.
   */
  async findMany(params: {
    userId: string;
    conversationId?: string;
    isFavorite?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<AiNote>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 50));
    const skip = (page - 1) * limit;

    const where: Prisma.AiNoteWhereInput = {
      userId: params.userId,
    };

    if (params.conversationId) {
      where.conversationId = params.conversationId;
    }

    if (params.isFavorite !== undefined) {
      where.isFavorite = params.isFavorite;
    }

    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
        { tags: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.aiNote.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.aiNote.count({ where }),
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
   * Update an existing note.
   */
  async update(id: string, data: UpdateNoteDTO): Promise<AiNote> {
    return prisma.aiNote.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content }),
        ...(data.summary !== undefined && { summary: data.summary }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.isFavorite !== undefined && { isFavorite: data.isFavorite }),
      },
    });
  }

  /**
   * Delete a note.
   */
  async delete(id: string): Promise<void> {
    await prisma.aiNote.delete({
      where: { id },
    });
  }
}

export const aiNoteRepository = new AiNoteRepository();
export default aiNoteRepository;
