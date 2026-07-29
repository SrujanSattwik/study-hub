import { useState, useEffect, useCallback } from 'react';
import libraryService from '../services/library.service';
import {
  AiCollection,
  AiBookmark,
  AiTag,
  UniversalSearchResultItem,
  StorageInsights,
  LibraryEntityType,
} from '../types/ai.types';

export function useKnownookLibrary() {
  const [collections, setCollections] = useState<AiCollection[]>([]);
  const [bookmarks, setBookmarks] = useState<AiBookmark[]>([]);
  const [tags, setTags] = useState<AiTag[]>([]);
  const [insights, setInsights] = useState<StorageInsights | null>(null);
  const [searchResults, setSearchResults] = useState<UniversalSearchResultItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadLibraryData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [userCollections, userBookmarks, userTags, storageStats] = await Promise.all([
        libraryService.listCollections(),
        libraryService.listBookmarks(),
        libraryService.listTags(),
        libraryService.getStorageInsights(),
      ]);

      setCollections(userCollections);
      setBookmarks(userBookmarks);
      setTags(userTags);
      setInsights(storageStats);
    } catch (err) {
      console.error('Failed to load library data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLibraryData();
  }, [loadLibraryData]);

  const search = async (q: string, type?: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await libraryService.universalSearch(q, type);
      setSearchResults(results);
    } catch (err) {
      console.error('Universal search failed:', err);
    }
  };

  const createCollection = async (data: { title: string; description?: string; color?: string; icon?: string }) => {
    try {
      const created = await libraryService.createCollection(data);
      setCollections((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      console.error('Create collection failed:', err);
      return null;
    }
  };

  const deleteCollection = async (id: string) => {
    try {
      await libraryService.deleteCollection(id);
      setCollections((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Delete collection failed:', err);
    }
  };

  const createBookmark = async (data: { entityType: LibraryEntityType; entityId: string; title: string; snippet?: string; userNotes?: string }) => {
    try {
      const created = await libraryService.createBookmark(data);
      setBookmarks((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      console.error('Create bookmark failed:', err);
      return null;
    }
  };

  const deleteBookmark = async (id: string) => {
    try {
      await libraryService.deleteBookmark(id);
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error('Delete bookmark failed:', err);
    }
  };

  const exportBundle = async () => {
    try {
      const bundle = await libraryService.exportKnowledgeBundle();
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KnowNook_Knowledge_Bundle_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export bundle failed:', err);
    }
  };

  return {
    collections,
    bookmarks,
    tags,
    insights,
    searchResults,
    searchQuery,
    isLoading,
    search,
    createCollection,
    deleteCollection,
    createBookmark,
    deleteBookmark,
    exportBundle,
    refreshLibrary: loadLibraryData,
  };
}
