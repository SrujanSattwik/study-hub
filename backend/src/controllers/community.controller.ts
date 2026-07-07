import { Request, Response, NextFunction } from 'express';
import { communityService } from '../services/community.service';
import {
  createGroupSchema,
  getGroupsQuerySchema,
  createPostSchema,
  createCommentSchema,
  createFolderSchema,
  uploadGroupMaterialSchema
} from '../validators/community.validator';
import { BadRequestError } from '../utils/errors';

export class CommunityController {
  async getHomeBundle(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const bundle = await communityService.getHomeBundle(req.user.user_id);
      res.json({ success: true, bundle });
    } catch (err) {
      next(err);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const stats = await communityService.getStats(req.user.user_id);
      res.json({ success: true, stats });
    } catch (err) {
      next(err);
    }
  }

  async getTrending(req: Request, res: Response, next: NextFunction) {
    try {
      const trending = await communityService.getTrending();
      res.json({ success: true, trending });
    } catch (err) {
      next(err);
    }
  }

  async getChallenges(req: Request, res: Response, next: NextFunction) {
    try {
      // In-line static challenges structure preserved
      const challenges = [
        { id: 1, title: 'Calculus Conqueror', description: 'Solve 3 questions on the math board', progress: 66, goal: '3 questions', reward: '50 XP' },
        { id: 2, title: 'Group Guru', description: 'Join an active study meeting for 30 minutes', progress: 100, goal: '30 mins', reward: '100 XP' },
        { id: 3, title: 'Librarian', description: 'Upload a study resource to private materials', progress: 0, goal: '1 file', reward: '30 XP' }
      ];
      res.json({ success: true, challenges });
    } catch (err) {
      next(err);
    }
  }

  async getUpcomingEvents(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const events = await communityService.getUpcomingEvents(req.user.user_id);
      res.json({ success: true, events });
    } catch (err) {
      next(err);
    }
  }

  async getSuggestedGroups(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const groups = await communityService.getSuggestedGroups(req.user.user_id);
      res.json({ success: true, groups });
    } catch (err) {
      next(err);
    }
  }

  async getJoinedGroups(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const groups = await communityService.getJoinedGroups(req.user.user_id);
      res.json({ success: true, groups });
    } catch (err) {
      next(err);
    }
  }

  async listGroups(req: Request, res: Response, next: NextFunction) {
    try {
      const query = getGroupsQuerySchema.parse(req.query);
      const groups = await communityService.listGroups(query.category, query.search);
      res.json({ success: true, groups });
    } catch (err) {
      next(err);
    }
  }

  async createGroup(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const body = createGroupSchema.parse(req.body);
      const { groupId } = await communityService.createGroup(
        req.user.user_id,
        body.name,
        body.description,
        body.category,
        body.meetingSchedule
      );
      res.json({ success: true, groupId, message: 'Group created successfully' });
    } catch (err) {
      next(err);
    }
  }

  async joinGroup(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const groupId = req.params.id;
      const result = await communityService.joinGroup(req.user.user_id, groupId);
      res.json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  }

  async leaveGroup(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const groupId = req.params.id;
      const result = await communityService.leaveGroup(req.user.user_id, groupId);
      res.json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  }

  async getGroupWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const groupId = req.params.id;
      const result = await communityService.getGroupWorkspace(req.user.user_id, groupId);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getFeed(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const posts = await communityService.getFeed(req.user.user_id);
      res.json({ success: true, posts });
    } catch (err) {
      next(err);
    }
  }

  async createPost(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const body = createPostSchema.parse(req.body);
      const result = await communityService.createPost(req.user.user_id, body.content, req.file);
      res.json({ success: true, message: 'Posted successfully', postId: result.postId });
    } catch (err) {
      next(err);
    }
  }

  async likePost(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const result = await communityService.toggleLikePost(req.user.user_id, req.params.id);
      res.json({ success: true, liked: result.liked });
    } catch (err) {
      next(err);
    }
  }

  async getComments(req: Request, res: Response, next: NextFunction) {
    try {
      const comments = await communityService.getComments(req.params.id);
      res.json({ success: true, comments });
    } catch (err) {
      next(err);
    }
  }

  async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const body = createCommentSchema.parse(req.body);
      await communityService.addComment(req.user.user_id, req.params.id, body.content, body.parentId);
      res.json({ success: true, message: 'Comment added successfully' });
    } catch (err) {
      next(err);
    }
  }

  async deletePost(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      await communityService.deletePost(req.user.user_id, req.params.id);
      res.json({ success: true, message: 'Post deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  async getGroupMaterials(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const groupId = req.params.id;
      const categoryId = req.query.categoryId as string | undefined;
      const result = await communityService.getGroupMaterials(req.user.user_id, groupId, categoryId);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async createGroupFolder(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const groupId = req.params.id;
      const body = createFolderSchema.parse(req.body);
      const result = await communityService.createGroupFolder(req.user.user_id, groupId, body.name, body.parentId);
      res.json({ success: true, message: 'Folder created successfully', folderId: result.folderId });
    } catch (err) {
      next(err);
    }
  }

  async uploadGroupMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const groupId = req.params.id;
      const body = uploadGroupMaterialSchema.parse(req.body);
      const result = await communityService.uploadGroupMaterial(
        req.user.user_id,
        groupId,
        body.title,
        body.description,
        body.categoryId,
        body.tags,
        req.file
      );
      res.json({ success: true, message: 'Material added successfully', materialId: result.materialId });
    } catch (err) {
      next(err);
    }
  }
}
export const communityController = new CommunityController();
