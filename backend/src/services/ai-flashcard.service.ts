import { aiFlashcardRepository } from '../repositories/ai-flashcard.repository';
import aiFlashcardGeneratorService from './ai-flashcard-generator.service';
import { AiFlashcard, FlashcardDifficulty } from '@prisma/client';
import { CreateFlashcardDTO, UpdateFlashcardDTO, PaginatedResult } from '../types/ai.types';

export class AiFlashcardService {
  /**
   * Generate flashcard set using Gemini AI and assign to deck.
   */
  async generateFlashcards(
    userId: string,
    params: {
      conversationId?: string;
      deckId?: string;
      topic?: string;
      count?: number;
    }
  ): Promise<AiFlashcard[]> {
    const generatedItems = await aiFlashcardGeneratorService.generateFlashcards(
      userId,
      params.conversationId,
      params.topic,
      params.count || 8
    );

    const createdCards: AiFlashcard[] = [];
    for (const item of generatedItems) {
      const card = await aiFlashcardRepository.create(userId, {
        title: item.title,
        question: item.question,
        answer: item.answer,
        formula: item.formula,
        tags: item.tags,
        conversationId: params.conversationId,
        isFavorite: false,
      });
      createdCards.push(card);
    }

    return createdCards;
  }

  /**
   * Create a manual flashcard.
   */
  async createFlashcard(userId: string, data: CreateFlashcardDTO): Promise<AiFlashcard> {
    return aiFlashcardRepository.create(userId, data);
  }

  /**
   * Get flashcard by ID.
   */
  async getFlashcard(id: string, userId: string): Promise<AiFlashcard | null> {
    return aiFlashcardRepository.findById(id, userId);
  }

  /**
   * List flashcards with filtering and pagination.
   */
  async listFlashcards(
    userId: string,
    params: {
      conversationId?: string;
      deckId?: string;
      isFavorite?: boolean;
      difficulty?: FlashcardDifficulty;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedResult<AiFlashcard>> {
    return aiFlashcardRepository.listByUser(userId, params);
  }

  /**
   * Update flashcard details.
   */
  async updateFlashcard(id: string, userId: string, data: UpdateFlashcardDTO): Promise<AiFlashcard> {
    return aiFlashcardRepository.update(id, userId, data);
  }

  /**
   * Toggle favorite.
   */
  async toggleFavorite(id: string, userId: string, isFavorite?: boolean): Promise<AiFlashcard> {
    const card = await aiFlashcardRepository.findById(id, userId);
    if (!card) throw new Error('Flashcard not found');
    const newFav = isFavorite !== undefined ? isFavorite : !card.isFavorite;
    return aiFlashcardRepository.update(id, userId, { isFavorite: newFav });
  }

  /**
   * Delete flashcard.
   */
  async deleteFlashcard(id: string, userId: string): Promise<void> {
    await aiFlashcardRepository.delete(id, userId);
  }
}

export const aiFlashcardService = new AiFlashcardService();
export default aiFlashcardService;
