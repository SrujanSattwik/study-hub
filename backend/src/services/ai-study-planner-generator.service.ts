import { geminiClient } from '../ai/gemini-client';
import { aiMessageRepository } from '../repositories/ai-message.repository';
import { GenerateStudyPlanDTO } from '../types/ai.types';
import { logger } from '../utils/logger';

export interface GeneratedPlanTaskItem {
  title: string;
  description: string;
  taskType: 'read_note' | 'review_flashcards' | 'take_quiz' | 'revise_topic' | 'practice_coding' | 'custom';
  dayOffset: number;
  durationMin: number;
}

export class AiStudyPlannerGeneratorService {
  /**
   * Generate structured study plan with milestone tasks using Gemini AI JSON output.
   */
  async generateStudyPlan(
    userId: string,
    params: GenerateStudyPlanDTO
  ): Promise<{ title: string; description: string; targetGoal: string; tasks: GeneratedPlanTaskItem[] }> {
    const topic = params.topic || 'General Study Prep';
    const days = params.daysDuration || 7;
    const planType = params.planType || 'weekly';

    logger.info(`[AI PLANNER GENERATOR] Generating ${days}-day ${planType} plan for topic: "${topic}"`);

    let contextText = '';
    if (params.conversationId) {
      try {
        const history = await aiMessageRepository.listByConversation(params.conversationId, { limit: 20 });
        contextText = history.data
          .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
          .join('\n\n');
      } catch (err: any) {
        logger.warn(`[AI PLANNER GENERATOR] Could not retrieve conversation memory: ${err.message}`);
      }
    }

    const systemInstruction = `You are KnowNook AI Study Planner.
Generate a structured ${days}-day study plan in valid JSON format object.
Object format:
{
  "title": "Plan Title",
  "description": "Overview of plan roadmap",
  "targetGoal": "Specific target outcome",
  "tasks": [
    {
      "title": "Task title",
      "description": "Short task guidance",
      "taskType": "read_note" | "review_flashcards" | "take_quiz" | "revise_topic" | "practice_coding",
      "dayOffset": 0, // 0 for Day 1, 1 for Day 2, etc.
      "durationMin": 30
    }
  ]
}

Ensure tasks span over the ${days} days realistically with 2 to 3 tasks per day.
Return ONLY valid JSON, no markdown fences outside the JSON.`;

    const fullPrompt = `Topic Focus: "${topic}"
Plan Type: ${planType} (${days} Days)
Target Goal: "${params.targetGoal || `Master ${topic}`}"
Context Data:
${contextText || 'Rely on topic focus.'}

Generate JSON study plan now.`;

    const response = await geminiClient.generate({
      systemInstruction,
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      estimatedPromptTokens: 0,
    });

    try {
      const cleanedText = response.answer.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedText);
      if (parsed && Array.isArray(parsed.tasks)) {
        return {
          title: parsed.title || `${topic} ${planType.toUpperCase()} Plan`,
          description: parsed.description || `Structured ${days}-day study plan for ${topic}`,
          targetGoal: parsed.targetGoal || params.targetGoal || `Complete ${topic} syllabus`,
          tasks: parsed.tasks.map((t: any, idx: number) => ({
            title: t.title || `Study ${topic} Part ${idx + 1}`,
            description: t.description || 'Follow study guide notes and exercises.',
            taskType: t.taskType || 'revise_topic',
            dayOffset: typeof t.dayOffset === 'number' ? Math.max(0, Math.min(days - 1, t.dayOffset)) : idx % days,
            durationMin: t.durationMin || 30,
          })),
        };
      }
    } catch (err: any) {
      logger.warn(`[AI PLANNER GENERATOR] JSON parse fallback: ${err.message}`);
    }

    // Fallback study plan if JSON parsing fails
    return {
      title: `${topic} Roadmap Plan`,
      description: `Structured study plan for ${topic}`,
      targetGoal: `Master key concepts of ${topic}`,
      tasks: [
        {
          title: `Review Fundamentals of ${topic}`,
          description: 'Read notes and study core definitions.',
          taskType: 'read_note',
          dayOffset: 0,
          durationMin: 30,
        },
        {
          title: `Practice ${topic} Flashcards`,
          description: 'Review flashcard deck for active recall.',
          taskType: 'review_flashcards',
          dayOffset: 0,
          durationMin: 25,
        },
        {
          title: `Take ${topic} Knowledge Check Quiz`,
          description: 'Test retention with an interactive quiz.',
          taskType: 'take_quiz',
          dayOffset: 1,
          durationMin: 30,
        },
      ],
    };
  }
}

export const aiStudyPlannerGeneratorService = new AiStudyPlannerGeneratorService();
export default aiStudyPlannerGeneratorService;
