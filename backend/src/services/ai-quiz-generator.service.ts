import { geminiClient } from '../ai/gemini-client';
import { aiMessageRepository } from '../repositories/ai-message.repository';
import { GenerateQuizDTO } from '../types/ai.types';
import { logger } from '../utils/logger';

export interface GeneratedQuestionItem {
  questionText: string;
  questionType: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  codeSnippet?: string;
  aiConfidence: number;
  orderIndex: number;
}

export class AiQuizGeneratorService {
  /**
   * Generate an interactive quiz question set using Gemini AI JSON output.
   */
  async generateQuiz(
    userId: string,
    params: GenerateQuizDTO
  ): Promise<{ title: string; description: string; questions: GeneratedQuestionItem[] }> {
    const numQuestions = params.numQuestions || 5;
    const difficulty = params.difficulty || 'medium';
    const topic = params.topic || 'Knowledge Check';

    logger.info(`[AI QUIZ GENERATOR] Generating ${numQuestions} (${difficulty}) questions for user ${userId}`);

    let contextText = '';
    if (params.conversationId) {
      try {
        const history = await aiMessageRepository.listByConversation(params.conversationId, { limit: 20 });
        contextText = history.data
          .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
          .join('\n\n');
      } catch (err: any) {
        logger.warn(`[AI QUIZ GENERATOR] Could not retrieve conversation memory: ${err.message}`);
      }
    }

    const systemInstruction = `You are KnowNook AI Quiz Generator.
Generate an interactive quiz with exactly ${numQuestions} questions at ${difficulty.toUpperCase()} difficulty in valid JSON format object.
Object format:
{
  "title": "Quiz Title",
  "description": "Short description of what this quiz tests",
  "questions": [
    {
      "questionText": "Question prompt",
      "questionType": "mcq" | "true_false" | "short_answer",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Detailed explanation why Option A is correct",
      "codeSnippet": null,
      "aiConfidence": 0.94
    }
  ]
}

Ensure "options" is a 4-item string array for "mcq", or ["True", "False"] for "true_false".
Return ONLY valid JSON, no markdown fences outside the JSON.`;

    const fullPrompt = `Topic Focus: "${topic}"
Context Data:
${contextText || 'Rely on topic focus.'}

Generate JSON quiz now.`;

    const response = await geminiClient.generate({
      systemInstruction,
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      estimatedPromptTokens: 0,
    });

    try {
      const cleanedText = response.answer.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedText);
      if (parsed && Array.isArray(parsed.questions)) {
        return {
          title: parsed.title || `${topic} Quiz`,
          description: parsed.description || `Interactive ${difficulty} quiz on ${topic}`,
          questions: parsed.questions.map((q: any, idx: number) => ({
            questionText: q.questionText || `Question ${idx + 1}`,
            questionType: q.questionType || 'mcq',
            options: Array.isArray(q.options) ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: q.correctAnswer || (Array.isArray(q.options) ? q.options[0] : 'True'),
            explanation: q.explanation || 'Refer to study notes.',
            codeSnippet: q.codeSnippet || undefined,
            aiConfidence: q.aiConfidence || 0.92,
            orderIndex: idx + 1,
          })),
        };
      }
    } catch (err: any) {
      logger.warn(`[AI QUIZ GENERATOR] JSON parse fallback: ${err.message}`);
    }

    // Fallback quiz if JSON parsing fails
    return {
      title: `${topic} Practice Quiz`,
      description: `Assessment test for ${topic}`,
      questions: [
        {
          questionText: `What is the main objective of ${topic}?`,
          questionType: 'mcq',
          options: [
            `Understanding core concepts of ${topic}`,
            'Ignoring architectural design',
            'Skipping tests',
            'None of the above',
          ],
          correctAnswer: `Understanding core concepts of ${topic}`,
          explanation: `Core principles of ${topic} require understanding fundamentals.`,
          aiConfidence: 0.9,
          orderIndex: 1,
        },
      ],
    };
  }
}

export const aiQuizGeneratorService = new AiQuizGeneratorService();
export default aiQuizGeneratorService;
