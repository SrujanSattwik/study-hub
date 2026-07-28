import { Request, Response } from 'express';
import aiDeckService from '../services/ai-deck.service';
import aiFlashcardService from '../services/ai-flashcard.service';
import aiQuizService from '../services/ai-quiz.service';
import { logger } from '../utils/logger';

export class AiQuizController {
  // ── Flashcard Generation & Decks ──────────────────────────────────────────

  async generateFlashcards(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId || 'default-user';
      const { conversationId, deckId, topic, count } = req.body;

      const cards = await aiFlashcardService.generateFlashcards(userId, {
        conversationId,
        deckId,
        topic,
        count: count ? parseInt(count, 10) : 8,
      });

      res.status(201).json({ success: true, data: cards });
    } catch (err: any) {
      logger.error(`[AI QUIZ CONTROLLER] generateFlashcards error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async listDecks(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId || 'default-user';
      const { isFavorite, search, page, limit } = req.query;

      const result = await aiDeckService.listDecks(userId, {
        isFavorite: isFavorite === 'true' ? true : isFavorite === 'false' ? false : undefined,
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.json({ success: true, data: result });
    } catch (err: any) {
      logger.error(`[AI QUIZ CONTROLLER] listDecks error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async createDeck(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId || 'default-user';
      const { title, description, category, isFavorite } = req.body;

      const deck = await aiDeckService.createDeck(userId, {
        userId,
        title,
        description,
        category,
        isFavorite,
      });

      res.status(201).json({ success: true, data: deck });
    } catch (err: any) {
      logger.error(`[AI QUIZ CONTROLLER] createDeck error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getDeckStats(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const stats = await aiDeckService.getDeckStats(id);
      res.json({ success: true, data: stats });
    } catch (err: any) {
      logger.error(`[AI QUIZ CONTROLLER] getDeckStats error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async deleteDeck(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await aiDeckService.deleteDeck(id);
      res.json({ success: true, message: 'Deck deleted successfully' });
    } catch (err: any) {
      logger.error(`[AI QUIZ CONTROLLER] deleteDeck error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── Quizzes & Evaluation ──────────────────────────────────────────────────

  async generateQuiz(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId || 'default-user';
      const { conversationId, noteId, documentId, topic, sourceType, difficulty, numQuestions, timeLimitSec } = req.body;

      const quiz = await aiQuizService.generateQuiz(userId, {
        conversationId,
        noteId,
        documentId,
        topic,
        sourceType,
        difficulty,
        numQuestions: numQuestions ? parseInt(numQuestions, 10) : 5,
        timeLimitSec: timeLimitSec ? parseInt(timeLimitSec, 10) : 300,
      });

      res.status(201).json({ success: true, data: quiz });
    } catch (err: any) {
      logger.error(`[AI QUIZ CONTROLLER] generateQuiz error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async listQuizzes(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId || 'default-user';
      const { conversationId, isTemplate, isFavorite, search, page, limit } = req.query;

      const result = await aiQuizService.listQuizzes(userId, {
        conversationId: conversationId as string,
        isTemplate: isTemplate === 'true' ? true : isTemplate === 'false' ? false : undefined,
        isFavorite: isFavorite === 'true' ? true : isFavorite === 'false' ? false : undefined,
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.json({ success: true, data: result });
    } catch (err: any) {
      logger.error(`[AI QUIZ CONTROLLER] listQuizzes error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getQuizById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const quiz = await aiQuizService.getQuizById(id);

      if (!quiz) {
        res.status(404).json({ success: false, error: 'Quiz not found' });
        return;
      }

      res.json({ success: true, data: quiz });
    } catch (err: any) {
      logger.error(`[AI QUIZ CONTROLLER] getQuizById error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async submitAttempt(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId || 'default-user';
      const { id } = req.params;
      const { timeTakenSec, answers } = req.body;

      const attempt = await aiQuizService.submitAttempt(userId, {
        quizId: id,
        userId,
        timeTakenSec: timeTakenSec || 0,
        answers: answers || {},
      });

      res.status(201).json({ success: true, data: attempt });
    } catch (err: any) {
      logger.error(`[AI QUIZ CONTROLLER] submitAttempt error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async deleteQuiz(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await aiQuizService.deleteQuiz(id);
      res.json({ success: true, message: 'Quiz deleted successfully' });
    } catch (err: any) {
      logger.error(`[AI QUIZ CONTROLLER] deleteQuiz error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const aiQuizController = new AiQuizController();
export default aiQuizController;
