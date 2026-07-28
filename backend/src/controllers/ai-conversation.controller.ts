import { Request, Response, NextFunction } from 'express';
import { aiConversationService } from '../services/ai-conversation.service';
import {
  createConversationSchema,
  updateConversationSchema,
  aiQueryPaginationSchema,
} from '../validators/ai.validator';
import { BadRequestError } from '../utils/errors';

export class AiConversationController {
  async createConversation(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.user_id) throw new BadRequestError('User details missing');
      const body = createConversationSchema.parse(req.body);
      const conversation = await aiConversationService.createConversation(req.user.user_id, body);
      res.status(201).json({
        success: true,
        data: conversation,
        message: 'Conversation created successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async listConversations(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.user_id) throw new BadRequestError('User details missing');
      const query = aiQueryPaginationSchema.parse(req.query);
      const result = await aiConversationService.listConversations(req.user.user_id, query);
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

  async getConversation(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.user_id) throw new BadRequestError('User details missing');
      const conversationId = req.params.conversationId;
      const conversation = await aiConversationService.getFullConversation(conversationId, req.user.user_id);
      res.json({
        success: true,
        data: conversation,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateConversation(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.user_id) throw new BadRequestError('User details missing');
      const conversationId = req.params.conversationId;
      const body = updateConversationSchema.parse(req.body);
      const updated = await aiConversationService.updateConversation(conversationId, req.user.user_id, body);
      res.json({
        success: true,
        data: updated,
        message: 'Conversation updated successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async pinConversation(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.user_id) throw new BadRequestError('User details missing');
      const conversationId = req.params.conversationId;
      const { isPinned } = req.body;
      const updated = await aiConversationService.togglePin(conversationId, req.user.user_id, isPinned);
      res.json({
        success: true,
        data: updated,
        message: `Conversation ${updated.isPinned ? 'pinned' : 'unpinned'} successfully`,
      });
    } catch (err) {
      next(err);
    }
  }

  async archiveConversation(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.user_id) throw new BadRequestError('User details missing');
      const conversationId = req.params.conversationId;
      const { isArchived } = req.body;
      const updated = await aiConversationService.toggleArchive(conversationId, req.user.user_id, isArchived);
      res.json({
        success: true,
        data: updated,
        message: `Conversation ${updated.isArchived ? 'archived' : 'unarchived'} successfully`,
      });
    } catch (err) {
      next(err);
    }
  }

  async restoreConversation(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.user_id) throw new BadRequestError('User details missing');
      const conversationId = req.params.conversationId;
      const restored = await aiConversationService.restoreConversation(conversationId, req.user.user_id);
      res.json({
        success: true,
        data: restored,
        message: 'Conversation restored successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteConversation(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.user_id) throw new BadRequestError('User details missing');
      const conversationId = req.params.conversationId;
      await aiConversationService.deleteConversation(conversationId, req.user.user_id);
      res.json({
        success: true,
        message: 'Conversation soft-deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const aiConversationController = new AiConversationController();
