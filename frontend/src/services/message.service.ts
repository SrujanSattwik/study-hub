import api from './api';
import { AiMessage } from '../types/ai.types';
import { PaginatedResult } from './conversation.service';

export const messageService = {
  listMessages: async (
    conversationId: string,
    params: { page?: number; limit?: number } = {},
    signal?: AbortSignal
  ): Promise<PaginatedResult<AiMessage>> => {
    const res = await api.get<{ success: boolean; data: PaginatedResult<AiMessage> }>(
      `/api/ai/conversations/${conversationId}/messages`,
      { params, signal }
    );
    return res.data.data;
  },

  createMessage: async (
    conversationId: string,
    data: { role: 'user' | 'assistant'; content: string },
    signal?: AbortSignal
  ): Promise<AiMessage> => {
    const res = await api.post<{ success: boolean; data: AiMessage }>(
      `/api/ai/conversations/${conversationId}/messages`,
      data,
      { signal }
    );
    return res.data.data;
  },

  updateMessage: async (
    messageId: string,
    data: { content: string },
    signal?: AbortSignal
  ): Promise<AiMessage> => {
    const res = await api.patch<{ success: boolean; data: AiMessage }>(
      `/api/ai/messages/${messageId}`,
      data,
      { signal }
    );
    return res.data.data;
  },

  deleteMessage: async (messageId: string, signal?: AbortSignal): Promise<void> => {
    await api.delete(`/api/ai/messages/${messageId}`, { signal });
  },
};

export default messageService;
