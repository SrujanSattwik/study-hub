import React, { useState, useEffect } from 'react';
import {
  AiStudyPlan,
  AiStudyTask,
  AiStudyGoal,
  GenerateStudyPlanDTO,
  LearningProgressSummary,
  SmartRecommendationItem,
} from '../../types/ai.types';

interface StudyPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: AiStudyPlan[];
  activePlan: AiStudyPlan | null;
  goals: AiStudyGoal[];
  progress: LearningProgressSummary | null;
  recommendations: SmartRecommendationItem[];
  onSelectPlan: (plan: AiStudyPlan) => void;
  onGeneratePlan: (dto: GenerateStudyPlanDTO) => void;
  onUpdateTaskStatus: (taskId: string, status: string) => void;
  onCreateGoal: (data: { title: string; description?: string; targetValue?: number; targetDate: string }) => void;
  onLogSession: (durationSec: number, sessionType?: string) => void;
  isLoading: boolean;
  isGenerating: boolean;
}

const PLAN_TEMPLATES = [
  { name: '🎓 GATE Exam Preparation', topic: 'GATE Exam Computer Science', daysDuration: 14, planType: 'exam_prep' as const },
  { name: '📚 Semester Final Exams', topic: 'DBMS & OS Semester Review', daysDuration: 7, planType: 'weekly' as const },
  { name: '💼 Technical Interview Prep', topic: 'Data Structures & Algorithms', daysDuration: 10, planType: 'custom' as const },
  { name: '💻 Competitive Programming', topic: 'LeetCode & Algorithmic Problem Solving', daysDuration: 14, planType: 'monthly' as const },
];

export const StudyPlannerModal: React.FC<StudyPlannerModalProps> = ({
  isOpen,
  onClose,
  plans,
  activePlan,
  goals,
  progress,
  recommendations,
  onSelectPlan,
  onGeneratePlan,
  onUpdateTaskStatus,
  onCreateGoal,
  onLogSession,
  isLoading,
  isGenerating,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'generator' | 'calendar' | 'goals' | 'progress'>('dashboard');

  // Plan Generator State
  const [topic, setTopic] = useState('');
  const [planType, setPlanType] = useState<any>('weekly');
  const [daysDuration, setDaysDuration] = useState(7);
  const [targetGoal, setTargetGoal] = useState('');

  // Goal Form State
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState(10);

  // Focus Timer State
  const [focusTimeMinutes, setFocusTimeMinutes] = useState<number>(25);
  const [focusSecondsLeft, setFocusSecondsLeft] = useState<number>(25 * 60);
  const [isFocusTimerRunning, setIsFocusTimerRunning] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isFocusTimerRunning && focusSecondsLeft > 0) {
      timer = setInterval(() => setFocusSecondsLeft((prev) => prev - 1), 1000);
    } else if (isFocusTimerRunning && focusSecondsLeft === 0) {
      setIsFocusTimerRunning(false);
      onLogSession(focusTimeMinutes * 60, 'focus');
      alert(`🎉 Focus Session Completed! Logged ${focusTimeMinutes} minutes.`);
    }
    return () => clearInterval(timer);
  }, [isFocusTimerRunning, focusSecondsLeft, focusTimeMinutes, onLogSession]);

  if (!isOpen) return null;

  const handleStartFocusTimer = (mins: number) => {
    setFocusTimeMinutes(mins);
    setFocusSecondsLeft(mins * 60);
    setIsFocusTimerRunning(true);
  };

  const handleCreateGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    onCreateGoal({
      title: newGoalTitle.trim(),
      targetValue: newGoalTarget,
      targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    });
    setNewGoalTitle('');
  };

  const tasks = activePlan?.tasks || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[88vh] text-gray-100 font-sans">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-gradient-to-tr from-emerald-500 to-cyan-600 rounded-xl text-white font-bold text-base shadow">
              📅
            </span>
            <div>
              <h2 className="font-bold text-white text-lg leading-tight">KnowNook AI Learning Planner & Progress Center</h2>
              <p className="text-xs text-emerald-400 font-medium">Schedules, Daily Tasks, Focus Timer & Analytics</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Streak Badge */}
            <div className="px-3 py-1 bg-amber-950/80 border border-amber-500/40 rounded-xl text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <span>🔥</span>
              <span>{progress?.activeStreakDays || 0} Day Streak</span>
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
            { id: 'dashboard', label: '📊 Dashboard', desc: 'Today Overview' },
            { id: 'generator', label: '✨ AI Plan Generator', desc: 'Schedules & Templates' },
            { id: 'calendar', label: '📅 Calendar & Timeline', desc: 'Agenda View' },
            { id: 'goals', label: '🎯 Goals & Tasks', desc: 'Milestone Checklist' },
            { id: 'progress', label: '🔥 Progress & Heatmap', desc: '52-Week Study Heatmap' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 text-xs font-bold transition border-b-2 ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0 bg-gray-900/90">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Metrics Summary Row */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-gray-800/60 border border-gray-700/80 rounded-2xl">
                  <span className="text-xs text-gray-400 font-bold block uppercase">Total Study Time</span>
                  <span className="text-2xl font-black text-emerald-400 mt-1 block">{progress?.totalStudyHours || 0} Hours</span>
                  <span className="text-[10px] text-gray-500">{progress?.totalStudyMinutes || 0} total minutes logged</span>
                </div>

                <div className="p-4 bg-gray-800/60 border border-gray-700/80 rounded-2xl">
                  <span className="text-xs text-gray-400 font-bold block uppercase">Active Streak</span>
                  <span className="text-2xl font-black text-amber-400 mt-1 block">🔥 {progress?.activeStreakDays || 0} Days</span>
                  <span className="text-[10px] text-gray-500">Continuous daily learning</span>
                </div>

                <div className="p-4 bg-gray-800/60 border border-gray-700/80 rounded-2xl">
                  <span className="text-xs text-gray-400 font-bold block uppercase">Completed Tasks</span>
                  <span className="text-2xl font-black text-cyan-400 mt-1 block">{progress?.completedTasksCount || 0} Tasks</span>
                  <span className="text-[10px] text-gray-500">Finished roadmap items</span>
                </div>

                <div className="p-4 bg-gray-800/60 border border-gray-700/80 rounded-2xl">
                  <span className="text-xs text-gray-400 font-bold block uppercase">Active Goals</span>
                  <span className="text-2xl font-black text-rose-400 mt-1 block">{goals.length} Goals</span>
                  <span className="text-[10px] text-gray-500">{progress?.completedGoalsCount || 0} completed</span>
                </div>
              </div>

              {/* Focus Timer Widget */}
              <div className="p-6 bg-gradient-to-r from-emerald-950/80 to-cyan-950/60 border border-emerald-500/40 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">⏱️ Focus Study Timer</span>
                  <h3 className="text-4xl font-mono font-black text-white mt-1">
                    {Math.floor(focusSecondsLeft / 60).toString().padStart(2, '0')}:{(focusSecondsLeft % 60).toString().padStart(2, '0')}
                  </h3>
                  <p className="text-xs text-gray-300 mt-1">Select focus duration and start study session</p>
                </div>

                <div className="flex items-center gap-2">
                  {[25, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => handleStartFocusTimer(mins)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition border ${
                        focusTimeMinutes === mins && isFocusTimerRunning
                          ? 'bg-emerald-500 text-gray-950 border-emerald-400'
                          : 'bg-gray-800 border-gray-700 text-gray-300 hover:text-white'
                      }`}
                    >
                      {mins} Min
                    </button>
                  ))}
                  {isFocusTimerRunning && (
                    <button
                      onClick={() => setIsFocusTimerRunning(false)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition"
                    >
                      Pause
                    </button>
                  )}
                </div>
              </div>

              {/* Smart Recommendations List */}
              <div className="space-y-3">
                <h3 className="font-bold text-white text-base">💡 Smart AI Learning Recommendations</h3>
                <div className="grid grid-cols-2 gap-3">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="p-4 bg-gray-800/40 border border-gray-700/80 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">{rec.category.replace('_', ' ')}</span>
                      <h4 className="font-bold text-white text-sm">{rec.title}</h4>
                      <p className="text-xs text-gray-400">{rec.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI PLAN GENERATOR */}
          {activeTab === 'generator' && (
            <div className="space-y-6">
              {/* Presets */}
              <div>
                <h3 className="font-bold text-white text-sm uppercase tracking-wider block mb-2">Preset Plan Templates</h3>
                <div className="grid grid-cols-2 gap-3">
                  {PLAN_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.name}
                      onClick={() => {
                        setTopic(tmpl.topic);
                        setDaysDuration(tmpl.daysDuration);
                        setPlanType(tmpl.planType);
                        onGeneratePlan({ topic: tmpl.topic, daysDuration: tmpl.daysDuration, planType: tmpl.planType });
                      }}
                      className="p-4 bg-gray-800/60 hover:bg-gray-800 border border-gray-700/80 text-left rounded-2xl transition space-y-1"
                    >
                      <h4 className="font-bold text-white text-sm">{tmpl.name}</h4>
                      <p className="text-xs text-gray-400">{tmpl.daysDuration}-Day {tmpl.planType.toUpperCase()} schedule</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form */}
              <div className="p-6 bg-gray-800/40 border border-gray-700/80 rounded-2xl space-y-4">
                <h3 className="font-bold text-white text-base">Custom AI Study Schedule Generator</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 font-bold block mb-1 uppercase">Study Topic</label>
                    <input
                      type="text"
                      placeholder="Topic (e.g. Distributed Systems & Raft Consensus)"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 font-bold block mb-1 uppercase">Plan Type & Duration</label>
                    <div className="flex gap-2">
                      <select
                        value={planType}
                        onChange={(e) => setPlanType(e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none"
                      >
                        <option value="daily">Daily Plan</option>
                        <option value="weekly">Weekly Plan</option>
                        <option value="exam_prep">Exam Prep</option>
                      </select>

                      <input
                        type="number"
                        value={daysDuration}
                        onChange={(e) => setDaysDuration(parseInt(e.target.value, 10))}
                        className="w-24 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onGeneratePlan({ topic, daysDuration, planType, targetGoal })}
                  disabled={isGenerating}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs shadow transition disabled:opacity-50"
                >
                  {isGenerating ? 'Generating AI Plan...' : '✨ Generate AI Study Schedule'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: CALENDAR & TIMELINE */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              <h3 className="font-bold text-white text-base">Agenda & Timeline ({tasks.length} Tasks)</h3>

              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 bg-gray-800/50 border border-gray-700/80 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onUpdateTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold transition ${
                          task.status === 'completed'
                            ? 'bg-emerald-500 text-gray-950'
                            : 'border border-gray-600 text-transparent hover:border-emerald-400'
                        }`}
                      >
                        ✓
                      </button>
                      <div>
                        <h4 className={`text-xs font-bold ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-white'}`}>
                          {task.title}
                        </h4>
                        <p className="text-[10px] text-gray-400">{task.description || 'Task Item'} • {task.durationMin} mins</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-gray-400 px-2 py-0.5 bg-gray-700/60 rounded">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: GOALS & TASKS */}
          {activeTab === 'goals' && (
            <div className="space-y-6">
              {/* Create Goal Form */}
              <form onSubmit={handleCreateGoalSubmit} className="p-4 bg-gray-800/40 border border-gray-700/80 rounded-2xl flex gap-3">
                <input
                  type="text"
                  placeholder="New Goal Title (e.g. Solve 100 DBMS MCQs)"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs">
                  + Create Goal
                </button>
              </form>

              {/* Goals Progress Grid */}
              <div className="grid grid-cols-2 gap-4">
                {goals.map((g) => {
                  const pct = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
                  return (
                    <div key={g.id} className="p-4 bg-gray-800/60 border border-gray-700/80 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-white text-sm">{g.title}</h4>
                        <span className="text-xs font-bold text-emerald-400">{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: LEARNING PROGRESS & HEATMAP */}
          {activeTab === 'progress' && (
            <div className="space-y-6">
              <div className="p-6 bg-gray-800/60 border border-gray-700/80 rounded-2xl space-y-3">
                <h3 className="font-bold text-white text-base">🔥 52-Week Study Contribution Heatmap</h3>

                {/* Heatmap Grid */}
                <div className="grid grid-cols-12 gap-1.5 p-3 bg-gray-950/80 rounded-xl border border-gray-800">
                  {Array.from({ length: 48 }).map((_, idx) => {
                    const hasActivity = idx % 3 === 0;
                    return (
                      <div
                        key={idx}
                        className={`h-4 rounded-xs transition ${
                          hasActivity ? 'bg-emerald-500 shadow-sm' : 'bg-gray-800/60'
                        }`}
                        title={`Week ${idx + 1}: ${hasActivity ? 'Study logged' : 'No activity'}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyPlannerModal;
