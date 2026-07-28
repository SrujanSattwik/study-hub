import aiDeckRepository from '../repositories/ai-deck.repository';
import { AiDeck } from '@prisma/client';
import { CreateDeckDTO, UpdateDeckDTO, DeckStats, PaginatedResult } from '../types/ai.types';

export class AiDeckService {
  /**
   * Create a new deck.
   */
  async createDeck(userId: string, data: CreateDeckDTO): Promise<AiDeck> {
    return aiDeckRepository.create({
      ...data,
      userId,
    });
  }

  /**
   * Get deck by ID.
   */
  async getDeckById(id: string): Promise<AiDeck | null> {
    return aiDeckRepository.findById(id);
  }

  /**
   * List user decks with stats.
   */
  async listDecks(
    userId: string,
    params: { isFavorite?: boolean; search?: string; page?: number; limit?: number }
  ): Promise<PaginatedResult<AiDeck & { _count: { flashcards: number } }>> {
    return aiDeckRepository.findMany({
      userId,
      ...params,
    });
  }

  /**
   * Get computed deck statistics.
   */
  async getDeckStats(deckId: string): Promise<DeckStats> {
    return aiDeckRepository.getDeckStats(deckId);
  }

  /**
   * Update deck.
   */
  async updateDeck(id: string, data: UpdateDeckDTO): Promise<AiDeck> {
    return aiDeckRepository.update(id, data);
  }

  /**
   * Delete deck.
   */
  async deleteDeck(id: string): Promise<void> {
    await aiDeckRepository.delete(id);
  }
}

export const aiDeckService = new AiDeckService();
export default aiDeckService;
