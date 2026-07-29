import api from './api';
import {
  AiCollection,
  AiBookmark,
  AiTag,
  UniversalSearchResultItem,
  StorageInsights,
  AssetLineageGraph,
  LibraryEntityType,
} from '../types/ai.types';

export const libraryService = {
  universalSearch: async (q: string, type?: string): Promise<UniversalSearchResultItem[]> => {
    const res = await api.get<{ success: boolean; data: UniversalSearchResultItem[] }>('/api/ai/library/search', {
      params: { q, type },
    });
    return res.data.data;
  },

  listBookmarks: async (): Promise<AiBookmark[]> => {
    const res = await api.get<{ success: boolean; data: AiBookmark[] }>('/api/ai/library/bookmarks');
    return res.data.data;
  },

  createBookmark: async (data: { entityType: LibraryEntityType; entityId: string; title: string; snippet?: string; userNotes?: string }): Promise<AiBookmark> => {
    const res = await api.post<{ success: boolean; data: AiBookmark }>('/api/ai/library/bookmarks', data);
    return res.data.data;
  },

  deleteBookmark: async (id: string): Promise<void> => {
    await api.delete(`/api/ai/library/bookmarks/${id}`);
  },

  listCollections: async (): Promise<AiCollection[]> => {
    const res = await api.get<{ success: boolean; data: AiCollection[] }>('/api/ai/library/collections');
    return res.data.data;
  },

  createCollection: async (data: { title: string; description?: string; color?: string; icon?: string }): Promise<AiCollection> => {
    const res = await api.post<{ success: boolean; data: AiCollection }>('/api/ai/library/collections', data);
    return res.data.data;
  },

  addItemToCollection: async (collectionId: string, entityType: LibraryEntityType, entityId: string): Promise<void> => {
    await api.post(`/api/ai/library/collections/${collectionId}/items`, { entityType, entityId });
  },

  deleteCollection: async (id: string): Promise<void> => {
    await api.delete(`/api/ai/library/collections/${id}`);
  },

  listTags: async (): Promise<AiTag[]> => {
    const res = await api.get<{ success: boolean; data: AiTag[] }>('/api/ai/library/tags');
    return res.data.data;
  },

  getStorageInsights: async (): Promise<StorageInsights> => {
    const res = await api.get<{ success: boolean; data: StorageInsights }>('/api/ai/library/stats');
    return res.data.data;
  },

  getAssetLineage: async (id: string, entityType: LibraryEntityType): Promise<AssetLineageGraph> => {
    const res = await api.get<{ success: boolean; data: AssetLineageGraph }>(`/api/ai/library/lineage/${id}`, {
      params: { entityType },
    });
    return res.data.data;
  },

  exportKnowledgeBundle: async (): Promise<any> => {
    const res = await api.get<{ success: boolean; data: any }>('/api/ai/library/export');
    return res.data.data;
  },
};

export default libraryService;
