import { Request, Response, NextFunction } from 'express';
import { aiAttachmentService } from '../services/ai-attachment.service';
import { BadRequestError } from '../utils/errors';
import { AttachmentProcessingStatus } from '@prisma/client';
import path from 'path';

export class AiAttachmentController {
  async registerAttachment(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.user_id) throw new BadRequestError('User details missing');
      const conversationId = req.params.conversationId;
      const { originalName, storedName, extension, mimeType, fileSize, uploadPath, sha256Hash, extractedText, ocrText, metadata } = req.body;

      if (!originalName || !storedName || !uploadPath) {
        throw new BadRequestError('Attachment metadata missing required fields');
      }

      const attachment = await aiAttachmentService.registerAttachment(req.user.user_id, {
        conversationId,
        userId: req.user.user_id,
        originalName,
        storedName,
        extension: extension || path.extname(originalName).slice(1),
        mimeType: mimeType || 'application/octet-stream',
        fileSize: fileSize || 0,
        uploadPath,
        sha256Hash,
        extractedText,
        ocrText,
        metadata,
      });

      res.status(201).json({
        success: true,
        data: attachment,
        message: 'Attachment metadata registered successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async listAttachments(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.user_id) throw new BadRequestError('User details missing');
      const conversationId = req.params.conversationId;
      const attachments = await aiAttachmentService.listAttachments(conversationId, req.user.user_id);
      res.json({
        success: true,
        data: attachments,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.user_id) throw new BadRequestError('User details missing');
      const attachmentId = req.params.attachmentId;
      const { status, extractedText, ocrText } = req.body;

      if (!status || !Object.values(AttachmentProcessingStatus).includes(status)) {
        throw new BadRequestError('Invalid processing status');
      }

      const updated = await aiAttachmentService.updateStatus(
        attachmentId,
        req.user.user_id,
        status as AttachmentProcessingStatus,
        extractedText,
        ocrText
      );

      res.json({
        success: true,
        data: updated,
        message: 'Attachment processing status updated',
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteAttachment(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.user_id) throw new BadRequestError('User details missing');
      const attachmentId = req.params.attachmentId;

      await aiAttachmentService.deleteAttachment(attachmentId, req.user.user_id);
      res.json({
        success: true,
        message: 'Attachment deleted from database and storage',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const aiAttachmentController = new AiAttachmentController();
