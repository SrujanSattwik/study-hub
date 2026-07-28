import React, { useState, useEffect } from 'react';
import { AiQuiz, AiQuizQuestion, AiQuizAttempt, GenerateQuizDTO } from '../../types/ai.types';
import RichMarkdownRenderer from './RichMarkdownRenderer';

interface QuizWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizzes: AiQuiz[];
  activeQuiz: AiQuiz | null;
  activeAttempt: AiQuizAttempt | null;
  onSelectQuiz: (quiz: AiQuiz) => void;
  onGenerateQuiz: (dto: GenerateQuizDTO) => void;
  onSubmitAttempt: (
    quizId: string,
    timeTakenSec: number,
    answers: Record<string, { userAnswer: string; isCorrect: boolean; explanation?: string }>
  ) => void;
  onDeleteQuiz: (id: string) => void;
  onResetAttempt: () => void;
  onCreateFlashcardFromQuestion?: (questionText: string, correctAnswer: string) => void;
  isLoading: boolean;
  isGenerating: boolean;
}

const PRESET_TEMPLATES = [
  { name: '🎯 Exam Cheat Sheet Prep', topic: 'Exam Review', difficulty: 'hard' as const, numQuestions: 10, timeLimitSec: 600 },
  { name: '⚡ Daily Revision 5-Min', topic: 'Daily Practice', difficulty: 'medium' as const, numQuestions: 5, timeLimitSec: 300 },
  { name: '👶 Beginner Fundamentals', topic: 'Basics & Definitions', difficulty: 'easy' as const, numQuestions: 5, timeLimitSec: 300 },
];

export const QuizWorkspaceModal: React.FC<QuizWorkspaceModalProps> = ({
  isOpen,
  onClose,
  quizzes,
  activeQuiz,
  activeAttempt,
  onSelectQuiz,
  onGenerateQuiz,
  onSubmitAttempt,
  onDeleteQuiz,
  onResetAttempt,
  onCreateFlashcardFromQuestion,
  isLoading,
  isGenerating,
}) => {
  // Generator form
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [timeLimitSec, setTimeLimitSec] = useState<number>(300);

  // Interactive Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [timeRemainingSec, setTimeRemainingSec] = useState(300);

  // Timer Effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPlaying && timeRemainingSec > 0) {
      timer = setInterval(() => setTimeRemainingSec((prev) => prev - 1), 1000);
    } else if (isPlaying && timeRemainingSec === 0) {
      handleFinishQuiz();
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeRemainingSec]);

  if (!isOpen) return null;

  const handleStartQuiz = () => {
    if (!activeQuiz || !activeQuiz.questions || activeQuiz.questions.length === 0) return;
    setIsPlaying(true);
    setCurrentIdx(0);
    setUserAnswers({});
    setFlaggedQuestions({});
    setTimeRemainingSec(activeQuiz.timeLimitSec || 300);
    onResetAttempt();
  };

  const handleFinishQuiz = () => {
    if (!activeQuiz || !activeQuiz.questions) return;
    setIsPlaying(false);

    const answersPayload: Record<string, { userAnswer: string; isCorrect: boolean; explanation?: string }> = {};
    for (const q of activeQuiz.questions) {
      const uAns = userAnswers[q.id] || '';
      const isCorrect = uAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
      answersPayload[q.id] = {
        userAnswer: uAns,
        isCorrect,
        explanation: q.explanation || undefined,
      };
    }

    const elapsed = (activeQuiz.timeLimitSec || 300) - timeRemainingSec;
    onSubmitAttempt(activeQuiz.id, Math.max(1, elapsed), answersPayload);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const questions = activeQuiz?.questions || [];
  const currentQ = questions[currentIdx];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] text-gray-100 font-sans">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-gradient-to-tr from-amber-500 to-rose-600 rounded-xl text-white font-bold text-base shadow">
              🎯
            </span>
            <div>
              <h2 className="font-bold text-white text-lg leading-tight">KnowNook AI Quiz & Assessment Hub</h2>
              <p className="text-xs text-amber-400 font-medium">Interactive Quizzes, Templates & AI Evaluations</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition font-bold"
          >
            ✕
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Column: Quiz Generator & Quiz List */}
          <div className="w-80 border-r border-gray-800 flex flex-col bg-gray-900/60">
            {/* Preset Templates & Generator */}
            <div className="p-4 border-b border-gray-800 space-y-3">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Generate AI Quiz
              </label>

              <input
                type="text"
                placeholder="Topic (e.g., Operating System Deadlocks)"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              />

              <div className="flex items-center gap-2">
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="flex-1 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>

                <select
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value, 10))}
                  className="w-24 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                </select>
              </div>

              <button
                onClick={() => onGenerateQuiz({ topic, difficulty, numQuestions, timeLimitSec })}
                disabled={isGenerating}
                className="w-full py-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? 'Generating Quiz...' : '✨ Generate AI Quiz'}
              </button>

              {/* Presets */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Quick Templates</span>
                <div className="space-y-1">
                  {PRESET_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.name}
                      onClick={() => {
                        setTopic(tmpl.topic);
                        setDifficulty(tmpl.difficulty);
                        setNumQuestions(tmpl.numQuestions);
                        setTimeLimitSec(tmpl.timeLimitSec);
                        onGenerateQuiz({ topic: tmpl.topic, difficulty: tmpl.difficulty, numQuestions: tmpl.numQuestions, timeLimitSec: tmpl.timeLimitSec });
                      }}
                      className="w-full p-2 bg-gray-800/40 hover:bg-gray-800 text-left rounded-lg text-[11px] text-gray-300 hover:text-white transition flex items-center justify-between border border-transparent hover:border-gray-700"
                    >
                      <span className="font-semibold">{tmpl.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-gray-700 rounded text-gray-400 uppercase">{tmpl.difficulty}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Saved Quizzes List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block px-2 py-1">
                Saved Quizzes ({quizzes.length})
              </span>
              {quizzes.map((q) => {
                const isActive = q.id === activeQuiz?.id;
                return (
                  <div
                    key={q.id}
                    onClick={() => {
                      setIsPlaying(false);
                      onSelectQuiz(q);
                    }}
                    className={`p-3 rounded-xl text-xs cursor-pointer transition flex items-center justify-between border ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-950/80 to-rose-950/40 border-amber-500/60 text-white font-medium shadow'
                        : 'bg-gray-800/40 hover:bg-gray-800 border-transparent text-gray-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-white truncate">{q.title}</h4>
                      <p className="text-[10px] text-gray-400 truncate">{q.topic || 'General Topic'} • {q.difficulty.toUpperCase()}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteQuiz(q.id);
                      }}
                      className="p-1 text-gray-500 hover:text-rose-400 transition"
                    >
                      🗑
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Quiz Player / Results View */}
          <div className="flex-1 flex flex-col h-full bg-gray-900/90 min-w-0">
            {activeQuiz ? (
              isPlaying ? (
                /* Interactive Quiz Player Screen */
                <div className="flex-1 flex flex-col h-full p-6 space-y-6">
                  {/* Player Top Navigation & Timer */}
                  <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-400">
                        Question {currentIdx + 1} of {questions.length}
                      </span>
                      <button
                        onClick={() =>
                          setFlaggedQuestions((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }))
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                          flaggedQuestions[currentQ.id]
                            ? 'bg-amber-950 border-amber-500 text-amber-400'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
                        }`}
                      >
                        {flaggedQuestions[currentQ.id] ? '🚩 Flagged' : '🏳️ Flag'}
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-base font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/40 px-3 py-1 rounded-xl">
                        ⏱️ {formatTimer(timeRemainingSec)}
                      </span>
                      <button
                        onClick={handleFinishQuiz}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition"
                      >
                        Submit Quiz
                      </button>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="flex-1 overflow-y-auto space-y-4">
                    <h3 className="font-bold text-white text-lg">{currentQ.questionText}</h3>

                    {currentQ.options && (
                      <div className="space-y-2 max-w-xl pt-2">
                        {currentQ.options.map((opt) => {
                          const isSelected = userAnswers[currentQ.id] === opt;
                          return (
                            <button
                              key={opt}
                              onClick={() => setUserAnswers((prev) => ({ ...prev, [currentQ.id]: opt }))}
                              className={`w-full p-4 rounded-xl text-left text-sm font-medium transition flex items-center justify-between border ${
                                isSelected
                                  ? 'bg-amber-950/80 border-amber-500 text-amber-300 font-bold shadow'
                                  : 'bg-gray-800/60 border-gray-700 text-gray-200 hover:bg-gray-800'
                              }`}
                            >
                              <span>{opt}</span>
                              {isSelected && <span className="text-amber-400 font-bold">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Player Bottom Navigation */}
                  <div className="flex items-center justify-between border-t border-gray-800 pt-4">
                    <button
                      onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                      disabled={currentIdx === 0}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-40"
                    >
                      ← Previous
                    </button>

                    <div className="flex gap-1">
                      {questions.map((q, idx) => (
                        <button
                          key={q.id}
                          onClick={() => setCurrentIdx(idx)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                            currentIdx === idx
                              ? 'bg-amber-500 text-white'
                              : userAnswers[q.id]
                              ? 'bg-emerald-950 border border-emerald-500 text-emerald-400'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                      disabled={currentIdx === questions.length - 1}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-40"
                    >
                      Next Question →
                    </button>
                  </div>
                </div>
              ) : activeAttempt ? (
                /* Evaluation & Results View */
                <div className="flex-1 flex flex-col h-full p-6 space-y-6 overflow-y-auto custom-scrollbar">
                  {/* Score Card Banner */}
                  <div className="p-6 bg-gradient-to-r from-amber-950/80 to-rose-950/60 border border-amber-500/40 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Quiz Completed</span>
                      <h2 className="text-3xl font-black text-white mt-1">{activeAttempt.score}% Accuracy</h2>
                      <p className="text-xs text-gray-300 mt-1">
                        Correct: {activeAttempt.correctCount} / {activeAttempt.totalQuestions} questions in {activeAttempt.timeTakenSec} seconds.
                      </p>
                    </div>

                    <button
                      onClick={handleStartQuiz}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold rounded-xl text-xs shadow transition"
                    >
                      🔄 Retry Quiz
                    </button>
                  </div>

                  {/* Detailed Question Review */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-white text-base">Question Breakdown & AI Explanations</h3>
                    {questions.map((q, idx) => {
                      const ansObj = activeAttempt.userAnswers?.[q.id];
                      const isCorrect = ansObj?.isCorrect;
                      return (
                        <div
                          key={q.id}
                          className={`p-4 rounded-2xl border space-y-2 ${
                            isCorrect
                              ? 'bg-emerald-950/20 border-emerald-500/40'
                              : 'bg-rose-950/20 border-rose-500/40'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <h4 className="font-bold text-white text-sm">
                              {idx + 1}. {q.questionText}
                            </h4>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                isCorrect ? 'bg-emerald-900 text-emerald-300' : 'bg-rose-900 text-rose-300'
                              }`}
                            >
                              {isCorrect ? 'Correct' : 'Incorrect'}
                            </span>
                          </div>

                          <p className="text-xs text-gray-300">
                            <strong>Your Answer:</strong> {ansObj?.userAnswer || 'Not Answered'} |{' '}
                            <strong>Correct Answer:</strong> {q.correctAnswer}
                          </p>

                          {q.explanation && (
                            <div className="p-3 bg-gray-950/60 rounded-xl text-xs text-gray-300 border border-gray-800">
                              <span className="font-bold text-cyan-400 block mb-1">💡 AI Explanation</span>
                              <RichMarkdownRenderer content={q.explanation} />
                            </div>
                          )}

                          {onCreateFlashcardFromQuestion && (
                            <button
                              onClick={() => onCreateFlashcardFromQuestion(q.questionText, q.correctAnswer)}
                              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-amber-400 border border-gray-700 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                            >
                              <span>🎴 Create Flashcard from Question</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Quiz Overview Screen before Start */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <span className="text-5xl">🎯</span>
                  <div>
                    <h3 className="font-bold text-white text-xl">{activeQuiz.title}</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-md">{activeQuiz.description}</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold text-amber-400">
                    <span>{questions.length} Questions</span>
                    <span>•</span>
                    <span>{activeQuiz.difficulty.toUpperCase()} Difficulty</span>
                    <span>•</span>
                    <span>{Math.round(activeQuiz.timeLimitSec / 60)} Minutes</span>
                  </div>

                  <button
                    onClick={handleStartQuiz}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-gray-950 font-black rounded-2xl text-sm shadow-xl transition"
                  >
                    🚀 Start Interactive Quiz Now
                  </button>
                </div>
              )
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
                <span className="text-5xl mb-4">🎯</span>
                <h3 className="font-bold text-white text-base">Select or Generate a Quiz</h3>
                <p className="text-xs text-gray-400 max-w-md mt-1">
                  Choose a quiz template on the left or generate a custom assessment from your active study session.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizWorkspaceModal;
