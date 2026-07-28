import { AiEngineRequest, AiEngineResponse, MessageRole } from '../types/ai.types';
import { AiConversationNotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

import { memoryManager } from './memory-manager';
import { PromptBuilder } from './prompt-builder';
import { geminiClient } from './gemini-client';
import { responseProcessor } from './response-processor';
import { summarizationService } from './summarization.service';
import { MEMORY_CONFIG } from '../config/ai.config';

import { aiConversationRepository } from '../repositories/ai-conversation.repository';
import { aiMessageRepository } from '../repositories/ai-message.repository';
import { aiAttachmentRepository } from '../repositories/ai-attachment.repository';
import { aiFlashcardRepository } from '../repositories/ai-flashcard.repository';
import { aiUsageRepository } from '../repositories/ai-usage.repository';

/**
 * ConversationEngine — the central AI orchestrator for Phase 3.
 *
 * Pipeline for each request:
 *   1. Load conversation + assets from DB (ownership enforced)
 *   2. Build MemoryPackage (sliding window + documents + flashcards)
 *   3. Assemble structured prompt via PromptBuilder
 *   4. Send to GeminiClient (with retry engine)
 *   5. Process response via ResponseProcessor (safety + metadata)
 *   6. Persist user & AI messages to DB
 *   7. Record token usage in AiUsage table
 *   8. Trigger async summarization if conversation is large
 *   9. Return structured AiEngineResponse
 */
export class ConversationEngine {
  async respond(request: AiEngineRequest): Promise<AiEngineResponse> {
    const startTime = Date.now();
    const { userId, conversationId, userMessage } = request;

    logger.info(`🧠 [ENGINE] Starting response for conversation ${conversationId} | user ${userId}`);

    // ── Step 1: Verify conversation ownership ──────────────────────────────
    const conversation = await aiConversationRepository.findFullById(conversationId, userId);
    if (!conversation) {
      throw new AiConversationNotFoundError();
    }

    // ── Step 2: Load flashcards (user-scoped) ──────────────────────────────
    const [attachments, flashcardsResult] = await Promise.all([
      aiAttachmentRepository.listByConversation(conversationId),
      aiFlashcardRepository.listByUser(userId, {}),
    ]);

    const messages = (conversation as any).messages || [];

    // ── Step 3: Build MemoryPackage ──────────────────────────────────────────
    const memory = memoryManager.package(
      userMessage,
      conversation.summary,
      messages,
      attachments,
      flashcardsResult.data
    );

    logger.info(
      `🧠 [ENGINE] Memory | msgs=${memory.recentMessages.length} docs=${memory.documents.length} cards=${memory.flashcards.length} est_tokens=${memory.totalEstimatedTokens}`
    );

    // ── Step 4: Build Prompt ─────────────────────────────────────────────────
    const prompt = new PromptBuilder()
      .withSummary(memory.conversationSummary)
      .withDocuments(memory.documents)
      .withFlashcards(memory.flashcards)
      .withHistory(memory.recentMessages)
      .withUserMessage(userMessage)
      .build();

    logger.info(`🧠 [ENGINE] Prompt | est_tokens=${prompt.estimatedPromptTokens} turns=${prompt.contents.length}`);

    // ── Step 5: Call Gemini ──────────────────────────────────────────────────
    const geminiResponse = await geminiClient.generate(prompt);
    const generationTimeMs = Date.now() - startTime;

    // ── Step 6: Post-process ─────────────────────────────────────────────────
    const processed = responseProcessor.process(geminiResponse.answer);

    // ── Step 7: Persist user message ─────────────────────────────────────────
    const userMsg = await aiMessageRepository.create({
      conversationId,
      role: MessageRole.user,
      content: userMessage,
      tokenCount: prompt.estimatedPromptTokens,
      model: geminiResponse.model,
    });

    // ── Step 8: Persist assistant message ────────────────────────────────────
    const assistantMsg = await aiMessageRepository.create({
      conversationId,
      role: MessageRole.assistant,
      content: processed.sanitized,
      tokenCount: geminiResponse.completionTokens,
      finishReason: geminiResponse.finishReason,
      generationTime: generationTimeMs,
      model: geminiResponse.model,
      metadata: {
        hasCodeBlocks: processed.hasCodeBlocks,
        hasMathExpressions: processed.hasMathExpressions,
        hasTables: processed.hasTables,
        estimatedReadingTimeSeconds: processed.estimatedReadingTimeSeconds,
      },
    });

    // ── Step 9: Increment conversation stats ──────────────────────────────────
    await aiConversationRepository.incrementStats(conversationId, 2, geminiResponse.totalTokens);

    // ── Step 10: Record usage ─────────────────────────────────────────────────
    await aiUsageRepository.recordUsage(
      userId,
      geminiResponse.promptTokens,
      geminiResponse.completionTokens
    );

    // ── Step 11: Async summarization if needed ────────────────────────────────
    const updatedMessageCount = (conversation.totalMessages || 0) + 2;
    if (memoryManager.needsSummarization(updatedMessageCount) && !conversation.summary) {
      const allMessages = [
        ...memory.recentMessages,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: processed.sanitized },
      ];
      const summarizationPrompt = summarizationService.buildSummarizationPrompt(allMessages);

      geminiClient
        .generate(new PromptBuilder().withUserMessage(summarizationPrompt).build())
        .then((summaryResp) =>
          summarizationService.persistSummary(conversationId, userId, summaryResp.answer)
        )
        .catch((err) => logger.error(`[ENGINE] Async summarization failed: ${err.message}`));
    }

    logger.info(
      `✅ [ENGINE] Done | conv=${conversationId} | prompt=${geminiResponse.promptTokens} completion=${geminiResponse.completionTokens} total=${geminiResponse.totalTokens} | ${generationTimeMs}ms`
    );

    return {
      answer: processed.sanitized,
      conversationId,
      userMessageId: userMsg.id,
      assistantMessageId: assistantMsg.id,
      promptTokens: geminiResponse.promptTokens,
      completionTokens: geminiResponse.completionTokens,
      totalTokens: geminiResponse.totalTokens,
      generationTimeMs,
      model: geminiResponse.model,
      finishReason: geminiResponse.finishReason,
    };
  }
}

export const conversationEngine = new ConversationEngine();
