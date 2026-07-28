import express from 'express';
import { aiController } from '../controllers/ai.controller';
import { aiConversationController } from '../controllers/ai-conversation.controller';
import { aiMessageController } from '../controllers/ai-message.controller';
import { aiAttachmentController } from '../controllers/ai-attachment.controller';
import { aiFlashcardController } from '../controllers/ai-flashcard.controller';
import { aiUsageController } from '../controllers/ai-usage.controller';
import { aiEngineController } from '../controllers/ai-engine.controller';
import { aiStreamController } from '../controllers/ai-stream.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// Require JWT authentication for all AI endpoints
router.use(authenticateToken);

// ── Legacy Endpoint (backward compat — stateless, no memory) ────────────────
router.post('/ask', aiController.ask);

// ── Phase 3: Conversation-Aware AI Engine ────────────────────────────────────
// POST /api/ai/conversations/:conversationId/ask
// Uses memory, context, and full multi-turn history

// ── Conversations ─────────────────────────────────────────────────────────────
router.post('/conversations', aiConversationController.createConversation);
router.get('/conversations', aiConversationController.listConversations);
router.get('/conversations/:conversationId', aiConversationController.getConversation);
router.patch('/conversations/:conversationId', aiConversationController.updateConversation);
router.patch('/conversations/:conversationId/pin', aiConversationController.pinConversation);
router.patch('/conversations/:conversationId/archive', aiConversationController.archiveConversation);
router.patch('/conversations/:conversationId/restore', aiConversationController.restoreConversation);
router.delete('/conversations/:conversationId', aiConversationController.deleteConversation);

// ── Phase 3: AI Engine — Conversation-Aware Multi-Turn Ask ───────────────────
router.post('/conversations/:conversationId/ask', aiEngineController.ask);

// ── Phase 4: SSE Streaming — Real-Time Token Streaming ───────────────────────
// POST  /api/ai/conversations/:conversationId/stream
// Response: text/event-stream (SSE)
// Events:  conversation_started | metadata | thinking | token | completed | aborted | error | done
router.post('/conversations/:conversationId/stream', aiStreamController.stream);


// ── Messages ──────────────────────────────────────────────────────────────────
router.post('/conversations/:conversationId/messages', aiMessageController.createMessage);
router.get('/conversations/:conversationId/messages', aiMessageController.listMessages);
router.patch('/messages/:messageId', aiMessageController.updateMessage);
router.delete('/messages/:messageId', aiMessageController.deleteMessage);

// ── Attachments ───────────────────────────────────────────────────────────────
router.post('/conversations/:conversationId/attachments', aiAttachmentController.registerAttachment);
router.get('/conversations/:conversationId/attachments', aiAttachmentController.listAttachments);
router.patch('/attachments/:attachmentId/status', aiAttachmentController.updateStatus);
router.delete('/attachments/:attachmentId', aiAttachmentController.deleteAttachment);

// ── Flashcards ────────────────────────────────────────────────────────────────
router.post('/flashcards', aiFlashcardController.createFlashcard);
router.get('/flashcards', aiFlashcardController.listFlashcards);
router.get('/flashcards/:flashcardId', aiFlashcardController.getFlashcard);
router.patch('/flashcards/:flashcardId', aiFlashcardController.updateFlashcard);
router.patch('/flashcards/:flashcardId/favorite', aiFlashcardController.toggleFavorite);
router.delete('/flashcards/:flashcardId', aiFlashcardController.deleteFlashcard);

// ── Usage Metrics ─────────────────────────────────────────────────────────────
router.get('/usage', aiUsageController.getUsageStats);

export default router;
