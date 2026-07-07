import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';

export const GetStarted: React.FC = () => {
  const navigate = useNavigate();

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
        className={`flex flex-col justify-between h-56 border border-gray-200 transition-all ${
          isAvailable ? 'hover:border-indigo-300 ring-indigo-600/5 hover:ring-2' : 'opacity-75'
        }`}
        onClick={isAvailable && tool.path ? () => navigate(tool.path) : undefined}
      >
        <div className="flex-1 flex flex-col justify-between">
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
            {tool.description}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isAvailable
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {tool.status}
            </span>
            {isAvailable && (
              <span className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                {tool.actionText} <i className="fas fa-chevron-right text-[10px]" />
              </span>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <section className="p-8 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border border-gray-200 rounded-2xl">
        <h2 className="text-2xl font-extrabold text-gray-900">
          Get Started with StudyClub Tools 🚀
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Explore and launch all available tools and upcoming features to boost your studies.
        </p>
      </section>

      {/* Study Tools Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <i className="fas fa-tools text-indigo-600" />
          Study Tools
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {studyTools.map(renderCard)}
        </div>
      </section>

      {/* Collaboration Tools Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <i className="fas fa-users text-purple-600" />
          Collaboration Tools
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {collabTools.map(renderCard)}
        </div>
      </section>

      {/* Creative Tools Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
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
