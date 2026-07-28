import { aiConversationRepository } from '../repositories/ai-conversation.repository';
import { logger } from '../utils/logger';

export class SummarizationService {
  buildSummarizationPrompt(messages: Array<{ role: string; content: string }>): string {
    const history = messages
      .map((m) => `${m.role === 'user' ? 'Student' : 'KnowNook'}: ${m.content}`)
      .join('\n\n');

    return [
      'Create a concise bullet-point summary of this tutoring conversation.',
      'Focus on: topics covered, concepts explained, key insights, problems solved.',
      'Keep the summary under 300 words. Write in third person.',
      'This summary will be used as context for future conversation turns.',
      '',
      '--- CONVERSATION ---',
      history,
      '--- END CONVERSATION ---',
      '',
      'Summary:',
    ].join('\n');
  }

  async persistSummary(conversationId: string, userId: string, summary: string): Promise<void> {
    try {
      await aiConversationRepository.update(conversationId, userId, { summary });
      logger.info(`📝 [SUMMARIZATION] Persisted summary for conversation ${conversationId}`);
    } catch (err: any) {
      logger.error(`[SUMMARIZATION] Failed to persist summary for ${conversationId}: ${err.message}`);
    }
  }
}

export const summarizationService = new SummarizationService();
