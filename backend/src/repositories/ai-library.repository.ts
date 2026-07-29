import { PrismaClient, AiCollection, AiBookmark, AiTag, Prisma } from '@prisma/client';
import {
  CreateCollectionDTO,
  CreateBookmarkDTO,
  UniversalSearchResultItem,
  StorageInsights,
  AssetLineageGraph,
  LibraryEntityType,
} from '../types/ai.types';

const prisma = new PrismaClient();

export class AiLibraryRepository {
  /**
   * Create Collection Folder.
   */
  async createCollection(data: CreateCollectionDTO): Promise<AiCollection> {
    return prisma.aiCollection.create({
      data: {
        userId: data.userId,
        title: data.title,
        description: data.description || null,
        color: data.color || '#0284c7',
        icon: data.icon || '📂',
      },
    });
  }

  /**
   * List Collections with nested item counts.
   */
  async findCollections(userId: string): Promise<Array<AiCollection & { _count: { items: number } }>> {
    return prisma.aiCollection.findMany({
      where: { userId },
      include: {
        _count: { select: { items: true } },
      },
      orderBy: { title: 'asc' },
    });
  }

  /**
   * Add Item to Collection.
   */
  async addItemToCollection(data: { collectionId: string; entityType: string; entityId: string }) {
    return prisma.aiCollectionItem.create({
      data: {
        collectionId: data.collectionId,
        entityType: data.entityType,
        entityId: data.entityId,
      },
    });
  }

  /**
   * Delete Collection.
   */
  async deleteCollection(id: string): Promise<void> {
    await prisma.aiCollection.delete({ where: { id } });
  }

  /**
   * Create Bookmark.
   */
  async createBookmark(data: CreateBookmarkDTO): Promise<AiBookmark> {
    return prisma.aiBookmark.create({
      data: {
        userId: data.userId,
        entityType: data.entityType,
        entityId: data.entityId,
        title: data.title,
        snippet: data.snippet || null,
        userNotes: data.userNotes || null,
        isPinned: data.isPinned || false,
        isFavorite: data.isFavorite || false,
      },
    });
  }

  /**
   * List Bookmarks for User.
   */
  async findBookmarks(userId: string): Promise<AiBookmark[]> {
    return prisma.aiBookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Delete Bookmark.
   */
  async deleteBookmark(id: string): Promise<void> {
    await prisma.aiBookmark.delete({ where: { id } });
  }

  /**
   * List Universal Tags.
   */
  async findTags(userId: string): Promise<AiTag[]> {
    return prisma.aiTag.findMany({
      where: { userId },
      orderBy: { usageCount: 'desc' },
    });
  }

  /**
   * Universal Search across Notes, Flashcards, Quizzes, Plans, Documents, Bookmarks.
   */
  async universalSearch(userId: string, query: string, filterType?: string): Promise<UniversalSearchResultItem[]> {
    const results: UniversalSearchResultItem[] = [];
    const q = query.trim().toLowerCase();

    // 1. Search Notes
    if (!filterType || filterType === 'note') {
      const notes = await prisma.aiNote.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } },
            { tags: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 20,
      });

      for (const n of notes) {
        results.push({
          id: n.id,
          entityType: 'note',
          title: n.title,
          snippet: n.summary || n.content.slice(0, 150),
          createdAt: n.createdAt.toISOString(),
          isFavorite: n.isFavorite,
        });
      }
    }

    // 2. Search Flashcard Decks & Cards
    if (!filterType || filterType === 'flashcard' || filterType === 'deck') {
      const cards = await prisma.aiFlashcard.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { question: { contains: q, mode: 'insensitive' } },
            { answer: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 20,
      });

      for (const c of cards) {
        results.push({
          id: c.id,
          entityType: 'flashcard',
          title: c.title,
          snippet: `Q: ${c.question} | A: ${c.answer}`,
          createdAt: c.createdAt.toISOString(),
          isFavorite: c.isFavorite,
        });
      }
    }

    // 3. Search Quizzes
    if (!filterType || filterType === 'quiz') {
      const quizzes = await prisma.aiQuiz.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { topic: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 20,
      });

      for (const quiz of quizzes) {
        results.push({
          id: quiz.id,
          entityType: 'quiz',
          title: quiz.title,
          snippet: `${quiz.difficulty.toUpperCase()} Quiz • ${quiz.topic || 'General Topic'}`,
          createdAt: quiz.createdAt.toISOString(),
          isFavorite: quiz.isFavorite,
        });
      }
    }

    // 4. Search Study Plans
    if (!filterType || filterType === 'plan') {
      const plans = await prisma.aiStudyPlan.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { targetGoal: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 20,
      });

      for (const p of plans) {
        results.push({
          id: p.id,
          entityType: 'plan',
          title: p.title,
          snippet: `Status: ${p.status.toUpperCase()} • Target: ${p.targetGoal || 'Roadmap'}`,
          createdAt: p.createdAt.toISOString(),
        });
      }
    }

    return results;
  }

  /**
   * Get Storage Insights breakdown.
   */
  async getStorageInsights(userId: string): Promise<StorageInsights> {
    const [
      documentsCount,
      notesCount,
      flashcardsCount,
      decksCount,
      quizzesCount,
      studyPlansCount,
      bookmarksCount,
      collectionsCount,
    ] = await Promise.all([
      prisma.aiAttachment.count({ where: { conversation: { userId } } }),
      prisma.aiNote.count({ where: { userId } }),
      prisma.aiFlashcard.count({ where: { userId } }),
      prisma.aiDeck.count({ where: { userId } }),
      prisma.aiQuiz.count({ where: { userId } }),
      prisma.aiStudyPlan.count({ where: { userId } }),
      prisma.aiBookmark.count({ where: { userId } }),
      prisma.aiCollection.count({ where: { userId } }),
    ]);

    return {
      documentsCount,
      notesCount,
      flashcardsCount,
      decksCount,
      quizzesCount,
      studyPlansCount,
      bookmarksCount,
      collectionsCount,
    };
  }

  /**
   * Get Asset Lineage Graph for any asset.
   */
  async getAssetLineage(entityId: string, entityType: LibraryEntityType): Promise<AssetLineageGraph> {
    const lineage: AssetLineageGraph = {
      entityId,
      entityType,
      title: 'Knowledge Asset',
      generatedFrom: [],
      derivedAssets: [],
    };

    if (entityType === 'note') {
      const note = await prisma.aiNote.findUnique({
        where: { id: entityId },
        include: { conversation: true },
      });
      if (note) {
        lineage.title = note.title;
        if (note.conversation) {
          lineage.generatedFrom?.push({
            id: note.conversation.id,
            entityType: 'conversation',
            title: note.conversation.title,
          });
        }
      }
    }

    return lineage;
  }
}

export const aiLibraryRepository = new AiLibraryRepository();
export default aiLibraryRepository;
