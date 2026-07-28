import { PrismaClient, AiDeck, Prisma } from '@prisma/client';
import { CreateDeckDTO, UpdateDeckDTO, DeckStats, PaginatedResult } from '../types/ai.types';

const prisma = new PrismaClient();

export class AiDeckRepository {
  /**
   * Create a new deck.
   */
  async create(data: CreateDeckDTO): Promise<AiDeck> {
    return prisma.aiDeck.create({
      data: {
        userId: data.userId,
        title: data.title,
        description: data.description || null,
        category: data.category || null,
        isFavorite: data.isFavorite || false,
      },
    });
  }

  /**
   * Find deck by ID with flashcards count.
   */
  async findById(id: string): Promise<AiDeck | null> {
    return prisma.aiDeck.findUnique({
      where: { id },
      include: {
        _count: {
          select: { flashcards: true },
        },
      },
    });
  }

  /**
   * Find user decks with pagination.
   */
  async findMany(params: {
    userId: string;
    isFavorite?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<AiDeck & { _count: { flashcards: number } }>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 50));
    const skip = (page - 1) * limit;

    const where: Prisma.AiDeckWhereInput = {
      userId: params.userId,
      isArchived: false,
    };

    if (params.isFavorite !== undefined) {
      where.isFavorite = params.isFavorite;
    }

    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.aiDeck.findMany({
        where,
        include: {
          _count: {
            select: { flashcards: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.aiDeck.count({ where }),
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
   * Compute deck statistics.
   */
  async getDeckStats(deckId: string): Promise<DeckStats> {
    const cards = await prisma.aiFlashcard.findMany({
      where: { deckId },
      select: {
        reviewCount: true,
        mastery: true,
        updatedAt: true,
      },
    });

    const totalCards = cards.length;
    const studiedCount = cards.filter((c) => c.reviewCount > 0).length;
    const masteredCount = cards.filter((c) => c.mastery >= 0.8).length;
    const accuracyPct = studiedCount > 0 ? Math.round((masteredCount / studiedCount) * 100) : 0;
    const lastStudiedAt = cards.length > 0 ? cards.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0].updatedAt.toISOString() : null;

    return {
      totalCards,
      studiedCount,
      masteredCount,
      accuracyPct,
      lastStudiedAt,
    };
  }

  /**
   * Update deck.
   */
  async update(id: string, data: UpdateDeckDTO): Promise<AiDeck> {
    return prisma.aiDeck.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.isFavorite !== undefined && { isFavorite: data.isFavorite }),
        ...(data.isArchived !== undefined && { isArchived: data.isArchived }),
      },
    });
  }

  /**
   * Delete deck.
   */
  async delete(id: string): Promise<void> {
    await prisma.aiDeck.delete({
      where: { id },
    });
  }
}

export const aiDeckRepository = new AiDeckRepository();
export default aiDeckRepository;
