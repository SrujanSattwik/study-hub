import { Request, Response } from 'express';
import aiLibraryService from '../services/ai-library.service';
import { logger } from '../utils/logger';

export class AiLibraryController {
  async universalSearch(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId || 'default-user';
      const { q, type } = req.query;

      const results = await aiLibraryService.universalSearch(userId, (q as string) || '', type as string);
      res.json({ success: true, data: results });
    } catch (err: any) {
      logger.error(`[AI LIBRARY CONTROLLER] universalSearch error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async createBookmark(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId || 'default-user';
      const { entityType, entityId, title, snippet, userNotes, isPinned, isFavorite } = req.body;

      const bookmark = await aiLibraryService.createBookmark({
        userId,
        entityType,
        entityId,
        title,
        snippet,
        userNotes,
        isPinned,
        isFavorite,
      });

      res.status(201).json({ success: true, data: bookmark });
    } catch (err: any) {
      logger.error(`[AI LIBRARY CONTROLLER] createBookmark error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async listBookmarks(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId || 'default-user';
      const bookmarks = await aiLibraryService.listBookmarks(userId);
      res.json({ success: true, data: bookmarks });
    } catch (err: any) {
      logger.error(`[AI LIBRARY CONTROLLER] listBookmarks error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async deleteBookmark(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await aiLibraryService.deleteBookmark(id);
      res.json({ success: true, message: 'Bookmark deleted' });
    } catch (err: any) {
      logger.error(`[AI LIBRARY CONTROLLER] deleteBookmark error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async createCollection(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId || 'default-user';
      const { title, description, color, icon } = req.body;

      const collection = await aiLibraryService.createCollection({
        userId,
        title,
        description,
        color,
        icon,
      });

      res.status(201).json({ success: true, data: collection });
    } catch (err: any) {
      logger.error(`[AI LIBRARY CONTROLLER] createCollection error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async listCollections(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId || 'default-user';
      const collections = await aiLibraryService.listCollections(userId);
      res.json({ success: true, data: collections });
    } catch (err: any) {
      logger.error(`[AI LIBRARY CONTROLLER] listCollections error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async addItemToCollection(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { entityType, entityId } = req.body;

      const item = await aiLibraryService.addItemToCollection({
        collectionId: id,
        entityType,
        entityId,
      });

      res.status(201).json({ success: true, data: item });
    } catch (err: any) {
      logger.error(`[AI LIBRARY CONTROLLER] addItemToCollection error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async deleteCollection(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await aiLibraryService.deleteCollection(id);
      res.json({ success: true, message: 'Collection deleted' });
    } catch (err: any) {
      logger.error(`[AI LIBRARY CONTROLLER] deleteCollection error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async listTags(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId || 'default-user';
      const tags = await aiLibraryService.listTags(userId);
      res.json({ success: true, data: tags });
    } catch (err: any) {
      logger.error(`[AI LIBRARY CONTROLLER] listTags error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getStorageInsights(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId || 'default-user';
      const stats = await aiLibraryService.getStorageInsights(userId);
      res.json({ success: true, data: stats });
    } catch (err: any) {
      logger.error(`[AI LIBRARY CONTROLLER] getStorageInsights error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getAssetLineage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { entityType } = req.query;

      const lineage = await aiLibraryService.getAssetLineage(id, (entityType as any) || 'note');
      res.json({ success: true, data: lineage });
    } catch (err: any) {
      logger.error(`[AI LIBRARY CONTROLLER] getAssetLineage error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async exportKnowledgeBundle(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId || 'default-user';
      const bundle = await aiLibraryService.exportKnowledgeBundle(userId);
      res.json({ success: true, data: bundle });
    } catch (err: any) {
      logger.error(`[AI LIBRARY CONTROLLER] exportKnowledgeBundle error: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const aiLibraryController = new AiLibraryController();
export default aiLibraryController;
