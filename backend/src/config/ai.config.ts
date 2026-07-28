import path from 'path';

// ─── Model Provider Config ──────────────────────────────────────────────────
export interface ModelConfig {
  model: string;
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
  timeoutMs: number;
  apiKeyEnvVar: string;
  baseUrl: string;
}

export const GEMINI_MODEL_CONFIG: ModelConfig = {
  model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  topP: parseFloat(process.env.AI_TOP_P || '0.95'),
  topK: parseInt(process.env.AI_TOP_K || '40', 10),
  maxOutputTokens: parseInt(process.env.AI_MAX_OUTPUT_TOKENS || '2048', 10),
  timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || '30000', 10),
  apiKeyEnvVar: 'GEMINI_API_KEY',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
};

// ─── Safety Settings ────────────────────────────────────────────────────────
export const GEMINI_SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
];

// ─── Token Budget ────────────────────────────────────────────────────────────
export const TOKEN_BUDGET = {
  CHARS_PER_TOKEN: 4,
  MAX_CONTEXT_TOKENS: 30_000,
  SYSTEM_PROMPT_RESERVE: 2_000,
  HISTORY_BUDGET_TOKENS: 8_000,
  DOCUMENT_BUDGET_TOKENS: 6_000,
  FLASHCARD_BUDGET_TOKENS: 2_000,
  CURRENT_MESSAGE_RESERVE: 500,
  COMPLETION_RESERVE: 2_048,
};

// ─── Memory & Context Strategy ───────────────────────────────────────────────
export const MEMORY_CONFIG = {
  SLIDING_WINDOW_MESSAGES: 15,
  SUMMARIZE_AFTER_MESSAGES: 30,
  SUMMARY_COMPRESSION_RATIO: 0.3,
  MAX_DOCUMENT_CHARS: 24_000,
  MAX_FLASHCARDS_INJECTED: 10,
  RELEVANCE_SCORE_THRESHOLD: 0.3,
};

// ─── Retry Engine ───────────────────────────────────────────────────────────
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY_MS: 1_000,
  MAX_DELAY_MS: 8_000,
  BACKOFF_MULTIPLIER: 2,
  RETRYABLE_STATUS_CODES: [429, 500, 502, 503, 504],
};

// ─── SSE Streaming Config ────────────────────────────────────────────────────
export const SSE_CONFIG = {
  HEARTBEAT_INTERVAL_MS: parseInt(process.env.SSE_HEARTBEAT_MS || '20000', 10),
  STREAM_TIMEOUT_MS: parseInt(process.env.SSE_STREAM_TIMEOUT_MS || '120000', 10),
  IDLE_TIMEOUT_MS: parseInt(process.env.SSE_IDLE_TIMEOUT_MS || '60000', 10),
  MAX_RETRY_DELAY_MS: 5_000,        // SSE client reconnect hint
  FLUSH_EVERY_N_CHUNKS: 1,          // flush SSE immediately on each chunk (lowest latency)
};


// ─── General AI_CONFIG (backward compat) ───────────────────────────────────
export const AI_CONFIG = {
  DEFAULT_MODEL: GEMINI_MODEL_CONFIG.model,
  DEFAULT_TEMPERATURE: GEMINI_MODEL_CONFIG.temperature,
  DEFAULT_MAX_TOKENS: GEMINI_MODEL_CONFIG.maxOutputTokens,

  MAX_ATTACHMENT_SIZE_BYTES: 25 * 1024 * 1024,
  ALLOWED_EXTENSIONS: ['.pdf', '.docx', '.doc', '.ppt', '.pptx', '.txt', '.png', '.jpg', '.jpeg', '.mp4', '.mp3'],
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/png',
    'image/jpeg',
    'video/mp4',
    'audio/mpeg',
  ],
  UPLOADS_AI_DIR: path.join(__dirname, '../../../uploads/ai'),

  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },

  CONVERSATION: {
    DEFAULT_TITLE: 'New Study Chat',
    MAX_TITLE_LENGTH: 255,
    MAX_MESSAGES_PER_PAGE: 50,
  },
};

export default AI_CONFIG;
