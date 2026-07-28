import { aiAttachmentRepository } from '../repositories/ai-attachment.repository';
import { aiConversationRepository } from '../repositories/ai-conversation.repository';
import { CreateAttachmentDTO } from '../types/ai.types';
import { AiConversationNotFoundError, AiAttachmentNotFoundError } from '../utils/errors';
import { StorageUtils } from '../utils/storage';
import { logger } from '../utils/logger';
import { AiAttachment, AttachmentProcessingStatus } from '@prisma/client';

export class AiAttachmentService {
  async registerAttachment(userId: string, data: CreateAttachmentDTO): Promise<AiAttachment> {
    const conversation = await aiConversationRepository.findById(data.conversationId, userId);
    if (!conversation) {
      throw new AiConversationNotFoundError();
    }

    const attachment = await aiAttachmentRepository.create(data);
    logger.info(`📎 [AI ATTACHMENT] Registered attachment ${attachment.id} for conversation ${data.conversationId}`);
    return attachment;
  }

  async listAttachments(conversationId: string, userId: string): Promise<AiAttachment[]> {
    const conversation = await aiConversationRepository.findById(conversationId, userId);
    if (!conversation) {
      throw new AiConversationNotFoundError();
    }

    return aiAttachmentRepository.listByConversation(conversationId);
  }

  async updateStatus(
    id: string,
    userId: string,
    status: AttachmentProcessingStatus,
    extractedText?: string,
    ocrText?: string
  ): Promise<AiAttachment> {
    const attachment = await aiAttachmentRepository.findById(id, userId);
    if (!attachment) {
      throw new AiAttachmentNotFoundError();
    }

    return aiAttachmentRepository.updateStatus(id, status, extractedText, ocrText);
  }

  async deleteAttachment(id: string, userId: string): Promise<void> {
    const attachment = await aiAttachmentRepository.findById(id, userId);
    if (!attachment) {
      throw new AiAttachmentNotFoundError();
    }

    // Safely remove file from disk
    await StorageUtils.safeUnlink(attachment.uploadPath);

    await aiAttachmentRepository.delete(id, userId);
    logger.info(`📎 [AI ATTACHMENT] Deleted attachment ${id} from database and disk`);
  }
}

export const aiAttachmentService = new AiAttachmentService();
