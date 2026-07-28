import { Response } from 'express';
import {
  StreamEngineRequest,
  MessageRole,
  SseCompletedPayload,
  SseMetadataPayload,
} from '../types/ai.types';
import { AiConversationNotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

import { memoryManager } from './memory-manager';
import { PromptBuilder } from './prompt-builder';
import { geminiClient } from './gemini-client';
import { responseProcessor } from './response-processor';
import { summarizationService } from './summarization.service';
import { SseEmitter } from './sse-emitter';

import { aiConversationRepository } from '../repositories/ai-conversation.repository';
import { aiMessageRepository } from '../repositories/ai-message.repository';
import { aiAttachmentRepository } from '../repositories/ai-attachment.repository';
import { aiFlashcardRepository } from '../repositories/ai-flashcard.repository';
import { aiUsageRepository } from '../repositories/ai-usage.repository';

/**
 * StreamingConversationEngine — SSE streaming counterpart to ConversationEngine.
 *
 * Reuses the SAME:
 *   - MemoryManager  (context loading)
 *   - PromptBuilder  (prompt construction)
 *   - ResponseProcessor (safety + metadata)
 *   - All repositories (persistence)
 *   - SummarizationService (async summarization)
 *
 * Only adds:
 *   - GeminiClient.generateStream() instead of generate()
 *   - SseEmitter for token-by-token event emission
 *   - AbortController for cancellation / disconnect detection
 *   - In-memory buffer — persist ONCE after stream completes
 *
 * Pipeline:
 *   1. Verify ownership
 *   2. Load assets (parallel)
 *   3. Build MemoryPackage
 *   4. Build Prompt
 *   5. Emit `conversation_started` + `metadata` events
 *   6. Open Gemini streaming generator
 *   7. Emit `token` events for every chunk
 *   8. On completion: emit `completed` + `done`
 *   9. Persist user + assistant messages (single write)
 *   10. Record usage, update stats, trigger summarization
 *   On abort: emit `aborted` + cleanup
 *   On error: emit `error` + cleanup
 */
export class StreamingConversationEngine {
  async stream(req: StreamEngineRequest, res: Response): Promise<void> {
    const startTime = Date.now();
    const { userId, conversationId, userMessage } = req;

    const abortController = new AbortController();
    const emitter = new SseEmitter(res);
    emitter.initialize(conversationId);
    emitter.setRetryDelay();

    // ── Detect client disconnect ──────────────────────────────────────────────
    res.on('close', () => {
      if (!abortController.signal.aborted) {
        abortController.abort();
        logger.info(`🔌 [STREAM] Client disconnected from conversation ${conversationId}`);
      }
    });

    logger.info(`📡 [STREAM] Started for conversation ${conversationId} | user ${userId}`);

    try {
      // ── Step 1: Verify ownership ──────────────────────────────────────────
      const conversation = await aiConversationRepository.findFullById(conversationId, userId);
      if (!conversation) {
        emitter.emit({ event: 'error', data: { code: 'NOT_FOUND', message: 'Conversation not found or access denied' } });
        emitter.close();
        throw new AiConversationNotFoundError();
      }

      // ── Step 2: Load related assets ──────────────────────────────────────
      const [attachments, flashcardsResult] = await Promise.all([
        aiAttachmentRepository.listByConversation(conversationId),
        aiFlashcardRepository.listByUser(userId, {}),
      ]);
      const messages = (conversation as any).messages || [];

      // ── Step 3: Build MemoryPackage ──────────────────────────────────────
      const memory = memoryManager.package(
        userMessage,
        conversation.summary,
        messages,
        attachments,
        flashcardsResult.data
      );

      // ── Step 4: Build Prompt ─────────────────────────────────────────────
      const prompt = new PromptBuilder()
        .withSummary(memory.conversationSummary)
        .withDocuments(memory.documents)
        .withFlashcards(memory.flashcards)
        .withHistory(memory.recentMessages)
        .withUserMessage(userMessage)
        .build();

      // ── Step 5: Emit conversation start events ───────────────────────────
      emitter.emit({ event: 'conversation_started', data: { conversationId } });
      emitter.emit({
        event: 'metadata',
        data: {
          conversationId,
          model: geminiClient['model'],
          estimatedPromptTokens: prompt.estimatedPromptTokens,
        } as SseMetadataPayload,
      });
      emitter.emit({ event: 'thinking', data: { status: 'Generating response...' } });

      // ── Step 6: Stream from Gemini ───────────────────────────────────────
      const tokenBuffer: string[] = [];
      let tokenIndex = 0;

      const streamGen = geminiClient.generateStream(prompt, abortController);

      for await (const chunk of streamGen) {
        // Check abort before emitting
        if (abortController.signal.aborted || emitter.isClosed) break;

        tokenBuffer.push(chunk);
        emitter.emit({
          event: 'token',
          data: { text: chunk, index: tokenIndex++ },
        });
      }

      // ── Step 7: Check abort ──────────────────────────────────────────────
      if (abortController.signal.aborted) {
        emitter.emit({ event: 'aborted', data: { conversationId, reason: 'client_disconnect' } });
        logger.info(`🛑 [STREAM] Aborted for conversation ${conversationId}`);
        emitter.close();
        return;
      }

      // ── Step 8: Assemble and process full response ───────────────────────
      const rawAnswer = tokenBuffer.join('');
      const processed = responseProcessor.process(rawAnswer);
      const generationTimeMs = Date.now() - startTime;

      // ── Step 9: Persist user message (single write) ──────────────────────
      const userMsg = await aiMessageRepository.create({
        conversationId,
        role: MessageRole.user,
        content: userMessage,
        tokenCount: prompt.estimatedPromptTokens,
        model: geminiClient['model'],
      });

      // ── Step 10: Persist assistant message (single write) ────────────────
      const assistantMsg = await aiMessageRepository.create({
        conversationId,
        role: MessageRole.assistant,
        content: processed.sanitized,
        tokenCount: tokenBuffer.length, // rough estimate; SSE stream doesn't return usageMetadata
        finishReason: 'STOP',
        generationTime: generationTimeMs,
        model: geminiClient['model'],
        metadata: {
          hasCodeBlocks: processed.hasCodeBlocks,
          hasMathExpressions: processed.hasMathExpressions,
          hasTables: processed.hasTables,
          streamed: true,
        },
      });

      // ── Step 11: Update stats + usage ────────────────────────────────────
      await aiConversationRepository.incrementStats(conversationId, 2, tokenBuffer.length);
      await aiUsageRepository.recordUsage(userId, prompt.estimatedPromptTokens, tokenBuffer.length);

      // ── Step 12: Emit completed event ────────────────────────────────────
      const completedPayload: SseCompletedPayload = {
        userMessageId: userMsg.id,
        assistantMessageId: assistantMsg.id,
        answer: processed.sanitized,
        promptTokens: prompt.estimatedPromptTokens,
        completionTokens: tokenBuffer.length,
        totalTokens: prompt.estimatedPromptTokens + tokenBuffer.length,
        generationTimeMs,
        model: geminiClient['model'],
        finishReason: 'STOP',
      };
      emitter.emit({ event: 'completed', data: completedPayload });
      emitter.emit({ event: 'done', data: { conversationId } });

      logger.info(
        `✅ [STREAM] Done | conv=${conversationId} | chunks=${tokenIndex} | time=${generationTimeMs}ms`
      );

      // ── Step 13: Async summarization ─────────────────────────────────────
      const updatedMessageCount = (conversation.totalMessages || 0) + 2;
      if (memoryManager.needsSummarization(updatedMessageCount) && !conversation.summary) {
        const allMessages = [
          ...memory.recentMessages,
          { role: 'user', content: userMessage },
          { role: 'assistant', content: processed.sanitized },
        ];
        geminiClient
          .generate(new PromptBuilder().withUserMessage(summarizationService.buildSummarizationPrompt(allMessages)).build())
          .then((r) => summarizationService.persistSummary(conversationId, userId, r.answer))
          .catch((err) => logger.error(`[STREAM] Summarization failed: ${err.message}`));
      }
    } catch (err: any) {
      const isAbort = err?.name === 'AbortError' || abortController.signal.aborted;
      if (isAbort) {
        emitter.emit({ event: 'aborted', data: { conversationId, reason: 'client_disconnect' } });
        logger.info(`🛑 [STREAM] Connection aborted for ${conversationId}`);
      } else {
        logger.error(`❌ [STREAM] Error for ${conversationId}: ${err.message}`);
        emitter.emit({ event: 'error', data: { code: 'STREAM_ERROR', message: err.message || 'Streaming failed' } });
      }
    } finally {
      emitter.close();
    }
  }
}

export const streamingConversationEngine = new StreamingConversationEngine();
