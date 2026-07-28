import api from './api';
import { AiConversation } from '../types/ai.types';

export interface ListConversationsParams {
  page?: number;
  limit?: number;
  search?: string;
  isPinned?: boolean;
  isArchived?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const conversationService = {
  listConversations: async (
    params: ListConversationsParams = {},
    signal?: AbortSignal
  ): Promise<PaginatedResult<AiConversation>> => {
    const res = await api.get<{ success: boolean; data: PaginatedResult<AiConversation> }>(
      '/api/ai/conversations',
      { params, signal }
    );
    return res.data.data;
  },

  getConversation: async (id: string, signal?: AbortSignal): Promise<AiConversation> => {
    const res = await api.get<{ success: boolean; data: AiConversation }>(
      `/api/ai/conversations/${id}`,
      { signal }
    );
    return res.data.data;
  },

  createConversation: async (
    data: { title?: string; summary?: string; conversationColor?: string } = {},
    signal?: AbortSignal
  ): Promise<AiConversation> => {
    const res = await api.post<{ success: boolean; data: AiConversation }>(
      '/api/ai/conversations',
      data,
      { signal }
    );
    return res.data.data;
  },

  updateConversation: async (
    id: string,
    data: { title?: string; summary?: string; conversationColor?: string },
    signal?: AbortSignal
  ): Promise<AiConversation> => {
    const res = await api.patch<{ success: boolean; data: AiConversation }>(
      `/api/ai/conversations/${id}`,
      data,
      { signal }
    );
    return res.data.data;
  },

  pinConversation: async (
    id: string,
    isPinned: boolean,
    signal?: AbortSignal
  ): Promise<AiConversation> => {
    const res = await api.patch<{ success: boolean; data: AiConversation }>(
      `/api/ai/conversations/${id}/pin`,
      { isPinned },
      { signal }
    );
    return res.data.data;
  },

  archiveConversation: async (
    id: string,
    isArchived: boolean,
    signal?: AbortSignal
  ): Promise<AiConversation> => {
    const res = await api.patch<{ success: boolean; data: AiConversation }>(
      `/api/ai/conversations/${id}/archive`,
      { isArchived },
      { signal }
    );
    return res.data.data;
  },

  restoreConversation: async (id: string, signal?: AbortSignal): Promise<AiConversation> => {
    const res = await api.patch<{ success: boolean; data: AiConversation }>(
      `/api/ai/conversations/${id}/restore`,
      {},
      { signal }
    );
    return res.data.data;
  },

  deleteConversation: async (id: string, signal?: AbortSignal): Promise<void> => {
    await api.delete(`/api/ai/conversations/${id}`, { signal });
  },
};

export default conversationService;
