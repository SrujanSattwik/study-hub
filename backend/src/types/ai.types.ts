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

// ── Note DTOs (Phase 8.1) ──
export type NoteType =
  | 'executive_summary'
  | 'detailed'
  | 'bullet'
  | 'revision'
  | 'exam'
  | 'eli5'
  | 'key_takeaways'
  | 'definitions'
  | 'formulas'
  | 'mindmap'
  | 'smart';

export interface GenerateNoteDTO {
  conversationId?: string;
  noteType: NoteType;
  customTopic?: string;
  instructions?: string;
}

export interface CreateNoteDTO {
  userId: string;
  conversationId?: string;
  title: string;
  noteType: string;
  content: string;
  summary?: string;
  tags?: string;
  isFavorite?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateNoteDTO {
  title?: string;
  content?: string;
  summary?: string;
  tags?: string;
  isFavorite?: boolean;
}

// ── Deck DTOs (Phase 8.2) ──
export interface CreateDeckDTO {
  userId: string;
  title: string;
  description?: string;
  category?: string;
  isFavorite?: boolean;
}

export interface UpdateDeckDTO {
  title?: string;
  description?: string;
  category?: string;
  isFavorite?: boolean;
  isArchived?: boolean;
}

export interface DeckStats {
  totalCards: number;
  studiedCount: number;
  masteredCount: number;
  accuracyPct: number;
  lastStudiedAt: string | null;
}

// ── Quiz DTOs (Phase 8.2) ──
export type QuizQuestionType = 'mcq' | 'true_false' | 'fill_blank' | 'short_answer' | 'coding' | 'formula';

export interface GenerateQuizDTO {
  conversationId?: string;
  noteId?: string;
  documentId?: string;
  topic?: string;
  sourceType?: 'conversation' | 'note' | 'document' | 'custom' | 'flashcards';
  difficulty?: 'easy' | 'medium' | 'hard';
  numQuestions?: number;
  questionTypes?: QuizQuestionType[];
  timeLimitSec?: number;
}

export interface SubmitQuizAttemptDTO {
  quizId: string;
  userId: string;
  timeTakenSec: number;
  answers: Record<string, { userAnswer: string; isCorrect: boolean; explanation?: string }>;
}

// ── Learning Planner DTOs (Phase 8.4) ──
export type StudyPlanType = 'daily' | 'weekly' | 'monthly' | 'exam_prep' | 'custom';
export type StudyPlanStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type StudyTaskType = 'read_note' | 'review_flashcards' | 'take_quiz' | 'revise_topic' | 'practice_coding' | 'custom';
export type StudyTaskStatus = 'pending' | 'completed' | 'skipped' | 'rescheduled';

export interface GenerateStudyPlanDTO {
  conversationId?: string;
  topic?: string;
  planType?: StudyPlanType;
  targetGoal?: string;
  daysDuration?: number;
  dailyHoursLimit?: number;
}

export interface CreateStudyGoalDTO {
  userId: string;
  title: string;
  description?: string;
  targetCategory?: string;
  targetValue?: number;
  unit?: string;
  targetDate: string;
}

export interface LogStudySessionDTO {
  userId: string;
  durationSec: number;
  sessionType?: string;
  tasksCompletedCount?: number;
  notesUsed?: number;
  flashcardsReviewed?: number;
  quizzesTaken?: number;
  startedAt?: string;
}

export interface LearningProgressSummary {
  totalStudyMinutes: number;
  totalStudyHours: number;
  activeStreakDays: number;
  completedTasksCount: number;
  completedGoalsCount: number;
  quizAccuracyPct: number;
  flashcardMasteryPct: number;
  notesCreatedCount: number;
  heatmap: Record<string, number>; // YYYY-MM-DD -> minutes
}

export interface SmartRecommendationItem {
  category: 'revision' | 'weak_topics' | 'upcoming_goals' | 'deadlines' | 'suggested_notes' | 'suggested_quizzes' | 'suggested_flashcards';
  title: string;
  description: string;
  actionPayload?: Record<string, any>;
  priority: 'high' | 'medium' | 'low';
}

// ── Knowledge Library DTOs (Phase 8.5) ──
export type LibraryEntityType = 'conversation' | 'note' | 'flashcard' | 'deck' | 'quiz' | 'plan' | 'document' | 'message';

export interface CreateBookmarkDTO {
  userId: string;
  entityType: LibraryEntityType;
  entityId: string;
  title: string;
  snippet?: string;
  userNotes?: string;
  isPinned?: boolean;
  isFavorite?: boolean;
}

export interface CreateCollectionDTO {
  userId: string;
  title: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface AddCollectionItemDTO {
  collectionId: string;
  entityType: LibraryEntityType;
  entityId: string;
}

export interface UniversalSearchResultItem {
  id: string;
  entityType: LibraryEntityType;
  title: string;
  snippet?: string;
  createdAt: string;
  tags?: string[];
  isFavorite?: boolean;
  isPinned?: boolean;
  metadata?: Record<string, any>;
}

export interface StorageInsights {
  documentsCount: number;
  notesCount: number;
  flashcardsCount: number;
  decksCount: number;
  quizzesCount: number;
  studyPlansCount: number;
  bookmarksCount: number;
  collectionsCount: number;
}

export interface AssetLineageGraph {
  entityId: string;
  entityType: LibraryEntityType;
  title: string;
  generatedFrom?: Array<{ id: string; entityType: LibraryEntityType; title: string }>;
  derivedAssets?: Array<{ id: string; entityType: LibraryEntityType; title: string }>;
}

export interface KnowledgeBundleManifest {
  exportDate: string;
  version: string;
  exportedBy: string;
  assetCounts: Record<string, number>;
  manifestId: string;
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

// ─── Phase 4: SSE Streaming Types ─────────────────────────────────────────────

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

export interface SseEvent<T = unknown> {
  event: SseEventType;
  data: T;
  id?: string;
}

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

export interface SseErrorPayload {
  code: string;
  message: string;
}

export interface SseMetadataPayload {
  conversationId: string;
  model: string;
  estimatedPromptTokens: number;
}

export interface StreamEngineRequest extends AiEngineRequest {
  abortSignal?: AbortSignal;
}


