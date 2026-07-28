import { TOKEN_BUDGET } from '../config/ai.config';

/**
 * TokenCounter — estimates token usage for text content.
 * Uses a character-based approximation (1 token ≈ 4 chars) consistent
 * with Gemini's tokenization for English + code content.
 */
export class TokenCounter {
  static estimate(text: string): number {
    return Math.ceil(text.length / TOKEN_BUDGET.CHARS_PER_TOKEN);
  }

  static estimateMessages(messages: Array<{ content: string }>): number {
    return messages.reduce((sum, m) => sum + TokenCounter.estimate(m.content), 0);
  }

  static estimatePromptSection(label: string, content: string): number {
    return TokenCounter.estimate(`${label}\n${content}`);
  }

  static withinBudget(estimatedTokens: number, budgetTokens: number): boolean {
    return estimatedTokens <= budgetTokens;
  }

  static truncateToTokens(text: string, maxTokens: number): string {
    const maxChars = maxTokens * TOKEN_BUDGET.CHARS_PER_TOKEN;
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars) + '\n[... content truncated to fit context window ...]';
  }
}
