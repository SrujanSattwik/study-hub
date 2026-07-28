import api from './api';
import { AiNote, GenerateNoteDTO } from '../types/ai.types';

export interface ListNotesParams {
  conversationId?: string;
  isFavorite?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const noteService = {
  /**
   * Generate an AI Note using Gemini.
   */
  generateNote: async (data: GenerateNoteDTO): Promise<AiNote> => {
    const res = await api.post<{ success: boolean; data: AiNote }>('/api/ai/notes/generate', data);
    return res.data.data;
  },

  /**
   * List notes for the user.
   */
  listNotes: async (params: ListNotesParams = {}): Promise<PaginatedResult<AiNote>> => {
    const res = await api.get<{ success: boolean; data: PaginatedResult<AiNote> }>('/api/ai/notes', { params });
    return res.data.data;
  },

  /**
   * Get single note by ID.
   */
  getNote: async (id: string): Promise<AiNote> => {
    const res = await api.get<{ success: boolean; data: AiNote }>(`/api/ai/notes/${id}`);
    return res.data.data;
  },

  /**
   * Update a note.
   */
  updateNote: async (
    id: string,
    data: { title?: string; content?: string; summary?: string; tags?: string; isFavorite?: boolean }
  ): Promise<AiNote> => {
    const res = await api.patch<{ success: boolean; data: AiNote }>(`/api/ai/notes/${id}`, data);
    return res.data.data;
  },

  /**
   * Toggle favorite status.
   */
  toggleFavorite: async (id: string, isFavorite: boolean): Promise<AiNote> => {
    return noteService.updateNote(id, { isFavorite });
  },

  /**
   * Regenerate note content with AI.
   */
  regenerateNote: async (id: string, instructions?: string): Promise<AiNote> => {
    const res = await api.post<{ success: boolean; data: AiNote }>(`/api/ai/notes/${id}/regenerate`, { instructions });
    return res.data.data;
  },

  /**
   * Delete a note.
   */
  deleteNote: async (id: string): Promise<void> => {
    await api.delete(`/api/ai/notes/${id}`);
  },
};

export default noteService;
