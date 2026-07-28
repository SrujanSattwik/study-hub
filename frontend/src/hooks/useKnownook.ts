import { useState, useEffect, useCallback, useRef } from 'react';
import conversationService from '../services/conversation.service';
import messageService from '../services/message.service';
import attachmentService from '../services/attachment.service';
import flashcardService from '../services/flashcard.service';
import usageService from '../services/usage.service';
import {
  AiConversation,
  AiMessage,
  AiAttachment,
  AiFlashcard,
  AiUsageStats,
} from '../types/ai.types';

const LOCAL_STORAGE_ACTIVE_CHAT = 'knownook_active_conversation_id';
const LOCAL_STORAGE_SIDEBAR_PINNED = 'knownook_sidebar_tab';

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
  const [filterTab, setFilterTab] = useState<'recent' | 'pinned' | 'archived'>(() => {
    return (localStorage.getItem(LOCAL_STORAGE_SIDEBAR_PINNED) as any) || 'recent';
  });

  const abortRef = useRef<AbortController | null>(null);

  // ── Load Conversations List ────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const res = await conversationService.listConversations({ limit: 50 });
      setConversations(res.data);

      // Restore initial or persisted conversation
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

  // ── Load Active Conversation Messages & Attachments ────────────────────────
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

  // ── Actions ────────────────────────────────────────────────────────────────

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
    // Optimistic update
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

  const toggleArchiveChat = async (id: string) => {
    const target = conversations.find((c) => c.id === id);
    if (!target) return;
    const newArchived = !target.isArchived;

    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isArchived: newArchived } : c))
    );
    await conversationService.archiveConversation(id, newArchived);
  };

  const deleteChat = async (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversation?.id === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      setActiveConversation(remaining.length > 0 ? remaining[0] : null);
    }
    await conversationService.deleteConversation(id);
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

  const addFlashcard = async (data: {
    title: string;
    question: string;
    answer: string;
    formula?: string;
    tags?: string;
  }) => {
    const card = await flashcardService.createFlashcard({
      ...data,
      conversationId: activeConversation?.id,
    });
    setFlashcards((prev) => [card, ...prev]);
    loadUsageStats();
  };

  const toggleFavoriteFlashcard = async (id: string) => {
    const target = flashcards.find((f) => f.id === id);
    if (!target) return;
    const updated = await flashcardService.toggleFavorite(id, !target.isFavorite);
    setFlashcards((prev) => prev.map((f) => (f.id === id ? updated : f)));
  };

  const deleteFlashcard = async (id: string) => {
    setFlashcards((prev) => prev.filter((f) => f.id !== id));
    await flashcardService.deleteFlashcard(id);
  };

  const changeFilterTab = (tab: 'recent' | 'pinned' | 'archived') => {
    setFilterTab(tab);
    localStorage.setItem(LOCAL_STORAGE_SIDEBAR_PINNED, tab);
  };

  // Filtered conversations list for sidebar
  const filteredConversations = conversations.filter((c) => {
    if (c.isDeleted) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchSummary = c.summary?.toLowerCase().includes(q);
      if (!matchTitle && !matchSummary) return false;
    }
    if (filterTab === 'pinned') return c.isPinned && !c.isArchived;
    if (filterTab === 'archived') return c.isArchived;
    return !c.isArchived; // 'recent'
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
    selectConversation,
    createNewChat,
    renameChat,
    togglePinChat,
    toggleArchiveChat,
    deleteChat,
    appendUserMessage,
    refreshMessages: () => {
      if (activeConversation) {
        messageService.listMessages(activeConversation.id).then((r) => setMessages(r.data));
      }
    },
    addFlashcard,
    toggleFavoriteFlashcard,
    deleteFlashcard,
    refreshUsage: loadUsageStats,
  };
}
