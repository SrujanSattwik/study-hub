import { MessageRole, AttachmentProcessingStatus, FlashcardDifficulty } from '@prisma/client';

export { MessageRole, AttachmentProcessingStatus, FlashcardDifficulty };

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Conversation DTOs ──
export interface CreateConversationDTO {
  title?: string;
  summary?: string;
  modelUsed?: string;
  temperature?: number;
  conversationColor?: string;
  metadata?: Record<string, any>;
}

export interface UpdateConversationDTO {
  title?: string;
  summary?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  conversationColor?: string;
  metadata?: Record<string, any>;
}

// ── Message DTOs ──
export interface CreateMessageDTO {
  conversationId: string;
  role: MessageRole;
  content: string;
  markdown?: string;
  parentMessageId?: string;
  tokenCount?: number;
  finishReason?: string;
  generationTime?: number;
  model?: string;
  metadata?: Record<string, any>;
}

export interface UpdateMessageDTO {
  content?: string;
  markdown?: string;
  htmlCache?: string;
  isEdited?: boolean;
}

// ── Attachment DTOs ──
export interface CreateAttachmentDTO {
  conversationId: string;
  userId: string;
  originalName: string;
  storedName: string;
  extension: string;
  mimeType: string;
  fileSize: number;
  uploadPath: string;
  sha256Hash?: string;
  extractedText?: string;
  ocrText?: string;
  metadata?: Record<string, any>;
}

// ── Flashcard DTOs ──
export interface CreateFlashcardDTO {
  userId?: string;
  conversationId?: string;
  title: string;
  question: string;
  answer: string;
  formula?: string;
  tags?: string;
  difficulty?: FlashcardDifficulty;
  isFavorite?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateFlashcardDTO {
  title?: string;
  question?: string;
  answer?: string;
  formula?: string;
  tags?: string;
  difficulty?: FlashcardDifficulty;
  isFavorite?: boolean;
}

// ─── AI Engine Types (Phase 3) ────────────────────────────────────────────────

export interface AiEngineRequest {
  userId: string;
  conversationId: string;
  userMessage: string;
  parts?: GeminiPart[];          // optional multimodal parts override
}

export interface AiEngineResponse {
  answer: string;
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  generationTimeMs: number;
  model: string;
  finishReason: string;
}

export interface GeminiPart {
  text: string;
}

export interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

export interface BuiltPrompt {
  systemInstruction: string;
  contents: GeminiContent[];
  estimatedPromptTokens: number;
}

export interface ContextDocument {
  name: string;
  extractedText: string;
  relevanceScore: number;
}

export interface ContextFlashcard {
  title: string;
  question: string;
  answer: string;
  formula?: string;
  relevanceScore: number;
}

export interface MemoryPackage {
  conversationSummary: string | null;
  recentMessages: Array<{ role: string; content: string }>;
  documents: ContextDocument[];
  flashcards: ContextFlashcard[];
  totalEstimatedTokens: number;
}

