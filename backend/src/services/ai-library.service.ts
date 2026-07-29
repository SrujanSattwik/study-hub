import aiLibraryRepository from '../repositories/ai-library.repository';
import { AiCollection, AiBookmark, AiTag } from '@prisma/client';
import {
  CreateCollectionDTO,
  CreateBookmarkDTO,
  UniversalSearchResultItem,
  StorageInsights,
  AssetLineageGraph,
  KnowledgeBundleManifest,
  LibraryEntityType,
} from '../types/ai.types';

export class AiLibraryService {
  async createCollection(data: CreateCollectionDTO): Promise<AiCollection> {
    return aiLibraryRepository.createCollection(data);
  }

  async listCollections(userId: string): Promise<Array<AiCollection & { _count: { items: number } }>> {
    return aiLibraryRepository.findCollections(userId);
  }

  async addItemToCollection(data: { collectionId: string; entityType: string; entityId: string }) {
    return aiLibraryRepository.addItemToCollection(data);
  }

  async deleteCollection(id: string): Promise<void> {
    return aiLibraryRepository.deleteCollection(id);
  }

  async createBookmark(data: CreateBookmarkDTO): Promise<AiBookmark> {
    return aiLibraryRepository.createBookmark(data);
  }

  async listBookmarks(userId: string): Promise<AiBookmark[]> {
    return aiLibraryRepository.findBookmarks(userId);
  }

  async deleteBookmark(id: string): Promise<void> {
    return aiLibraryRepository.deleteBookmark(id);
  }

  async listTags(userId: string): Promise<AiTag[]> {
    return aiLibraryRepository.findTags(userId);
  }

  async universalSearch(userId: string, query: string, filterType?: string): Promise<UniversalSearchResultItem[]> {
    return aiLibraryRepository.universalSearch(userId, query, filterType);
  }

  async getStorageInsights(userId: string): Promise<StorageInsights> {
    return aiLibraryRepository.getStorageInsights(userId);
  }

  async getAssetLineage(entityId: string, entityType: LibraryEntityType): Promise<AssetLineageGraph> {
    return aiLibraryRepository.getAssetLineage(entityId, entityType);
  }

  /**
   * Export Knowledge Bundle as zip/JSON with manifest.json for future re-import portability.
   */
  async exportKnowledgeBundle(userId: string): Promise<{ manifest: KnowledgeBundleManifest; bundleData: any }> {
    const stats = await aiLibraryRepository.getStorageInsights(userId);
    const bookmarks = await aiLibraryRepository.findBookmarks(userId);

    const manifest: KnowledgeBundleManifest = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      exportedBy: userId,
      assetCounts: {
        documents: stats.documentsCount,
        notes: stats.notesCount,
        flashcards: stats.flashcardsCount,
        quizzes: stats.quizzesCount,
        studyPlans: stats.studyPlansCount,
        bookmarks: stats.bookmarksCount,
      },
      manifestId: `bundle-${Date.now()}`,
    };

    return {
      manifest,
      bundleData: {
        bookmarks,
        exportMetadata: manifest,
      },
    };
  }
}

export const aiLibraryService = new AiLibraryService();
export default aiLibraryService;
