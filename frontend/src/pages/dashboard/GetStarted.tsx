import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';

export const GetStarted: React.FC = () => {
  const navigate = useNavigate();

  const onboardingSteps = [
    { title: 'Browse Materials', desc: 'Find textbooks, video lectures, and study notes.', status: 'completed', path: '/materials', icon: 'fas fa-check-circle' },
    { title: 'Join Study Groups', desc: 'Connect with study spaces and check upcoming schedules.', status: 'active', path: '/community', icon: 'fas fa-spinner' },
    { title: 'Schedule Syllabus', desc: 'Generate custom study plans and timelines.', status: 'todo', path: '/syllabus', icon: 'fas fa-circle' },
  ];

  const studyTools = [
    {
      title: 'Syllabus Scheduler',
      description: 'Create smart study schedules and manage syllabus completion.',
      icon: 'fas fa-tasks',
      actionText: 'Open Scheduler',
      status: 'Available',
      path: '/syllabus',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      title: 'KnowNook AI',
      description: 'Crowdsourced Q&A section with Gemini AI for instant doubt resolution.',
      icon: 'fas fa-comments',
      actionText: 'Open Chat',
      status: 'Available',
      path: '/knownook',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'StudyBite',
      description: '5-minute daily challenges for niche academic topics, stored locally.',
      icon: 'fas fa-fire',
      status: 'Coming Soon',
      color: 'text-gray-400',
      bg: 'bg-gray-100',
    },
    {
      title: 'Cheat Notes',
      description: 'Simple note-taking tool for quick, shareable study notes.',
      icon: 'fas fa-sticky-note',
      status: 'Coming Soon',
      color: 'text-gray-400',
      bg: 'bg-gray-100',
    },
  ];

  const collabTools = [
    {
      title: 'StudySync',
      description: 'Real-time group study planner with shared calendars and resource pools.',
      icon: 'fas fa-sync-alt',
      status: 'Coming Soon',
      color: 'text-gray-400',
      bg: 'bg-gray-100',
    },
    {
      title: 'Timetable Creation',
      description: 'Drag-and-drop timetable builder for individual or group schedules.',
      icon: 'fas fa-calendar-alt',
      status: 'Coming Soon',
      color: 'text-gray-400',
      bg: 'bg-gray-100',
    },
  ];

  const creativeTools = [
    {
      title: 'MindMesh',
      description: 'Visual brainstorming tool using a canvas-based library for concept mapping.',
      icon: 'fas fa-project-diagram',
      status: 'Coming Soon',
      color: 'text-gray-400',
      bg: 'bg-gray-100',
    },
  ];

  const renderCard = (tool: any) => {
    const isAvailable = tool.status === 'Available';
    return (
      <Card
        key={tool.title}
        title={tool.title}
        icon={tool.icon}
        className={`flex flex-col justify-between h-56 border border-slate-200 transition-all duration-300 relative overflow-hidden ${
          isAvailable ? 'hover:border-indigo-300 hover:shadow-md cursor-pointer group' : 'opacity-65 select-none'
        }`}
        onClick={isAvailable && tool.path ? () => navigate(tool.path) : undefined}
      >
        <div className="flex-1 flex flex-col justify-between h-full">
          <p className="text-xs text-gray-500 leading-relaxed mt-1">
            {tool.description}
          </p>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <span
              className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                isAvailable
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-slate-150 text-gray-400'
              }`}
            >
              {tool.status}
            </span>
            {isAvailable && (
              <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform uppercase tracking-wider text-[10px]">
                {tool.actionText} <i className="fas fa-chevron-right text-[9px]" />
              </span>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Welcome Banner */}
      <section className="p-8 bg-white border border-slate-200 rounded-2xl relative overflow-hidden shadow-sm">
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-indigo-50 blur-3xl opacity-50" />
        <h2 className="text-2xl font-extrabold text-gray-900 font-heading tracking-tight">
          Feature Hub
        </h2>
        <p className="text-xs text-gray-400 font-semibold mt-1">
          Explore and launch all available tools and upcoming features to boost your studies.
        </p>
      </section>

      {/* Interactive Onboarding Progress Stepper */}
      <section className="space-y-4">
        <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">Onboarding Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          {onboardingSteps.map((step, idx) => (
            <div
              key={step.title}
              onClick={() => navigate(step.path)}
              className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors relative group"
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                step.status === 'completed' 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : step.status === 'active'
                    ? 'bg-indigo-50 text-indigo-600 animate-pulse'
                    : 'bg-slate-100 text-gray-400'
              }`}>
                <i className={`${step.icon} text-sm`} />
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black text-gray-400">0{idx + 1}.</span>
                  <h4 className="text-xs font-extrabold text-gray-900 leading-none group-hover:text-indigo-600 transition-colors">
                    {step.title}
                  </h4>
                </div>
                <p className="text-[10px] text-gray-400 font-semibold mt-1.5 leading-normal">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Study Tools Section */}
      <section className="space-y-4">
        <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <i className="fas fa-tools text-indigo-500" />
          Study Tools
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {studyTools.map(renderCard)}
        </div>
      </section>

      {/* Collaboration Tools Section */}
      <section className="space-y-4">
        <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <i className="fas fa-users text-purple-500" />
          Collaboration Tools
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {collabTools.map(renderCard)}
        </div>
      </section>

      {/* Creative Tools Section */}
      <section className="space-y-4">
        <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <i className="fas fa-palette text-amber-500" />
          Creative Tools
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {creativeTools.map(renderCard)}
        </div>
      </section>
    </div>
  );
};

export default GetStarted;
