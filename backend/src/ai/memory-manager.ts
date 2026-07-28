import { AiMessage, AiAttachment, AiFlashcard } from '@prisma/client';
import { MEMORY_CONFIG, TOKEN_BUDGET } from '../config/ai.config';
import { TokenCounter } from './token-counter';
import { MemoryPackage, ContextDocument, ContextFlashcard } from '../types/ai.types';

/**
 * MemoryManager — loads, scores, and packages conversation history into a
 * structured MemoryPackage that the PromptBuilder can consume directly.
 *
 * Strategy:
 *   1. Always include the last N sliding-window messages.
 *   2. Include conversation summary (from DB) if available.
 *   3. Score attached documents by simple keyword relevance against the user query.
 *   4. Score flashcards by keyword relevance, inject top K.
 *   5. Enforce token budgets at every stage.
 */
export class MemoryManager {
  package(
    userQuery: string,
    conversationSummary: string | null,
    messages: AiMessage[],
    attachments: AiAttachment[],
    flashcards: AiFlashcard[]
  ): MemoryPackage {
    // 1. Sliding window — take last N messages
    const windowMessages = messages.slice(-MEMORY_CONFIG.SLIDING_WINDOW_MESSAGES);

    // 2. Enforce history token budget
    let historyTokensUsed = 0;
    const budgetedMessages: Array<{ role: string; content: string }> = [];

    for (const msg of windowMessages) {
      const msgTokens = TokenCounter.estimate(msg.content);
      if (historyTokensUsed + msgTokens > TOKEN_BUDGET.HISTORY_BUDGET_TOKENS) break;
      budgetedMessages.push({ role: msg.role, content: msg.content });
      historyTokensUsed += msgTokens;
    }

    // 3. Score and select documents
    const scoredDocs = this.scoreDocuments(userQuery, attachments);
    const selectedDocs = this.applyDocumentBudget(scoredDocs);

    // 4. Score and select flashcards
    const scoredFlashcards = this.scoreFlashcards(userQuery, flashcards);
    const selectedFlashcards = scoredFlashcards.slice(0, MEMORY_CONFIG.MAX_FLASHCARDS_INJECTED);

    const summaryTokens = conversationSummary ? TokenCounter.estimate(conversationSummary) : 0;
    const docTokens = selectedDocs.reduce((s, d) => s + TokenCounter.estimate(d.extractedText), 0);
    const flashTokens = selectedFlashcards.reduce(
      (s, f) => s + TokenCounter.estimate(`${f.question} ${f.answer}`),
      0
    );

    return {
      conversationSummary,
      recentMessages: budgetedMessages,
      documents: selectedDocs,
      flashcards: selectedFlashcards,
      totalEstimatedTokens: historyTokensUsed + summaryTokens + docTokens + flashTokens,
    };
  }

  needsSummarization(messageCount: number): boolean {
    return messageCount >= MEMORY_CONFIG.SUMMARIZE_AFTER_MESSAGES;
  }

  private scoreDocuments(query: string, attachments: AiAttachment[]): ContextDocument[] {
    const queryTokens = this.tokenize(query);

    return attachments
      .filter((a) => a.extractedText || a.ocrText)
      .map((a) => {
        const text = (a.extractedText || a.ocrText || '').slice(0, MEMORY_CONFIG.MAX_DOCUMENT_CHARS);
        const score = this.keywordScore(queryTokens, text);
        return { name: a.originalName, extractedText: text, relevanceScore: score };
      })
      .filter((d) => d.relevanceScore >= MEMORY_CONFIG.RELEVANCE_SCORE_THRESHOLD)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private applyDocumentBudget(docs: ContextDocument[]): ContextDocument[] {
    let budget = TOKEN_BUDGET.DOCUMENT_BUDGET_TOKENS;
    const result: ContextDocument[] = [];

    for (const doc of docs) {
      const tokens = TokenCounter.estimate(doc.extractedText);
      if (tokens > budget) {
        result.push({ ...doc, extractedText: TokenCounter.truncateToTokens(doc.extractedText, budget) });
        break;
      }
      result.push(doc);
      budget -= tokens;
    }

    return result;
  }

  private scoreFlashcards(query: string, flashcards: AiFlashcard[]): ContextFlashcard[] {
    const queryTokens = this.tokenize(query);

    return flashcards
      .map((f) => {
        const combined = `${f.title} ${f.question} ${f.answer} ${f.formula || ''} ${f.tags || ''}`;
        const score = this.keywordScore(queryTokens, combined);
        return {
          title: f.title,
          question: f.question,
          answer: f.answer,
          formula: f.formula || undefined,
          relevanceScore: score,
        };
      })
      .filter((f) => f.relevanceScore >= MEMORY_CONFIG.RELEVANCE_SCORE_THRESHOLD)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter((t) => t.length > 2);
  }

  private keywordScore(queryTokens: string[], text: string): number {
    if (!queryTokens.length || !text.trim()) return 0;
    const lowerText = text.toLowerCase();
    return queryTokens.filter((t) => lowerText.includes(t)).length / queryTokens.length;
  }
}

export const memoryManager = new MemoryManager();
