import { prisma } from '../database/client';
import { AiAttachment, AttachmentProcessingStatus, Prisma } from '@prisma/client';
import { CreateAttachmentDTO } from '../types/ai.types';

export class AiAttachmentRepository {
  async create(data: CreateAttachmentDTO): Promise<AiAttachment> {
    return prisma.aiAttachment.create({
      data: {
        conversationId: data.conversationId,
        userId: data.userId,
        originalName: data.originalName,
        storedName: data.storedName,
        extension: data.extension,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        uploadPath: data.uploadPath,
        sha256Hash: data.sha256Hash || null,
        extractedText: data.extractedText || null,
        ocrText: data.ocrText || null,
        metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : Prisma.DbNull,
      },
    });
  }

  async findById(id: string, userId: string): Promise<AiAttachment | null> {
    return prisma.aiAttachment.findFirst({
      where: { id, userId },
    });
  }

  async listByConversation(conversationId: string): Promise<AiAttachment[]> {
    return prisma.aiAttachment.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(
    id: string,
    status: AttachmentProcessingStatus,
    extractedText?: string,
    ocrText?: string
  ): Promise<AiAttachment> {
    return prisma.aiAttachment.update({
      where: { id },
      data: {
        processingStatus: status,
        extractedText: extractedText !== undefined ? extractedText : undefined,
        ocrText: ocrText !== undefined ? ocrText : undefined,
      },
    });
  }

  async delete(id: string, userId: string): Promise<AiAttachment> {
    return prisma.aiAttachment.delete({
      where: { id, userId },
    });
  }
}

export const aiAttachmentRepository = new AiAttachmentRepository();
