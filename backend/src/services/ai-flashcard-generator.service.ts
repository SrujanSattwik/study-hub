import { geminiClient } from '../ai/gemini-client';
import { aiMessageRepository } from '../repositories/ai-message.repository';
import { logger } from '../utils/logger';

export interface GeneratedFlashcardItem {
  title: string;
  question: string;
  answer: string;
  formula?: string;
  cardType: string;
  tags?: string;
  aiConfidence: number;
}

export class AiFlashcardGeneratorService {
  /**
   * Generate structured flashcard set using Gemini AI JSON output.
   */
  async generateFlashcards(
    userId: string,
    conversationId?: string,
    topic?: string,
    count: number = 8
  ): Promise<GeneratedFlashcardItem[]> {
    logger.info(`[AI FLASHCARD GENERATOR] Generating ${count} flashcards for user ${userId}`);

    let contextText = '';
    if (conversationId) {
      try {
        const history = await aiMessageRepository.listByConversation(conversationId, { limit: 20 });
        contextText = history.data
          .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
          .join('\n\n');
      } catch (err: any) {
        logger.warn(`[AI FLASHCARD GENERATOR] Could not retrieve conversation memory: ${err.message}`);
      }
    }

    const systemInstruction = `You are KnowNook AI Flashcard Generator.
Generate exactly ${count} high-yield flashcards in valid JSON format array.
Each object must contain:
- "title": concise concept title
- "question": clear question or prompt
- "answer": precise answer
- "formula": Optional LaTeX formula ($...$)
- "cardType": "qa" | "definition" | "formula" | "fill_blank" | "code"
- "tags": comma separated tags
- "aiConfidence": float between 0.85 and 0.98

Return ONLY a JSON array, no markdown fences outside the JSON.`;

    const fullPrompt = `Topic Focus: "${topic || 'General Study Context'}"
Context Data:
${contextText || 'Rely on topic focus.'}

Generate JSON array of ${count} flashcards now.`;

    const response = await geminiClient.generate({
      systemInstruction,
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      estimatedPromptTokens: 0,
    });

    try {
      const cleanedText = response.answer.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedText);
      if (Array.isArray(parsed)) {
        return parsed.map((card: any) => ({
          title: card.title || topic || 'Concept Flashcard',
          question: card.question || 'What is this concept?',
          answer: card.answer || 'Explanation',
          formula: card.formula || undefined,
          cardType: card.cardType || 'qa',
          tags: card.tags || topic || 'study',
          aiConfidence: card.aiConfidence || 0.92,
        }));
      }
    } catch (err: any) {
      logger.warn(`[AI FLASHCARD GENERATOR] JSON parse fallback: ${err.message}`);
    }

    // Fallback card if JSON parsing fails
    return [
      {
        title: topic || 'Key Study Concept',
        question: `Explain the fundamental principles of ${topic || 'the topic'}.`,
        answer: response.answer.slice(0, 300),
        cardType: 'qa',
        tags: topic || 'ai-generated',
        aiConfidence: 0.85,
      },
    ];
  }
}

export const aiFlashcardGeneratorService = new AiFlashcardGeneratorService();
export default aiFlashcardGeneratorService;
