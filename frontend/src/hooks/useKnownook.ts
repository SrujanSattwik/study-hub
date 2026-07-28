import { useState, useEffect, useCallback, useRef } from 'react';
import conversationService from '../services/conversation.service';
import messageService from '../services/message.service';
import attachmentService from '../services/attachment.service';
import flashcardService from '../services/flashcard.service';
import usageService from '../services/usage.service';
import {
  exportConversationToMarkdown,
  exportBulkConversationsToMarkdown,
} from '../utils/date-grouper';
import {
  AiConversation,
  AiMessage,
  AiAttachment,
  AiFlashcard,
  AiUsageStats,
} from '../types/ai.types';

const LOCAL_STORAGE_ACTIVE_CHAT = 'knownook_active_conversation_id';
const LOCAL_STORAGE_SIDEBAR_TAB = 'knownook_sidebar_tab';

export type SidebarTab = 'recent' | 'pinned' | 'favorites' | 'archived' | 'recycle_bin';

export function useKnownook(initialConversationId?: string) {
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<AiConversation | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [attachments, setAttachments] = useState<AiAttachment[]>([]);
  const [flashcards, setFlashcards] = useState<AiFlashcard[]>([]);
  const [usageStats, setUsageStats] = useState<AiUsageStats | null>(null);

  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<SidebarTab>(() => {
    return (localStorage.getItem(LOCAL_STORAGE_SIDEBAR_TAB) as SidebarTab) || 'recent';
  });

  // Multi-select state
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);

  // ── Load Conversations List ────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const res = await conversationService.listConversations({ limit: 100 });
      setConversations(res.data);

      const targetId =
        initialConversationId || localStorage.getItem(LOCAL_STORAGE_ACTIVE_CHAT);

      if (targetId && res.data.length > 0) {
        const found = res.data.find((c) => c.id === targetId);
        if (found) {
          setActiveConversation(found);
        } else {
          setActiveConversation(res.data[0]);
        }
      } else if (res.data.length > 0) {
        setActiveConversation(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [initialConversationId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ── Load Active Conversation Details ──────────────────────────────────────
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      setAttachments([]);
      return;
    }

    localStorage.setItem(LOCAL_STORAGE_ACTIVE_CHAT, activeConversation.id);

    const fetchDetails = async () => {
      setIsLoadingMessages(true);
      try {
        const [msgsRes, attsRes] = await Promise.all([
          messageService.listMessages(activeConversation.id, { limit: 100 }),
          attachmentService.listAttachments(activeConversation.id),
        ]);
        setMessages(msgsRes.data);
        setAttachments(attsRes);
      } catch (err) {
        console.error('Failed to load conversation details:', err);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchDetails();
  }, [activeConversation?.id]);

  // ── Load Flashcards & Usage ───────────────────────────────────────────────
  const loadFlashcards = useCallback(async () => {
    try {
      const res = await flashcardService.listFlashcards({ limit: 50 });
      setFlashcards(res.data);
    } catch (err) {
      console.error('Failed to load flashcards:', err);
    }
  }, []);

  const loadUsageStats = useCallback(async () => {
    try {
      const stats = await usageService.getUsageStats();
      setUsageStats(stats);
    } catch (err) {
      console.error('Failed to load usage stats:', err);
    }
  }, []);

  useEffect(() => {
    loadFlashcards();
    loadUsageStats();
  }, [loadFlashcards, loadUsageStats]);

  // ── Conversation Actions ───────────────────────────────────────────────────

  const selectConversation = (id: string) => {
    const found = conversations.find((c) => c.id === id);
    if (found) setActiveConversation(found);
  };

  const createNewChat = async (title?: string): Promise<AiConversation> => {
    const newChat = await conversationService.createConversation({
      title: title || 'New Study Chat',
    });
    setConversations((prev) => [newChat, ...prev]);
    setActiveConversation(newChat);
    setMessages([]);
    setAttachments([]);
    return newChat;
  };

  const renameChat = async (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
    if (activeConversation?.id === id) {
      setActiveConversation((prev) => (prev ? { ...prev, title: newTitle } : null));
    }
    await conversationService.updateConversation(id, { title: newTitle });
  };

  const togglePinChat = async (id: string) => {
    const target = conversations.find((c) => c.id === id);
    if (!target) return;
    const newPinned = !target.isPinned;

    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned: newPinned } : c))
    );
    await conversationService.pinConversation(id, newPinned);
  };

  const toggleFavoriteChat = async (id: string) => {
    const target = conversations.find((c) => c.id === id);
    if (!target) return;
    const currentFav = target.metadata?.isFavorite || false;

    const updatedMetadata = { ...(target.metadata || {}), isFavorite: !currentFav };
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, metadata: updatedMetadata } : c))
    );
    await conversationService.updateConversation(id, { metadata: updatedMetadata });
  };

  const toggleArchiveChat = async (id: string) => {
    const target = conversations.find((c) => c.id === id);
    if (!target) return;
    const newArchived = !target.isArchived;

    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isArchived: newArchived } : c))
    );
    await conversationService.archiveConversation(id, newArchived);
  };

  /** Soft Delete (Move to Recycle Bin) */
  const deleteChat = async (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isDeleted: true } : c))
    );
    if (activeConversation?.id === id) {
      const remaining = conversations.filter((c) => c.id !== id && !c.isDeleted);
      setActiveConversation(remaining.length > 0 ? remaining[0] : null);
    }
    await conversationService.deleteConversation(id);
  };

  /** Duplicate Chat (clone as new conversation) */
  const duplicateChat = async (id: string): Promise<AiConversation | null> => {
    const target = conversations.find((c) => c.id === id);
    if (!target) return null;

    const newChat = await conversationService.createConversation({
      title: `${target.title} (Copy)`,
      summary: target.summary || undefined,
    });

    setConversations((prev) => [newChat, ...prev]);
    return newChat;
  };

  /** Export Chat to Markdown File */
  const exportChat = async (id: string) => {
    const target = conversations.find((c) => c.id === id);
    if (!target) return;

    if (activeConversation?.id === id && messages.length > 0) {
      exportConversationToMarkdown(target.title, messages);
    } else {
      const msgsRes = await messageService.listMessages(id, { limit: 100 });
      exportConversationToMarkdown(target.title, msgsRes.data);
    }
  };

  /** Restore from Recycle Bin */
  const restoreChat = async (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isDeleted: false, isArchived: false } : c))
    );
    await conversationService.restoreConversation(id);
  };

  /** Permanent Delete from Recycle Bin */
  const permanentDeleteChat = async (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    await conversationService.deleteConversation(id);
  };

  // ── Multi-Select Bulk Actions ──────────────────────────────────────────────

  const toggleSelectChat = (id: string) => {
    setSelectedChatIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const clearSelection = () => {
    setSelectedChatIds([]);
    setIsMultiSelectMode(false);
  };

  const bulkArchive = async () => {
    for (const id of selectedChatIds) {
      await toggleArchiveChat(id);
    }
    clearSelection();
  };

  const bulkDelete = async () => {
    for (const id of selectedChatIds) {
      await deleteChat(id);
    }
    clearSelection();
  };

  const bulkExport = () => {
    const targets = conversations.filter((c) => selectedChatIds.includes(c.id));
    if (targets.length > 0) {
      exportBulkConversationsToMarkdown(targets);
    }
    clearSelection();
  };

  const bulkRestore = async () => {
    for (const id of selectedChatIds) {
      await restoreChat(id);
    }
    clearSelection();
  };

  const appendUserMessage = (text: string): AiMessage => {
    const tempUserMsg: AiMessage = {
      id: `temp-user-${Date.now()}`,
      conversationId: activeConversation?.id || '',
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    return tempUserMsg;
  };

  const changeFilterTab = (tab: SidebarTab) => {
    setFilterTab(tab);
    localStorage.setItem(LOCAL_STORAGE_SIDEBAR_TAB, tab);
  };

  // Section Count Badges
  const pinnedCount = conversations.filter((c) => !c.isDeleted && c.isPinned && !c.isArchived).length;
  const favoritesCount = conversations.filter((c) => !c.isDeleted && c.metadata?.isFavorite).length;
  const archivedCount = conversations.filter((c) => !c.isDeleted && c.isArchived).length;
  const recycleBinCount = conversations.filter((c) => c.isDeleted).length;

  // Filtered conversations list for active sidebar view
  const filteredConversations = conversations.filter((c) => {
    if (filterTab === 'recycle_bin') return c.isDeleted;
    if (c.isDeleted) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchSummary = c.summary?.toLowerCase().includes(q);
      if (!matchTitle && !matchSummary) return false;
    }

    if (filterTab === 'pinned') return c.isPinned && !c.isArchived;
    if (filterTab === 'favorites') return c.metadata?.isFavorite;
    if (filterTab === 'archived') return c.isArchived;
    return !c.isArchived; // 'recent' / workspace
  });

  return {
    conversations: filteredConversations,
    allConversations: conversations,
    activeConversation,
    messages,
    attachments,
    flashcards,
    usageStats,
    isLoadingConversations,
    isLoadingMessages,
    searchQuery,
    setSearchQuery,
    filterTab,
    changeFilterTab,
    pinnedCount,
    favoritesCount,
    archivedCount,
    recycleBinCount,
    // Multi-Select
    isMultiSelectMode,
    setIsMultiSelectMode,
    selectedChatIds,
    toggleSelectChat,
    clearSelection,
    bulkArchive,
    bulkDelete,
    bulkExport,
    bulkRestore,
    // Actions
    selectConversation,
    createNewChat,
    renameChat,
    togglePinChat,
    toggleFavoriteChat,
    toggleArchiveChat,
    deleteChat,
    duplicateChat,
    exportChat,
    restoreChat,
    permanentDeleteChat,
    appendUserMessage,
    refreshMessages: () => {
      if (activeConversation) {
        messageService.listMessages(activeConversation.id).then((r) => setMessages(r.data));
      }
    },
    addFlashcard: async (data: any) => {
      const card = await flashcardService.createFlashcard({ ...data, conversationId: activeConversation?.id });
      setFlashcards((prev) => [card, ...prev]);
      loadUsageStats();
    },
    toggleFavoriteFlashcard: async (id: string) => {
      const target = flashcards.find((f) => f.id === id);
      if (!target) return;
      const updated = await flashcardService.toggleFavorite(id, !target.isFavorite);
      setFlashcards((prev) => prev.map((f) => (f.id === id ? updated : f)));
    },
    deleteFlashcard: async (id: string) => {
      setFlashcards((prev) => prev.filter((f) => f.id !== id));
      await flashcardService.deleteFlashcard(id);
    },
    refreshUsage: loadUsageStats,
  };
}
