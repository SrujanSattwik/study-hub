import api from './api';
import { AiDeck, DeckStats, AiQuiz, GenerateQuizDTO, SubmitQuizAttemptDTO, AiQuizAttempt } from '../types/ai.types';

export const quizService = {
  /**
   * List Decks.
   */
  listDecks: async (): Promise<AiDeck[]> => {
    const res = await api.get<{ success: boolean; data: { data: AiDeck[] } }>('/api/ai/decks');
    return res.data.data.data;
  },

  /**
   * Create Deck.
   */
  createDeck: async (data: { title: string; description?: string; category?: string }): Promise<AiDeck> => {
    const res = await api.post<{ success: boolean; data: AiDeck }>('/api/ai/decks', data);
    return res.data.data;
  },

  /**
   * Get Deck Stats.
   */
  getDeckStats: async (deckId: string): Promise<DeckStats> => {
    const res = await api.get<{ success: boolean; data: DeckStats }>(`/api/ai/decks/${deckId}/stats`);
    return res.data.data;
  },

  /**
   * Delete Deck.
   */
  deleteDeck: async (id: string): Promise<void> => {
    await api.delete(`/api/ai/decks/${id}`);
  },

  /**
   * Generate Flashcard set.
   */
  generateFlashcards: async (data: { conversationId?: string; topic?: string; count?: number }) => {
    const res = await api.post('/api/ai/flashcards/generate', data);
    return res.data.data;
  },

  /**
   * Generate Quiz.
   */
  generateQuiz: async (data: GenerateQuizDTO): Promise<AiQuiz> => {
    const res = await api.post<{ success: boolean; data: AiQuiz }>('/api/ai/quizzes/generate', data);
    return res.data.data;
  },

  /**
   * List Quizzes.
   */
  listQuizzes: async (): Promise<AiQuiz[]> => {
    const res = await api.get<{ success: boolean; data: { data: AiQuiz[] } }>('/api/ai/quizzes');
    return res.data.data.data;
  },

  /**
   * Get Quiz Details by ID.
   */
  getQuizDetails: async (id: string): Promise<AiQuiz> => {
    const res = await api.get<{ success: boolean; data: AiQuiz }>(`/api/ai/quizzes/${id}`);
    return res.data.data;
  },

  /**
   * Submit Quiz Attempt.
   */
  submitAttempt: async (id: string, data: SubmitQuizAttemptDTO): Promise<AiQuizAttempt> => {
    const res = await api.post<{ success: boolean; data: AiQuizAttempt }>(`/api/ai/quizzes/${id}/submit`, data);
    return res.data.data;
  },

  /**
   * Delete Quiz.
   */
  deleteQuiz: async (id: string): Promise<void> => {
    await api.delete(`/api/ai/quizzes/${id}`);
  },
};

export default quizService;
