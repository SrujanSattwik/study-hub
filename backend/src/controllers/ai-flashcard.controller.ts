import { Request, Response, NextFunction } from 'express';
import { aiFlashcardService } from '../services/ai-flashcard.service';
import {
  createFlashcardSchema,
  updateFlashcardSchema,
  aiQueryPaginationSchema,
} from '../validators/ai.validator';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { FlashcardDifficulty } from '@prisma/client';

export class AiFlashcardController {
  async createFlashcard(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.user_id) throw new BadRequestError('User details missing');
      const body = createFlashcardSchema.parse(req.body);
      const flashcard = await aiFlashcardService.createFlashcard(req.user.user_id, body);
      res.status(201).json({
        success: true,
        data: flashcard,
        message: 'Math Flashcard created successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async listFlashcards(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.user_id) throw new BadRequestError('User details missing');
      const query = aiQueryPaginationSchema.parse(req.query);
      const isFavorite = req.query.isFavorite !== undefined ? req.query.isFavorite === 'true' : undefined;
      const difficulty = req.query.difficulty as FlashcardDifficulty | undefined;

      const result = await aiFlashcardService.listFlashcards(req.user.user_id, {
        ...query,
        isFavorite,
        difficulty,
      });

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

  async getFlashcard(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.user_id) throw new BadRequestError('User details missing');
      const flashcardId = req.params.flashcardId;
      const flashcard = await aiFlashcardService.getFlashcard(flashcardId, req.user.user_id);
      res.json({
        success: true,
        data: flashcard,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateFlashcard(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.user_id) throw new BadRequestError('User details missing');
      const flashcardId = req.params.flashcardId;
      const body = updateFlashcardSchema.parse(req.body);
      const updated = await aiFlashcardService.updateFlashcard(flashcardId, req.user.user_id, body);
      res.json({
        success: true,
        data: updated,
        message: 'Flashcard updated successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async toggleFavorite(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.user_id) throw new BadRequestError('User details missing');
      const flashcardId = req.params.flashcardId;
      const existing = await aiFlashcardService.getFlashcard(flashcardId, req.user.user_id);
      if (!existing) throw new NotFoundError('Flashcard not found');
      const updated = await aiFlashcardService.updateFlashcard(flashcardId, req.user.user_id, {
        isFavorite: !existing.isFavorite,
      });
      res.json({
        success: true,
        data: updated,
        message: `Flashcard ${updated.isFavorite ? 'favorited' : 'unfavorited'} successfully`,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteFlashcard(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.user_id) throw new BadRequestError('User details missing');
      const flashcardId = req.params.flashcardId;
      await aiFlashcardService.deleteFlashcard(flashcardId, req.user.user_id);
      res.json({
        success: true,
        message: 'Flashcard deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const aiFlashcardController = new AiFlashcardController();
