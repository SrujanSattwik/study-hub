export type MessageRole = 'user' | 'assistant' | 'system';

export type FlashcardDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type AttachmentProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface AiConversation {
  id: string;
  userId: string;
  title: string;
  summary: string | null;
  modelUsed: string;
  temperature: number;
  totalMessages: number;
  totalTokens: number;
  isPinned: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  conversationColor: string | null;
  metadata?: Record<string, any> | null;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  markdown?: string | null;
  htmlCache?: string | null;
  tokenCount?: number | null;
  isEdited?: boolean;
  finishReason?: string | null;
  generationTime?: number | null;
  model?: string | null;
  metadata?: {
    hasCodeBlocks?: boolean;
    hasMathExpressions?: boolean;
    hasTables?: boolean;
    streamed?: boolean;
    estimatedReadingTimeSeconds?: number;
    [key: string]: any;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiAttachment {
  id: string;
  conversationId: string;
  userId: string;
  originalName: string;
  storedName: string;
  extension: string;
  mimeType: string;
  fileSize: number;
  uploadPath: string;
  sha256Hash?: string | null;
  status: AttachmentProcessingStatus;
  extractedText?: string | null;
  ocrText?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiFlashcard {
  id: string;
  userId: string;
  conversationId?: string | null;
  title: string;
  question: string;
  answer: string;
  formula?: string | null;
  tags?: string | null;
  difficulty: FlashcardDifficulty;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AiUsagePeriodStats {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  requestCount: number;
}

export interface AiUsageStats {
  today: AiUsagePeriodStats;
  monthly: AiUsagePeriodStats;
  totalConversations: number;
  totalFlashcards: number;
}

// ─── SSE Event Payloads ───────────────────────────────────────────────────────

export type SseEventType =
  | 'conversation_started'
  | 'thinking'
  | 'token'
  | 'partial_message'
  | 'progress'
  | 'heartbeat'
  | 'completed'
  | 'aborted'
  | 'error'
  | 'metadata'
  | 'done';

export interface SseTokenPayload {
  text: string;
  index: number;
}

export interface SseCompletedPayload {
  userMessageId: string;
  assistantMessageId: string;
  answer: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  generationTimeMs: number;
  model: string;
  finishReason: string;
}

export interface SseMetadataPayload {
  conversationId: string;
  model: string;
  estimatedPromptTokens: number;
}

export interface SseErrorPayload {
  code: string;
  message: string;
}
