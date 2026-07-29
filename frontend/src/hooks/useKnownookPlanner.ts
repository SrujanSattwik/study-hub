import { useState, useEffect, useCallback } from 'react';
import plannerService from '../services/planner.service';
import {
  AiStudyPlan,
  AiStudyGoal,
  GenerateStudyPlanDTO,
  LearningProgressSummary,
  SmartRecommendationItem,
} from '../types/ai.types';

export function useKnownookPlanner(conversationId?: string) {
  const [plans, setPlans] = useState<AiStudyPlan[]>([]);
  const [activePlan, setActivePlan] = useState<AiStudyPlan | null>(null);
  const [goals, setGoals] = useState<AiStudyGoal[]>([]);
  const [progress, setProgress] = useState<LearningProgressSummary | null>(null);
  const [recommendations, setRecommendations] = useState<SmartRecommendationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadPlannerData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [userPlans, userGoals, progressSummary, recs] = await Promise.all([
        plannerService.listPlans(),
        plannerService.listGoals(),
        plannerService.getProgressSummary(),
        plannerService.getRecommendations(),
      ]);

      setPlans(userPlans);
      setGoals(userGoals);
      setProgress(progressSummary);
      setRecommendations(recs);

      if (userPlans.length > 0 && !activePlan) {
        const fullDetails = await plannerService.getPlanDetails(userPlans[0].id);
        setActivePlan(fullDetails);
      }
    } catch (err) {
      console.error('Failed to load planner data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activePlan]);

  useEffect(() => {
    loadPlannerData();
  }, [loadPlannerData]);

  const selectPlan = async (plan: AiStudyPlan) => {
    try {
      const fullDetails = await plannerService.getPlanDetails(plan.id);
      setActivePlan(fullDetails);
    } catch (err) {
      console.error('Failed to load plan details:', err);
    }
  };

  const generatePlan = async (dto: GenerateStudyPlanDTO): Promise<AiStudyPlan | null> => {
    setIsGenerating(true);
    try {
      const created = await plannerService.generatePlan({
        ...dto,
        conversationId: dto.conversationId || conversationId,
      });
      setPlans((prev) => [created, ...prev]);
      setActivePlan(created);
      return created;
    } catch (err) {
      console.error('Generate plan failed:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      await plannerService.updateTaskStatus(taskId, status);
      if (activePlan && activePlan.tasks) {
        const updatedTasks = activePlan.tasks.map((t) =>
          t.id === taskId ? { ...t, status: status as any } : t
        );
        setActivePlan({ ...activePlan, tasks: updatedTasks });
      }
    } catch (err) {
      console.error('Update task status failed:', err);
    }
  };

  const createGoal = async (data: { title: string; description?: string; targetValue?: number; targetDate: string }) => {
    try {
      const created = await plannerService.createGoal(data);
      setGoals((prev) => [...prev, created]);
      return created;
    } catch (err) {
      console.error('Create goal failed:', err);
      return null;
    }
  };

  const logSession = async (durationSec: number, sessionType?: string) => {
    try {
      await plannerService.logSession({ durationSec, sessionType });
      const updatedProgress = await plannerService.getProgressSummary();
      setProgress(updatedProgress);
    } catch (err) {
      console.error('Log session failed:', err);
    }
  };

  return {
    plans,
    activePlan,
    goals,
    progress,
    recommendations,
    selectPlan,
    isLoading,
    isGenerating,
    generatePlan,
    updateTaskStatus,
    createGoal,
    logSession,
    refreshPlanner: loadPlannerData,
  };
}
