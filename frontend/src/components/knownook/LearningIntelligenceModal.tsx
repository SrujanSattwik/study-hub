import React, { useState } from 'react';
import {
  LearnerProfileMetrics,
  TopicMasteryItem,
  DetailedRecommendationItem,
  WeeklyIntelligenceReport,
  AchievementItem,
} from '../../types/ai.types';

interface LearningIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: LearnerProfileMetrics | null;
  masteries: TopicMasteryItem[];
  weakTopics: TopicMasteryItem[];
  recommendations: DetailedRecommendationItem[];
  weeklyReport: WeeklyIntelligenceReport | null;
  achievements: AchievementItem[];
  onFeedback: (id: string, status: 'helpful' | 'dismissed' | 'snoozed') => void;
  isLoading: boolean;
}

export const LearningIntelligenceModal: React.FC<LearningIntelligenceModalProps> = ({
  isOpen,
  onClose,
  profile,
  masteries,
  weakTopics,
  recommendations,
  weeklyReport,
  achievements,
  onFeedback,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'mastery' | 'recommendations' | 'weekly' | 'achievements'>('profile');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[88vh] text-gray-100 font-sans">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-xl text-white font-bold text-base shadow">
              🧠
            </span>
            <div>
              <h2 className="font-bold text-white text-lg leading-tight">KnowNook Learning Intelligence & Personalization Engine</h2>
              <p className="text-xs text-purple-400 font-medium">Adaptive Profile, Topic Mastery Map & Predictive Guidance</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Level Badge */}
            <div className="px-3 py-1 bg-purple-950/80 border border-purple-500/40 rounded-xl text-xs font-bold text-purple-300 flex items-center gap-1.5">
              <span>⚡ Level {profile?.currentLevel || 1}</span>
              <span>• {profile?.xpTotal || 0} XP</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-gray-800 bg-gray-950/60 flex items-center gap-2">
          {[
            { id: 'profile', label: '🧠 Profile & Scores', desc: 'Aggregate Health' },
            { id: 'mastery', label: '🗺️ Mastery Map & Weak Topics', desc: 'Topic Breakdown' },
            { id: 'recommendations', label: '💡 Smart Recommendations', desc: 'Action Items & Impact' },
            { id: 'weekly', label: '📊 Weekly Report', desc: 'Study Summary' },
            { id: 'achievements', label: '🏆 Achievements & XP', desc: 'Gamification Badges' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 text-xs font-bold transition border-b-2 ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-400 bg-purple-950/20'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0 bg-gray-900/90">
          {/* TAB 1: PROFILE & SCORES */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Learning Health Gauge */}
              <div className="p-6 bg-gradient-to-r from-purple-950/80 to-indigo-950/60 border border-purple-500/40 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">Aggregate Metric</span>
                  <h3 className="text-4xl font-black text-white mt-1">
                    Learning Health: <span className="text-emerald-400">{profile?.healthScore || 85}/100</span>
                  </h3>
                  <p className="text-xs text-gray-300 mt-1">Based on Knowledge, Focus, Consistency & Revision Frequency</p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-gray-400 font-bold block uppercase">Forecasted Target Completion</span>
                  <span className="text-lg font-bold text-cyan-400 mt-0.5 block">{profile?.forecastedCompletionDate || 'Aug 20'}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">✓ {profile?.forecastConfidencePct || 91}% Confidence</span>
                </div>
              </div>

              {/* Metric Breakdown Grid */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-gray-800/60 border border-gray-700/80 rounded-2xl">
                  <span className="text-xs text-gray-400 font-bold block uppercase">Knowledge Score</span>
                  <span className="text-2xl font-black text-purple-400 mt-1 block">{profile?.knowledgeScore || 78}%</span>
                </div>

                <div className="p-4 bg-gray-800/60 border border-gray-700/80 rounded-2xl">
                  <span className="text-xs text-gray-400 font-bold block uppercase">Consistency Score</span>
                  <span className="text-2xl font-black text-emerald-400 mt-1 block">{profile?.consistencyScore || 82}%</span>
                </div>

                <div className="p-4 bg-gray-800/60 border border-gray-700/80 rounded-2xl">
                  <span className="text-xs text-gray-400 font-bold block uppercase">Focus Score</span>
                  <span className="text-2xl font-black text-cyan-400 mt-1 block">{profile?.focusScore || 88}%</span>
                </div>

                <div className="p-4 bg-gray-800/60 border border-gray-700/80 rounded-2xl">
                  <span className="text-xs text-gray-400 font-bold block uppercase">Learning Velocity</span>
                  <span className="text-2xl font-black text-amber-400 mt-1 block">{profile?.learningVelocity || 14.2} / hr</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MASTERY MAP */}
          {activeTab === 'mastery' && (
            <div className="space-y-6">
              {/* Weak Topics Warning Alert */}
              {weakTopics.length > 0 && (
                <div className="p-4 bg-rose-950/60 border border-rose-500/40 rounded-2xl space-y-1">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">⚠️ Weak Topics Identified</span>
                  <p className="text-xs text-gray-300">
                    The intelligence engine detected accuracy drops in: {weakTopics.map((t) => t.topicName).join(', ')}.
                  </p>
                </div>
              )}

              {/* Masteries Grid */}
              <div className="space-y-3">
                <h3 className="font-bold text-white text-base">Topic Mastery Breakdown</h3>
                <div className="grid grid-cols-2 gap-4">
                  {masteries.map((m) => (
                    <div key={m.topicName} className="p-4 bg-gray-800/60 border border-gray-700/80 rounded-2xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-white text-sm">{m.topicName}</h4>
                          <span className="text-[10px] font-bold text-purple-400 uppercase">{m.masteryLevel}</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-400">{m.masteryScore}%</span>
                      </div>

                      <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${m.isWeak ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${m.masteryScore}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-gray-400 border-t border-gray-700/60 pt-2">
                        <span>Suggested: <strong className="text-amber-300">{m.suggestedDifficulty}</strong></span>
                        {m.prerequisites && m.prerequisites.length > 0 && (
                          <span>Prereq: {m.prerequisites.join(', ')}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SMART RECOMMENDATIONS */}
          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              <h3 className="font-bold text-white text-base">Prioritized Action Items ({recommendations.length})</h3>

              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="p-4 bg-gray-800/60 border border-gray-700/80 rounded-2xl space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          rec.priority === 'high' ? 'bg-rose-950 text-rose-400 border border-rose-500/40' : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                        }`}>
                          {rec.priority} PRIORITY
                        </span>
                        <span className="text-xs font-bold text-purple-400">⚡ {rec.expectedImpact}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-400">⏱️ {rec.estimatedMin} mins</span>
                    </div>

                    <h4 className="font-bold text-white text-sm">{rec.title}</h4>
                    <p className="text-xs text-gray-300">{rec.description}</p>
                    <p className="text-xs text-gray-400 font-mono bg-gray-950/60 p-2 rounded-lg">💡 Rationale: {rec.reason}</p>

                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-700/60">
                      <button
                        onClick={() => onFeedback(rec.id, 'dismissed')}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-bold transition"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => onFeedback(rec.id, 'helpful')}
                        className="px-4 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
                      >
                        ✓ Helpful
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: WEEKLY REPORT */}
          {activeTab === 'weekly' && (
            <div className="p-6 bg-gray-800/60 border border-gray-700/80 rounded-2xl space-y-4">
              <h3 className="font-bold text-white text-base">📊 {weeklyReport?.weekLabel || 'Weekly Intelligence Summary'}</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-900/80 border border-gray-800 rounded-xl space-y-1">
                  <span className="text-xs text-gray-400 uppercase font-bold block">Study Duration</span>
                  <span className="text-2xl font-bold text-emerald-400">{weeklyReport?.hoursStudied || 4.8} Hours</span>
                </div>
                <div className="p-4 bg-gray-900/80 border border-gray-800 rounded-xl space-y-1">
                  <span className="text-xs text-gray-400 uppercase font-bold block">Quizzes & Flashcards</span>
                  <span className="text-2xl font-bold text-cyan-400">{weeklyReport?.quizzesTaken || 3} Quizzes • {weeklyReport?.flashcardsReviewed || 45} Cards</span>
                </div>
              </div>

              <div className="p-4 bg-gray-950/80 border border-gray-800 rounded-xl space-y-2 text-xs">
                <div>
                  <span className="font-bold text-emerald-400">🌟 Strongest Subject:</span> {weeklyReport?.strongestTopic}
                </div>
                <div>
                  <span className="font-bold text-rose-400">⚠️ Needs Attention:</span> {weeklyReport?.needsAttentionTopic}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ACHIEVEMENTS */}
          {activeTab === 'achievements' && (
            <div className="space-y-4">
              <h3 className="font-bold text-white text-base">🏆 Unlocked Badges ({achievements.length})</h3>

              <div className="grid grid-cols-2 gap-4">
                {achievements.map((ach) => (
                  <div key={ach.id} className="p-4 bg-gray-800/60 border border-gray-700/80 rounded-2xl flex items-center gap-3">
                    <span className="text-3xl">🏆</span>
                    <div>
                      <h4 className="font-bold text-white text-sm">{ach.title}</h4>
                      <p className="text-xs text-gray-400">{ach.description}</p>
                      <span className="text-[10px] font-bold text-amber-400 mt-1 block">+{ach.xpEarned} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningIntelligenceModal;
