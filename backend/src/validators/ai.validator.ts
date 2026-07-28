import { z } from 'zod';
import { MessageRole, FlashcardDifficulty } from '@prisma/client';

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const createConversationSchema = z.object({
  title: z.string().max(255).optional(),
  summary: z.string().optional(),
  modelUsed: z.string().max(100).optional(),
  temperature: z.number().min(0).max(2).optional(),
  conversationColor: z.string().max(50).optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateConversationSchema = z.object({
  title: z.string().max(255).optional(),
  summary: z.string().optional(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  conversationColor: z.string().max(50).optional(),
  metadata: z.record(z.any()).optional(),
});

export const createMessageSchema = z.object({
  conversationId: uuidSchema,
  role: z.nativeEnum(MessageRole),
  content: z.string().min(1, 'Message content cannot be empty'),
  markdown: z.string().optional(),
  parentMessageId: uuidSchema.optional(),
  tokenCount: z.number().int().nonnegative().optional(),
  finishReason: z.string().max(50).optional(),
  generationTime: z.number().int().nonnegative().optional(),
  model: z.string().max(100).optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateMessageSchema = z.object({
  content: z.string().min(1).optional(),
  markdown: z.string().optional(),
  htmlCache: z.string().optional(),
  isEdited: z.boolean().optional(),
});

export const createFlashcardSchema = z.object({
  conversationId: uuidSchema.optional(),
  title: z.string().min(1, 'Title is required').max(255),
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
  formula: z.string().optional(),
  tags: z.string().optional(),
  difficulty: z.nativeEnum(FlashcardDifficulty).optional(),
  isFavorite: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateFlashcardSchema = createFlashcardSchema.partial();

export const aiQueryPaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  isPinned: z.coerce.boolean().optional(),
  isArchived: z.coerce.boolean().optional(),
});
