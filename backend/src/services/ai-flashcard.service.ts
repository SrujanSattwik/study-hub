import { aiFlashcardRepository } from '../repositories/ai-flashcard.repository';
import { aiConversationRepository } from '../repositories/ai-conversation.repository';
import { CreateFlashcardDTO, UpdateFlashcardDTO, PaginationParams, PaginatedResult } from '../types/ai.types';
import { AiFlashcardNotFoundError, AiConversationNotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import { AiFlashcard, FlashcardDifficulty } from '@prisma/client';

export class AiFlashcardService {
  async createFlashcard(userId: string, data: CreateFlashcardDTO): Promise<AiFlashcard> {
    if (data.conversationId) {
      const conversation = await aiConversationRepository.findById(data.conversationId, userId);
      if (!conversation) {
        throw new AiConversationNotFoundError();
      }
    }

    const flashcard = await aiFlashcardRepository.create(userId, data);

    logger.info(`🎴 [AI FLASHCARD] Created flashcard ${flashcard.id} for user ${userId}`);
    return flashcard;
  }

  async getFlashcard(id: string, userId: string): Promise<AiFlashcard> {
    const flashcard = await aiFlashcardRepository.findById(id, userId);
    if (!flashcard) {
      throw new AiFlashcardNotFoundError();
    }
    return flashcard;
  }

  async listFlashcards(
    userId: string,
    params: PaginationParams & { isFavorite?: boolean; difficulty?: FlashcardDifficulty }
  ): Promise<PaginatedResult<AiFlashcard>> {
    return aiFlashcardRepository.listByUser(userId, params);
  }

  async updateFlashcard(id: string, userId: string, data: UpdateFlashcardDTO): Promise<AiFlashcard> {
    await this.getFlashcard(id, userId);
    const updated = await aiFlashcardRepository.update(id, userId, data);
    logger.info(`🎴 [AI FLASHCARD] Updated flashcard ${id}`);
    return updated;
  }

  async deleteFlashcard(id: string, userId: string): Promise<void> {
    await this.getFlashcard(id, userId);
    await aiFlashcardRepository.delete(id, userId);
    logger.info(`🎴 [AI FLASHCARD] Deleted flashcard ${id}`);
  }
}

export const aiFlashcardService = new AiFlashcardService();
