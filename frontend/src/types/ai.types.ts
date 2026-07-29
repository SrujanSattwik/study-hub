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

export interface AiNote {
  id: string;
  userId: string;
  conversationId?: string | null;
  title: string;
  noteType: string;
  content: string;
  summary?: string | null;
  tags?: string | null;
  isFavorite: boolean;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateNoteDTO {
  conversationId?: string;
  noteType: NoteType;
  customTopic?: string;
  instructions?: string;
}

export interface AiDeck {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  category?: string | null;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { flashcards: number };
}

export interface DeckStats {
  totalCards: number;
  studiedCount: number;
  masteredCount: number;
  accuracyPct: number;
  lastStudiedAt: string | null;
}

export interface AiQuizQuestion {
  id: string;
  quizId: string;
  questionText: string;
  questionType: 'mcq' | 'true_false' | 'fill_blank' | 'short_answer' | 'coding' | 'formula';
  options?: string[] | null;
  correctAnswer: string;
  explanation?: string | null;
  codeSnippet?: string | null;
  aiConfidence: number;
  orderIndex: number;
}

export interface AiQuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  timeTakenSec: number;
  userAnswers?: Record<string, any> | null;
  completedAt: string;
}

export interface AiQuiz {
  id: string;
  userId: string;
  conversationId?: string | null;
  title: string;
  description?: string | null;
  topic?: string | null;
  sourceType: string;
  difficulty: string;
  timeLimitSec: number;
  isTemplate: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  questions?: AiQuizQuestion[];
  attempts?: AiQuizAttempt[];
  _count?: { questions: number; attempts: number };
  createdAt: string;
  updatedAt: string;
}

export interface GenerateQuizDTO {
  conversationId?: string;
  noteId?: string;
  documentId?: string;
  topic?: string;
  sourceType?: 'conversation' | 'note' | 'document' | 'custom' | 'flashcards';
  difficulty?: 'easy' | 'medium' | 'hard';
  numQuestions?: number;
  timeLimitSec?: number;
}

export interface SubmitQuizAttemptDTO {
  quizId: string;
  timeTakenSec: number;
  answers: Record<string, { userAnswer: string; isCorrect: boolean; explanation?: string }>;
}

export type StudyPlanType = 'daily' | 'weekly' | 'monthly' | 'exam_prep' | 'custom';
export type StudyPlanStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type StudyTaskType = 'read_note' | 'review_flashcards' | 'take_quiz' | 'revise_topic' | 'practice_coding' | 'custom';
export type StudyTaskStatus = 'pending' | 'completed' | 'skipped' | 'rescheduled';

export interface AiStudyTask {
  id: string;
  planId: string;
  title: string;
  description?: string | null;
  taskType: StudyTaskType;
  status: StudyTaskStatus;
  dueDate: string;
  durationMin: number;
  orderIndex: number;
  completedAt?: string | null;
  createdAt: string;
}

export interface AiStudyPlan {
  id: string;
  userId: string;
  conversationId?: string | null;
  title: string;
  description?: string | null;
  planType: StudyPlanType;
  status: StudyPlanStatus;
  startDate: string;
  endDate: string;
  targetGoal?: string | null;
  tasks?: AiStudyTask[];
  _count?: { tasks: number };
  createdAt: string;
  updatedAt: string;
}

export interface AiStudyGoal {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  targetCategory?: string | null;
  targetValue: number;
  currentValue: number;
  unit: string;
  status: string;
  targetDate: string;
  estimatedFinish?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiStudySession {
  id: string;
  userId: string;
  durationSec: number;
  sessionType: string;
  tasksCompletedCount: number;
  notesUsed: number;
  flashcardsReviewed: number;
  quizzesTaken: number;
  startedAt: string;
  endedAt: string;
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
  heatmap: Record<string, number>;
}

export interface SmartRecommendationItem {
  category: 'revision' | 'weak_topics' | 'upcoming_goals' | 'deadlines' | 'suggested_notes' | 'suggested_quizzes' | 'suggested_flashcards';
  title: string;
  description: string;
  actionPayload?: Record<string, any>;
  priority: 'high' | 'medium' | 'low';
}

export interface GenerateStudyPlanDTO {
  conversationId?: string;
  topic?: string;
  planType?: StudyPlanType;
  targetGoal?: string;
  daysDuration?: number;
  dailyHoursLimit?: number;
}
