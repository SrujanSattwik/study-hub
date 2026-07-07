import { Request, Response, NextFunction } from 'express';
import { communityService } from '../services/community.service';
import {
  createGroupSchema,
  getGroupsQuerySchema,
  createPostSchema,
  createCommentSchema,
  createFolderSchema,
  uploadGroupMaterialSchema,
  createAnnouncementSchema,
  createQuestionSchema,
  createAnswerSchema,
  createMeetingSchema
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
      const groups = await communityService.listGroups(query.category, query.search, query.sort);
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
        body.meetingSchedule,
        body.icon
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

  async deleteGroupMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const { id: groupId, materialId } = req.params;
      await communityService.deleteGroupMaterial(req.user.user_id, groupId, materialId);
      res.json({ success: true, message: 'Material deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  async getGroupAnnouncements(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const { id: groupId } = req.params;
      const announcements = await communityService.getGroupAnnouncements(req.user.user_id, groupId);
      res.json({ success: true, announcements });
    } catch (err) {
      next(err);
    }
  }

  async createGroupAnnouncement(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const { id: groupId } = req.params;
      const body = createAnnouncementSchema.parse(req.body);
      const announcement = await communityService.createGroupAnnouncement(
        req.user.user_id,
        groupId,
        body.title,
        body.content,
        body.pinned
      );
      res.json({ success: true, message: 'Announcement created successfully', announcement });
    } catch (err) {
      next(err);
    }
  }

  async updateGroupAnnouncement(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const { id: groupId, announcementId } = req.params;
      const body = createAnnouncementSchema.parse(req.body);
      const announcement = await communityService.updateGroupAnnouncement(
        req.user.user_id,
        groupId,
        announcementId,
        body.title,
        body.content,
        body.pinned
      );
      res.json({ success: true, message: 'Announcement updated successfully', announcement });
    } catch (err) {
      next(err);
    }
  }

  async deleteGroupAnnouncement(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const { id: groupId, announcementId } = req.params;
      await communityService.deleteGroupAnnouncement(req.user.user_id, groupId, announcementId);
      res.json({ success: true, message: 'Announcement deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  async getGroupQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const { id: groupId } = req.params;
      const questions = await communityService.getGroupQuestions(req.user.user_id, groupId);
      res.json({ success: true, questions });
    } catch (err) {
      next(err);
    }
  }

  async createGroupQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const { id: groupId } = req.params;
      const body = createQuestionSchema.parse(req.body);
      const question = await communityService.createGroupQuestion(
        req.user.user_id,
        groupId,
        body.title,
        body.description,
        body.subject,
        body.tags,
        body.attachmentUrl
      );
      res.json({ success: true, message: 'Question created successfully', question });
    } catch (err) {
      next(err);
    }
  }

  async updateGroupQuestionStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const { id: groupId, questionId } = req.params;
      const { isSolved } = req.body;
      const question = await communityService.updateGroupQuestionStatus(
        req.user.user_id,
        groupId,
        questionId,
        isSolved
      );
      res.json({ success: true, message: 'Question status updated', question });
    } catch (err) {
      next(err);
    }
  }

  async deleteGroupQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const { id: groupId, questionId } = req.params;
      await communityService.deleteGroupQuestion(req.user.user_id, groupId, questionId);
      res.json({ success: true, message: 'Question deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  async createGroupAnswer(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const { id: groupId, questionId } = req.params;
      const body = createAnswerSchema.parse(req.body);
      const answer = await communityService.createGroupAnswer(
        req.user.user_id,
        groupId,
        questionId,
        body.content,
        body.attachmentUrl
      );
      res.json({ success: true, message: 'Answer added successfully', answer });
    } catch (err) {
      next(err);
    }
  }

  async deleteGroupAnswer(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const { id: groupId, answerId } = req.params;
      await communityService.deleteGroupAnswer(req.user.user_id, groupId, answerId);
      res.json({ success: true, message: 'Answer deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  async getGroupMeetings(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const { id: groupId } = req.params;
      const meetings = await communityService.getGroupMeetings(req.user.user_id, groupId);
      res.json({ success: true, meetings });
    } catch (err) {
      next(err);
    }
  }

  async createGroupMeeting(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const { id: groupId } = req.params;
      const body = createMeetingSchema.parse(req.body);
      const meeting = await communityService.createGroupMeeting(
        req.user.user_id,
        groupId,
        body.title
      );
      res.json({ success: true, message: 'Meeting started successfully', meeting });
    } catch (err) {
      next(err);
    }
  }

  async endGroupMeeting(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const { id: groupId, meetingId } = req.params;
      const meeting = await communityService.endGroupMeeting(
        req.user.user_id,
        groupId,
        meetingId
      );
      res.json({ success: true, message: 'Meeting ended successfully', meeting });
    } catch (err) {
      next(err);
    }
  }

  async trackGroupMaterialDownload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.user_id) throw new BadRequestError('User details missing');
      const { id: groupId, materialId } = req.params;
      await communityService.trackGroupMaterialDownload(req.user.user_id, groupId, materialId);
      res.json({ success: true, message: 'Download tracked successfully' });
    } catch (err) {
      next(err);
    }
  }
}
export const communityController = new CommunityController();
