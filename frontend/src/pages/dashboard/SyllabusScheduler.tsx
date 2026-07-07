import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

interface Chapter {
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface SyllabusPlan {
  subjects: string[];
  chapters: Record<number, Chapter[]>;
  examDate: string;
  priority: string;
  dailyHours: number;
  studyTime: string;
  daysOff: number[];
  tasks: Array<{
    id: number;
    subject: string;
    chapter: string;
    type: 'Study' | 'Revision';
    hours: number;
    date: string;
    completed: boolean;
  }>;
}

export const SyllabusScheduler: React.FC = () => {
  const [step, setStep] = useState(1);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState('');
  const [chapters, setChapters] = useState<Record<number, Chapter[]>>({});
  const [chapterInputs, setChapterInputs] = useState<Record<number, string>>({});
  const [chapterDifficulty, setChapterDifficulty] = useState<Record<number, 'easy' | 'medium' | 'hard'>>({});
  const [examDate, setExamDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dailyHours, setDailyHours] = useState(4);
  const [studyTime, setStudyTime] = useState('afternoon');
  const [daysOff, setDaysOff] = useState<number[]>([]);
  const [activePlan, setActivePlan] = useState<SyllabusPlan | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem('studyclub_syllabus');
    if (cached) {
      try {
        setActivePlan(JSON.parse(cached));
      } catch (err) {
        // ignore
      }
    }
  }, []);

  const handleAddSubject = () => {
    if (!subjectInput.trim()) return;
    setSubjects([...subjects, subjectInput.trim()]);
    setSubjectInput('');
  };

  const handleRemoveSubject = (idx: number) => {
    setSubjects(subjects.filter((_, i) => i !== idx));
    const newChapters = { ...chapters };
    delete newChapters[idx];
    setChapters(newChapters);
  };

  const handleAddChapter = (subjectIdx: number) => {
    const inputVal = chapterInputs[subjectIdx] || '';
    if (!inputVal.trim()) return;

    const diff = chapterDifficulty[subjectIdx] || 'medium';
    const list = chapters[subjectIdx] || [];
    setChapters({
      ...chapters,
      [subjectIdx]: [...list, { name: inputVal.trim(), difficulty: diff }],
    });

    setChapterInputs({ ...chapterInputs, [subjectIdx]: '' });
  };

  const handleRemoveChapter = (subjectIdx: number, chapIdx: number) => {
    const list = chapters[subjectIdx] || [];
    setChapters({
      ...chapters,
      [subjectIdx]: list.filter((_, i) => i !== chapIdx),
    });
  };

  const handleToggleDayOff = (dayIdx: number) => {
    if (daysOff.includes(dayIdx)) {
      setDaysOff(daysOff.filter((d) => d !== dayIdx));
    } else {
      setDaysOff([...daysOff, dayIdx]);
    }
  };

  const handleGeneratePlan = () => {
    if (!examDate) return;

    const tasks: SyllabusPlan['tasks'] = [];
    const dateObj = new Date(examDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let taskId = 1;
    let currentDate = new Date(today);
    let dayCount = 0;

    // Standard task aggregation logic
    subjects.forEach((subject, subjectIdx) => {
      const list = chapters[subjectIdx] || [];
      list.forEach((chap) => {
        const hours = chap.difficulty === 'hard' ? 3 : chap.difficulty === 'medium' ? 2 : 1;
        
        // Skip days off
        while (daysOff.includes(currentDate.getDay())) {
          currentDate.setDate(currentDate.getDate() + 1);
        }

        const dateStr = currentDate.toISOString().split('T')[0];

        // 1. Study Task
        tasks.push({
          id: taskId++,
          subject,
          chapter: chap.name,
          type: 'Study',
          hours,
          date: dateStr,
          completed: false,
        });

        // Move to next date
        currentDate.setDate(currentDate.getDate() + 1);
        while (daysOff.includes(currentDate.getDay())) {
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // 2. Revision Task
        tasks.push({
          id: taskId++,
          subject,
          chapter: chap.name,
          type: 'Revision',
          hours: 1,
          date: currentDate.toISOString().split('T')[0],
          completed: false,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      });
    });

    const newPlan: SyllabusPlan = {
      subjects,
      chapters,
      examDate,
      priority,
      dailyHours,
      studyTime,
      daysOff,
      tasks,
    };

    localStorage.setItem('studyclub_syllabus', JSON.stringify(newPlan));
    setActivePlan(newPlan);
  };

  const handleToggleTask = (taskId: number) => {
    if (!activePlan) return;
    const updatedTasks = activePlan.tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    const updatedPlan = { ...activePlan, tasks: updatedTasks };
    localStorage.setItem('studyclub_syllabus', JSON.stringify(updatedPlan));
    setActivePlan(updatedPlan);
  };

  const handleClearPlan = () => {
    localStorage.removeItem('studyclub_syllabus');
    setActivePlan(null);
    setStep(1);
    setSubjects([]);
    setChapters({});
  };

  if (activePlan) {
    const totalTasks = activePlan.tasks.length;
    const completedTasks = activePlan.tasks.filter((t) => t.completed).length;
    const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
      <div className="space-y-6">
        <section className="p-8 bg-indigo-50 border border-indigo-100 rounded-2xl flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Your Study Calendar</h2>
            <p className="text-sm text-gray-600 mt-1">
              Complete tasks to stay on track for your exam on {new Date(activePlan.examDate).toLocaleDateString()}
            </p>
          </div>
          <Button variant="danger" size="sm" onClick={handleClearPlan}>
            <i className="fas fa-trash mr-2" /> Clear Plan
          </Button>
        </section>

        {/* Progress stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card>
            <div className="text-2xl font-extrabold text-indigo-600">{pct}%</div>
            <div className="text-[10px] uppercase font-bold text-gray-400 mt-1 tracking-wider">Plan Progress</div>
          </Card>
          <Card>
            <div className="text-2xl font-extrabold text-gray-900">
              {completedTasks} / {totalTasks}
            </div>
            <div className="text-[10px] uppercase font-bold text-gray-400 mt-1 tracking-wider">Tasks Complete</div>
          </Card>
          <Card>
            <div className="text-2xl font-extrabold text-emerald-600">
              {activePlan.dailyHours}h
            </div>
            <div className="text-[10px] uppercase font-bold text-gray-400 mt-1 tracking-wider">Daily Commit</div>
          </Card>
        </div>

        {/* Task Agenda */}
        <Card title="Study Tasks">
          <div className="divide-y divide-gray-100">
            {activePlan.tasks.map((task) => (
              <div key={task.id} className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleTask(task.id)}
                    className="h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <div className={task.completed ? 'line-through text-gray-400' : ''}>
                    <p className="font-bold text-gray-900 text-sm">
                      [{task.type}] {task.subject} - {task.chapter}
                    </p>
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      {task.hours}h • Date: {task.date}
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase ${
                    task.type === 'Study'
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}
                >
                  {task.type}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <Card title={`Syllabus Scheduler - Step ${step} of 5`}>
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Define Study Subjects</h3>
            <p className="text-xs text-gray-500">List all the courses or modules you need to schedule</p>
          </div>

          <div className="flex gap-3">
            <Input
              id="sub-input"
              placeholder="e.g. Calculus, Computer Networks"
              value={subjectInput}
              onChange={(e) => setSubjectInput(e.target.value)}
            />
            <Button variant="primary" onClick={handleAddSubject}>
              Add Subject
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {subjects.map((sub, i) => (
              <span
                key={sub}
                className="bg-indigo-50 border border-indigo-100 text-indigo-600 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2"
              >
                {sub}
                <button onClick={() => handleRemoveSubject(i)} className="text-indigo-400 hover:text-indigo-600">
                  <i className="fas fa-times" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Button variant="primary" disabled={subjects.length === 0} onClick={() => setStep(2)}>
              Next Step
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Outline Chapters / Topics</h3>
            <p className="text-xs text-gray-500">Break down each subject into reviewable chapters</p>
          </div>

          <div className="space-y-6 divide-y divide-gray-100">
            {subjects.map((sub, idx) => (
              <div key={sub} className="pt-4 first:pt-0 space-y-3">
                <h4 className="font-bold text-sm text-gray-800 uppercase tracking-wider">{sub}</h4>
                
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <Input
                      id={`chap-in-${idx}`}
                      placeholder="Chapter name"
                      value={chapterInputs[idx] || ''}
                      onChange={(e) => setChapterInputs({ ...chapterInputs, [idx]: e.target.value })}
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Difficulty</label>
                    <select
                      id={`chap-diff-${idx}`}
                      value={chapterDifficulty[idx] || 'medium'}
                      onChange={(e: any) => setChapterDifficulty({ ...chapterDifficulty, [idx]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-250 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <Button variant="secondary" onClick={() => handleAddChapter(idx)}>
                    Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(chapters[idx] || []).map((chap, cIdx) => (
                    <span
                      key={chap.name}
                      className="bg-gray-100 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2"
                    >
                      {chap.name} ({chap.difficulty})
                      <button onClick={() => handleRemoveChapter(idx, cIdx)} className="text-gray-400 hover:text-gray-600">
                        <i className="fas fa-times" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-6 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button variant="primary" onClick={() => setStep(3)}>
              Next Step
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Goal & Exam Dates</h3>
            <p className="text-xs text-gray-500">Specify when you need to be prepared</p>
          </div>

          <div className="space-y-4">
            <Input
              id="exam-dt"
              label="Exam Date"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Priority</label>
              <select
                id="goal-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-255 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="low">Low Priority (Relaxed studying)</option>
                <option value="medium">Medium Priority (Standard review)</option>
                <option value="high">High Priority (Aggressive preparation)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button variant="primary" disabled={!examDate} onClick={() => setStep(4)}>
              Next Step
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Study Pace Settings</h3>
            <p className="text-xs text-gray-500">Tailor your study frequency</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Daily Study Hours Limit ({dailyHours} hours)
              </label>
              <input
                type="range"
                min={1}
                max={12}
                value={dailyHours}
                onChange={(e) => setDailyHours(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Days Off</label>
              <div className="flex flex-wrap gap-3">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                  <label
                    key={day}
                    className={`px-4 py-2 rounded-xl border text-sm font-bold cursor-pointer transition-all ${
                      daysOff.includes(idx)
                        ? 'bg-rose-50 border-rose-200 text-rose-600'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={daysOff.includes(idx)}
                      onChange={() => handleToggleDayOff(idx)}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setStep(3)}>
              Back
            </Button>
            <Button variant="primary" onClick={() => setStep(5)}>
              Next Step
            </Button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Confirm Study Plan</h3>
            <p className="text-xs text-gray-500">Review your final inputs before calendar generation</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                Total Courses
              </span>
              <span className="text-lg font-extrabold text-gray-800">{subjects.length} Subjects</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                Study Pace
              </span>
              <span className="text-lg font-extrabold text-gray-800">{dailyHours}h / Day</span>
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setStep(4)}>
              Back
            </Button>
            <Button variant="primary" size="lg" onClick={handleGeneratePlan}>
              <i className="fas fa-magic mr-2" /> Generate Study Plan
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
export default SyllabusScheduler;
