import path from 'path';

export const AI_CONFIG = {
  DEFAULT_MODEL: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 2048,
  
  // Storage & Attachment Limits
  MAX_ATTACHMENT_SIZE_BYTES: 25 * 1024 * 1024, // 25 MB
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

  // Pagination & Limits
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },

  // Conversation Rules
  CONVERSATION: {
    DEFAULT_TITLE: 'New Study Chat',
    MAX_TITLE_LENGTH: 255,
    MAX_MESSAGES_PER_PAGE: 50,
  },
};

export default AI_CONFIG;
