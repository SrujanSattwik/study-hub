import { Request, Response, NextFunction } from 'express';
import { aiMessageService } from '../services/ai-message.service';
import {
  createMessageSchema,
  updateMessageSchema,
  aiQueryPaginationSchema,
} from '../validators/ai.validator';
import { BadRequestError } from '../utils/errors';

export class AiMessageController {
  async createMessage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.user_id) throw new BadRequestError('User details missing');
      const conversationId = req.params.conversationId;
      const body = createMessageSchema.parse({
        ...req.body,
        conversationId,
      });

      const message = await aiMessageService.createMessage(req.user.user_id, body);
      res.status(201).json({
        success: true,
        data: message,
        message: 'Message added to conversation',
      });
    } catch (err) {
      next(err);
    }
  }

  async listMessages(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.user_id) throw new BadRequestError('User details missing');
      const conversationId = req.params.conversationId;
      const query = aiQueryPaginationSchema.parse(req.query);
      const result = await aiMessageService.listMessages(conversationId, req.user.user_id, query);

      res.json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateMessage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.user_id) throw new BadRequestError('User details missing');
      const messageId = req.params.messageId;
      const body = updateMessageSchema.parse(req.body);

      const updated = await aiMessageService.updateMessage(messageId, req.user.user_id, body);
      res.json({
        success: true,
        data: updated,
        message: 'Message updated successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteMessage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.user_id) throw new BadRequestError('User details missing');
      const messageId = req.params.messageId;

      await aiMessageService.deleteMessage(messageId, req.user.user_id);
      res.json({
        success: true,
        message: 'Message deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const aiMessageController = new AiMessageController();
