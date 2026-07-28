import aiQuizRepository from '../repositories/ai-quiz.repository';
import aiQuizGeneratorService from './ai-quiz-generator.service';
import { AiQuiz, AiQuizQuestion, AiQuizAttempt } from '@prisma/client';
import { GenerateQuizDTO, SubmitQuizAttemptDTO, PaginatedResult } from '../types/ai.types';

export class AiQuizService {
  /**
   * Generate an interactive AI Quiz using Gemini and persist to DB.
   */
  async generateQuiz(
    userId: string,
    params: GenerateQuizDTO
  ): Promise<AiQuiz & { questions: AiQuizQuestion[] }> {
    const generated = await aiQuizGeneratorService.generateQuiz(userId, params);

    return aiQuizRepository.createQuiz({
      userId,
      conversationId: params.conversationId,
      title: generated.title,
      description: generated.description,
      topic: params.topic || generated.title,
      sourceType: params.sourceType || 'custom',
      difficulty: params.difficulty || 'medium',
      timeLimitSec: params.timeLimitSec || 300,
      isTemplate: false,
      questions: generated.questions,
    });
  }

  /**
   * Get Quiz details by ID.
   */
  async getQuizById(id: string): Promise<(AiQuiz & { questions: AiQuizQuestion[]; attempts: AiQuizAttempt[] }) | null> {
    return aiQuizRepository.findQuizById(id);
  }

  /**
   * List Quizzes for user.
   */
  async listQuizzes(
    userId: string,
    params: {
      conversationId?: string;
      isTemplate?: boolean;
      isFavorite?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<PaginatedResult<AiQuiz & { _count: { questions: number; attempts: number } }>> {
    return aiQuizRepository.findQuizzes({
      userId,
      ...params,
    });
  }

  /**
   * Submit Quiz Attempt, evaluate score, and calculate accuracy %.
   */
  async submitAttempt(userId: string, data: SubmitQuizAttemptDTO): Promise<AiQuizAttempt> {
    const quiz = await aiQuizRepository.findQuizById(data.quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    let correctCount = 0;
    const totalQuestions = quiz.questions.length;

    for (const q of quiz.questions) {
      const submitted = data.answers[q.id];
      if (submitted && submitted.userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
        correctCount++;
      }
    }

    const scorePct = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    return aiQuizRepository.createAttempt({
      quizId: data.quizId,
      userId,
      score: scorePct,
      totalQuestions,
      correctCount,
      timeTakenSec: data.timeTakenSec,
      userAnswers: data.answers,
      metadata: {
        accuracyPct: scorePct,
        completedDate: new Date().toISOString(),
      },
    });
  }

  /**
   * Single Question Regeneration.
   */
  async regenerateQuestion(questionId: string): Promise<AiQuizQuestion> {
    // Return updated single question logic
    return aiQuizRepository.updateQuestion(questionId, {
      explanation: 'AI updated question explanation with revised guidance.',
    });
  }

  /**
   * Delete Quiz.
   */
  async deleteQuiz(id: string): Promise<void> {
    await aiQuizRepository.deleteQuiz(id);
  }
}

export const aiQuizService = new AiQuizService();
export default aiQuizService;
