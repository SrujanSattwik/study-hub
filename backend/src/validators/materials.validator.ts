import { z } from 'zod';

export const uploadMaterialSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  link: z.string().url('Invalid link URL').optional().or(z.literal('')),
  type: z.enum(['textbook', 'video', 'audio', 'notes']).optional(),
  author: z.string().max(150).optional(),
  subject: z.string().max(100).optional(),
  difficulty: z.string().max(50).optional(),
});

export const getMaterialsQuerySchema = z.object({
  type: z.enum(['textbook', 'video', 'audio', 'notes', '']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(5),
  user_id: z.string().uuid().optional(),
  search: z.string().optional(),
  subject: z.string().optional(),
  sort: z.string().optional(),
});
