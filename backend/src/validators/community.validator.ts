import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(255),
  description: z.string().min(1, 'Group description is required'),
  category: z.string().optional().default('other'),
  meetingSchedule: z.string().optional().default('Not scheduled'),
  icon: z.string().optional()
});

export const getGroupsQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.string().optional()
});

export const createPostSchema = z.object({
  content: z.string().min(1, 'Post content cannot be empty')
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content cannot be empty'),
  parentId: z.string().uuid().optional().nullable().or(z.literal(''))
});

export const createFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required'),
  parentId: z.string().uuid().optional().nullable().or(z.literal(''))
});

export const uploadGroupMaterialSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional().nullable().or(z.literal('')),
  tags: z.string().optional()
});

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  content: z.string().min(1, 'Content is required'),
  pinned: z.boolean().optional().default(false)
});

export const createQuestionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(1, 'Description is required'),
  subject: z.string().optional(),
  tags: z.string().optional(),
  attachmentUrl: z.string().optional()
});

export const createAnswerSchema = z.object({
  content: z.string().min(1, 'Answer content cannot be empty'),
  attachmentUrl: z.string().optional()
});

export const createMeetingSchema = z.object({
  title: z.string().min(1, 'Meeting title is required').max(255)
});

