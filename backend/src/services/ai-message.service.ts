import { aiMessageRepository } from '../repositories/ai-message.repository';
import { aiConversationRepository } from '../repositories/ai-conversation.repository';
import { CreateMessageDTO, UpdateMessageDTO, PaginationParams, PaginatedResult } from '../types/ai.types';
import { AiConversationNotFoundError, AiMessageNotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import { AiMessage } from '@prisma/client';

export class AiMessageService {
  async createMessage(userId: string, data: CreateMessageDTO): Promise<AiMessage> {
    const conversation = await aiConversationRepository.findById(data.conversationId, userId);
    if (!conversation) {
      throw new AiConversationNotFoundError();
    }

    const message = await aiMessageRepository.create(data);
    await aiConversationRepository.incrementStats(
      data.conversationId,
      1,
      data.tokenCount || 0
    );

    logger.info(`✉️ [AI MESSAGE] Added ${data.role} message ${message.id} to conversation ${data.conversationId}`);
    return message;
  }

  async listMessages(
    conversationId: string,
    userId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<AiMessage>> {
    const conversation = await aiConversationRepository.findById(conversationId, userId);
    if (!conversation) {
      throw new AiConversationNotFoundError();
    }

    return aiMessageRepository.listByConversation(conversationId, params);
  }

  async updateMessage(id: string, userId: string, data: UpdateMessageDTO): Promise<AiMessage> {
    const message = await aiMessageRepository.findById(id);
    if (!message) {
      throw new AiMessageNotFoundError();
    }

    // Verify conversation ownership
    const conversation = await aiConversationRepository.findById(message.conversationId, userId);
    if (!conversation) {
      throw new AiConversationNotFoundError();
    }

    const updated = await aiMessageRepository.update(id, data);
    logger.info(`✉️ [AI MESSAGE] Updated message ${id}`);
    return updated;
  }

  async deleteMessage(id: string, userId: string): Promise<void> {
    const message = await aiMessageRepository.findById(id);
    if (!message) {
      throw new AiMessageNotFoundError();
    }

    const conversation = await aiConversationRepository.findById(message.conversationId, userId);
    if (!conversation) {
      throw new AiConversationNotFoundError();
    }

    await aiMessageRepository.delete(id);
    logger.info(`✉️ [AI MESSAGE] Deleted message ${id}`);
  }
}

export const aiMessageService = new AiMessageService();
