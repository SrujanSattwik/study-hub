import { useState, useEffect, useCallback } from 'react';
import intelligenceService from '../services/intelligence.service';
import {
  LearnerProfileMetrics,
  TopicMasteryItem,
  DetailedRecommendationItem,
  WeeklyIntelligenceReport,
  AchievementItem,
} from '../types/ai.types';

export function useKnownookIntelligence() {
  const [profile, setProfile] = useState<LearnerProfileMetrics | null>(null);
  const [masteries, setMasteries] = useState<TopicMasteryItem[]>([]);
  const [weakTopics, setWeakTopics] = useState<TopicMasteryItem[]>([]);
  const [recommendations, setRecommendations] = useState<DetailedRecommendationItem[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyIntelligenceReport | null>(null);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadIntelligenceData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [userProfile, userMasteries, userWeakTopics, userRecs, userReport, userBadges] = await Promise.all([
        intelligenceService.getProfile(),
        intelligenceService.getMasteries(),
        intelligenceService.getWeakTopics(),
        intelligenceService.getRecommendations(),
        intelligenceService.getWeeklyReport(),
        intelligenceService.getAchievements(),
      ]);

      setProfile(userProfile);
      setMasteries(userMasteries);
      setWeakTopics(userWeakTopics);
      setRecommendations(userRecs);
      setWeeklyReport(userReport);
      setAchievements(userBadges);
    } catch (err) {
      console.error('Failed to load intelligence data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIntelligenceData();
  }, [loadIntelligenceData]);

  const sendRecommendationFeedback = async (id: string, status: 'helpful' | 'dismissed' | 'snoozed') => {
    try {
      await intelligenceService.sendRecommendationFeedback(id, status);
      setRecommendations((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Recommendation feedback failed:', err);
    }
  };

  return {
    profile,
    masteries,
    weakTopics,
    recommendations,
    weeklyReport,
    achievements,
    isLoading,
    sendRecommendationFeedback,
    refreshIntelligence: loadIntelligenceData,
  };
}
