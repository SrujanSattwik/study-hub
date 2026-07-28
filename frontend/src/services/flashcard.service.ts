import api from './api';
import { AiFlashcard, FlashcardDifficulty } from '../types/ai.types';
import { PaginatedResult } from './conversation.service';

export interface ListFlashcardsParams {
  page?: number;
  limit?: number;
  search?: string;
  isFavorite?: boolean;
  difficulty?: FlashcardDifficulty;
}

export const flashcardService = {
  listFlashcards: async (
    params: ListFlashcardsParams = {},
    signal?: AbortSignal
  ): Promise<PaginatedResult<AiFlashcard>> => {
    const res = await api.get<{ success: boolean; data: PaginatedResult<AiFlashcard> }>(
      '/api/ai/flashcards',
      { params, signal }
    );
    return res.data.data;
  },

  createFlashcard: async (
    data: {
      conversationId?: string;
      title: string;
      question: string;
      answer: string;
      formula?: string;
      tags?: string;
      difficulty?: FlashcardDifficulty;
      isFavorite?: boolean;
    },
    signal?: AbortSignal
  ): Promise<AiFlashcard> => {
    const res = await api.post<{ success: boolean; data: AiFlashcard }>(
      '/api/ai/flashcards',
      data,
      { signal }
    );
    return res.data.data;
  },

  toggleFavorite: async (
    id: string,
    isFavorite: boolean,
    signal?: AbortSignal
  ): Promise<AiFlashcard> => {
    const res = await api.patch<{ success: boolean; data: AiFlashcard }>(
      `/api/ai/flashcards/${id}/favorite`,
      { isFavorite },
      { signal }
    );
    return res.data.data;
  },

  deleteFlashcard: async (id: string, signal?: AbortSignal): Promise<void> => {
    await api.delete(`/api/ai/flashcards/${id}`, { signal });
  },
};

export default flashcardService;
