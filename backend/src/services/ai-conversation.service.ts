import { aiConversationRepository } from '../repositories/ai-conversation.repository';
import { CreateConversationDTO, UpdateConversationDTO, PaginationParams, PaginatedResult } from '../types/ai.types';
import { AiConversationNotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import { AiConversation } from '@prisma/client';

export class AiConversationService {
  async createConversation(userId: string, data: CreateConversationDTO): Promise<AiConversation> {
    const conversation = await aiConversationRepository.create(userId, data);
    logger.info(`💬 [AI CONVERSATION] Created thread ${conversation.id} for user ${userId}`);
    return conversation;
  }

  async getConversation(id: string, userId: string): Promise<AiConversation> {
    const conversation = await aiConversationRepository.findById(id, userId);
    if (!conversation) {
      throw new AiConversationNotFoundError();
    }
    return conversation;
  }

  async getFullConversation(id: string, userId: string) {
    const conversation = await aiConversationRepository.findFullById(id, userId);
    if (!conversation) {
      throw new AiConversationNotFoundError();
    }
    return conversation;
  }

  async listConversations(
    userId: string,
    params: PaginationParams & { isPinned?: boolean; isArchived?: boolean }
  ): Promise<PaginatedResult<AiConversation>> {
    return aiConversationRepository.listByUser(userId, params);
  }

  async updateConversation(id: string, userId: string, data: UpdateConversationDTO): Promise<AiConversation> {
    await this.getConversation(id, userId);
    const updated = await aiConversationRepository.update(id, userId, data);
    logger.info(`💬 [AI CONVERSATION] Updated thread ${id}`);
    return updated;
  }

  async togglePin(id: string, userId: string, isPinned?: boolean): Promise<AiConversation> {
    const existing = await this.getConversation(id, userId);
    const targetState = isPinned !== undefined ? isPinned : !existing.isPinned;
    const updated = await aiConversationRepository.update(id, userId, { isPinned: targetState });
    logger.info(`📌 [AI CONVERSATION] Pin state set to ${targetState} for thread ${id}`);
    return updated;
  }

  async toggleArchive(id: string, userId: string, isArchived?: boolean): Promise<AiConversation> {
    const existing = await this.getConversation(id, userId);
    const targetState = isArchived !== undefined ? isArchived : !existing.isArchived;
    const updated = await aiConversationRepository.update(id, userId, { isArchived: targetState });
    logger.info(`📁 [AI CONVERSATION] Archive state set to ${targetState} for thread ${id}`);
    return updated;
  }

  async restoreConversation(id: string, userId: string): Promise<AiConversation> {
    const restored = await aiConversationRepository.restore(id, userId);
    logger.info(`♻️ [AI CONVERSATION] Restored thread ${id}`);
    return restored;
  }

  async deleteConversation(id: string, userId: string): Promise<void> {
    await this.getConversation(id, userId);
    await aiConversationRepository.softDelete(id, userId);
    logger.info(`💬 [AI CONVERSATION] Soft deleted thread ${id}`);
  }
}

export const aiConversationService = new AiConversationService();

