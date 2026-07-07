import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(255),
  description: z.string().min(1, 'Group description is required'),
  category: z.string().optional().default('other'),
  meetingSchedule: z.string().optional().default('Not scheduled')
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
