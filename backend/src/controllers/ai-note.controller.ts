import { Request, Response } from 'express';
import aiNoteService from '../services/ai-note.service';
import { logger } from '../utils/logger';

export class AiNoteController {
  /**
   * POST /api/ai/notes/generate
   */
  async generateNote(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId || 'default-user';
      const { conversationId, noteType, customTopic, instructions } = req.body;

      if (!noteType) {
        res.status(400).json({ success: false, error: 'noteType is required' });
        return;
      }

      const note = await aiNoteService.generateNote(userId, {
        conversationId,
        noteType,
        customTopic,
        instructions,
      });

      res.status(201).json({
        success: true,
        data: note,
      });
    } catch (err: any) {
      logger.error(`[AI NOTE CONTROLLER] generateNote error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/ai/notes
   */
  async listNotes(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId || 'default-user';
      const { conversationId, isFavorite, search, page, limit } = req.query;

      const result = await aiNoteService.listNotes(userId, {
        conversationId: conversationId as string,
        isFavorite: isFavorite === 'true' ? true : isFavorite === 'false' ? false : undefined,
        search: search as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      logger.error(`[AI NOTE CONTROLLER] listNotes error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/ai/notes/:id
   */
  async getNoteById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const note = await aiNoteService.getNoteById(id);

      if (!note) {
        res.status(404).json({ success: false, error: 'Note not found' });
        return;
      }

      res.json({
        success: true,
        data: note,
      });
    } catch (err: any) {
      logger.error(`[AI NOTE CONTROLLER] getNoteById error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * PATCH /api/ai/notes/:id
   */
  async updateNote(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, content, summary, tags, isFavorite } = req.body;

      const note = await aiNoteService.updateNote(id, {
        title,
        content,
        summary,
        tags,
        isFavorite,
      });

      res.json({
        success: true,
        data: note,
      });
    } catch (err: any) {
      logger.error(`[AI NOTE CONTROLLER] updateNote error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/ai/notes/:id/regenerate
   */
  async regenerateNote(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { instructions } = req.body;

      const note = await aiNoteService.regenerateNote(id, instructions);

      res.json({
        success: true,
        data: note,
      });
    } catch (err: any) {
      logger.error(`[AI NOTE CONTROLLER] regenerateNote error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * DELETE /api/ai/notes/:id
   */
  async deleteNote(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await aiNoteService.deleteNote(id);

      res.json({
        success: true,
        message: 'Note deleted successfully',
      });
    } catch (err: any) {
      logger.error(`[AI NOTE CONTROLLER] deleteNote error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const aiNoteController = new AiNoteController();
export default aiNoteController;
