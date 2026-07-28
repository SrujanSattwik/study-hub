import { useState, useEffect, useCallback } from 'react';
import quizService from '../services/quiz.service';
import { AiQuiz, GenerateQuizDTO, AiQuizAttempt } from '../types/ai.types';

export function useKnownookQuizzes(conversationId?: string) {
  const [quizzes, setQuizzes] = useState<AiQuiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<AiQuiz | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<AiQuizAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load user quizzes
  const loadQuizzes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await quizService.listQuizzes();
      setQuizzes(data);
      if (data.length > 0 && !activeQuiz) {
        // Load details for first quiz
        const fullDetails = await quizService.getQuizDetails(data[0].id);
        setActiveQuiz(fullDetails);
      }
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeQuiz]);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  // Actions
  const selectQuiz = async (quiz: AiQuiz) => {
    try {
      const fullDetails = await quizService.getQuizDetails(quiz.id);
      setActiveQuiz(fullDetails);
      setActiveAttempt(null);
    } catch (err) {
      console.error('Failed to load quiz details:', err);
    }
  };

  const generateQuiz = async (dto: GenerateQuizDTO): Promise<AiQuiz | null> => {
    setIsGenerating(true);
    try {
      const created = await quizService.generateQuiz({
        ...dto,
        conversationId: dto.conversationId || conversationId,
      });
      setQuizzes((prev) => [created, ...prev]);
      setActiveQuiz(created);
      setActiveAttempt(null);
      return created;
    } catch (err) {
      console.error('Quiz generation failed:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const submitAttempt = async (
    quizId: string,
    timeTakenSec: number,
    answers: Record<string, { userAnswer: string; isCorrect: boolean; explanation?: string }>
  ) => {
    try {
      const attempt = await quizService.submitAttempt(quizId, {
        quizId,
        timeTakenSec,
        answers,
      });
      setActiveAttempt(attempt);
      return attempt;
    } catch (err) {
      console.error('Submit attempt failed:', err);
      return null;
    }
  };

  const deleteQuiz = async (id: string) => {
    try {
      await quizService.deleteQuiz(id);
      const remaining = quizzes.filter((q) => q.id !== id);
      setQuizzes(remaining);
      if (activeQuiz?.id === id) {
        if (remaining.length > 0) {
          selectQuiz(remaining[0]);
        } else {
          setActiveQuiz(null);
        }
      }
    } catch (err) {
      console.error('Delete quiz failed:', err);
    }
  };

  const filteredQuizzes = quizzes.filter((q) => {
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      return (
        q.title.toLowerCase().includes(term) ||
        (q.topic && q.topic.toLowerCase().includes(term)) ||
        (q.description && q.description.toLowerCase().includes(term))
      );
    }
    return true;
  });

  return {
    quizzes: filteredQuizzes,
    allQuizzes: quizzes,
    activeQuiz,
    activeAttempt,
    setActiveAttempt,
    selectQuiz,
    isLoading,
    isGenerating,
    searchQuery,
    setSearchQuery,
    generateQuiz,
    submitAttempt,
    deleteQuiz,
    refreshQuizzes: loadQuizzes,
  };
}
