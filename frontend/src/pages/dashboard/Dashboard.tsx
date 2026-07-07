import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const stats = [
    { label: 'Materials Accessed', value: '24', icon: 'fas fa-book-open', change: '+12%', color: 'text-indigo-600', bg: 'bg-indigo-50/70', border: 'border-indigo-100' },
    { label: 'Study Time', value: '18.5h', icon: 'fas fa-clock', change: '+8%', color: 'text-purple-600', bg: 'bg-purple-50/70', border: 'border-purple-100' },
    { label: 'Completion Rate', value: '87%', icon: 'fas fa-check-circle', change: '+5%', color: 'text-teal-600', bg: 'bg-teal-50/70', border: 'border-teal-100' },
    { label: 'Day Streak', value: '12', icon: 'fas fa-fire', change: 'Active', color: 'text-emerald-600', bg: 'bg-emerald-50/70', border: 'border-emerald-100' },
  ];

  const recentMaterials = [
    { title: 'Data Structures', type: 'Textbook', icon: 'fas fa-book text-indigo-500', bg: 'bg-indigo-50/50 text-indigo-600', progress: 75, date: '2 hours ago' },
    { title: 'Machine Learning Basics', type: 'Video', icon: 'fas fa-video text-purple-500', bg: 'bg-purple-50/50 text-purple-600', progress: 45, date: '5 hours ago' },
    { title: 'Calculus Notes', type: 'Notes', icon: 'fas fa-file-alt text-teal-500', bg: 'bg-teal-50/50 text-teal-600', progress: 100, date: '1 day ago' },
  ];

  const timelineEvents = [
    { id: '1', title: 'Calculus Quiz Prepared', desc: 'Syllabus Scheduler processed exam criteria.', time: '1 hour ago', icon: 'fas fa-calendar-check', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: '2', title: 'Joined Programming Study Group', desc: 'Collaborating on programming languages.', time: 'Yesterday', icon: 'fas fa-users-cog', color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: '3', title: 'Downloaded Chemistry Syllabus', desc: 'Materials Hub tracked transaction.', time: '3 days ago', icon: 'fas fa-file-download', color: 'text-teal-600', bg: 'bg-teal-50' }
  ];

  return (
    <div className="space-y-6 animate-slide-up w-full">
      {/* Welcome Section */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 flex justify-between items-center flex-wrap gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-indigo-50 blur-3xl opacity-50" />
        <div className="relative">
          <h2 className="text-[28px] font-bold text-gray-900 tracking-tight leading-tight font-heading">
            Welcome back, {user?.full_name || 'Student'}! 👋
          </h2>
          <p className="text-[14px] text-gray-500 mt-1">
            Here is what is happening with your learning journey today.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate('/get-started')} className="relative z-10 shrink-0">
          View Onboarding <i className="fas fa-arrow-right ml-1.5 text-xs" />
        </Button>
      </section>

      {/* Stats Grid - 4 equal columns */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`bg-white border ${stat.border} rounded-2xl p-6 shadow-sm flex flex-col justify-between h-36 hover:border-indigo-250 transition-all duration-200`}
          >
            <div className="flex justify-between items-start">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} border border-slate-100`}>
                <i className={`${stat.icon} text-[15px]`} />
              </div>
              <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {stat.change}
              </span>
            </div>
            <div className="mt-4">
              <div className="text-[24px] font-bold text-gray-900 font-heading leading-none">{stat.value}</div>
              <div className="text-[10px] uppercase font-black text-gray-400 mt-2 tracking-widest">
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Split Panels: 70% Left / 30% Right */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
        {/* LEFT COLUMN - 70% */}
        <div className="lg:col-span-7 space-y-6">
          {/* Analytics Chart */}
          <Card title="Weekly Study Activity" subtitle="Learning hours per day">
            <div className="flex gap-4 h-52 items-stretch mt-4">
              {/* Y-axis Labels */}
              <div className="flex flex-col justify-between text-[11px] font-semibold text-gray-400 w-6 shrink-0 select-none pb-6 text-right">
                <span>8h</span>
                <span>6h</span>
                <span>4h</span>
                <span>2h</span>
                <span>0h</span>
              </div>
              
              {/* Chart Canvas Area */}
              <div className="flex-1 flex flex-col justify-between relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="hours-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.1"/>
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  {/* Grid Lines */}
                  <line x1="0" y1="0" x2="500" y2="0" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="25" x2="500" y2="25" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="75" x2="500" y2="75" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="100" x2="500" y2="100" stroke="#cbd5e1" strokeWidth="1.5" />

                  {/* Filled Area with Straight lines */}
                  <path
                    d="M 10 75 L 90 43.75 L 170 62.5 L 250 25 L 330 81.25 L 410 37.5 L 490 0 L 490 100 L 10 100 Z"
                    fill="url(#hours-grad)"
                  />

                  {/* Proportional Line Path (Linear, not wavy) */}
                  <path
                    d="M 10 75 L 90 43.75 L 170 62.5 L 250 25 L 330 81.25 L 410 37.5 L 490 0"
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Anchors */}
                  <circle cx="10" cy="75" r="3.5" fill="#ffffff" stroke="#4f46e5" strokeWidth="2" />
                  <circle cx="90" cy="43.75" r="3.5" fill="#ffffff" stroke="#4f46e5" strokeWidth="2" />
                  <circle cx="170" cy="62.5" r="3.5" fill="#ffffff" stroke="#4f46e5" strokeWidth="2" />
                  <circle cx="250" cy="25" r="3.5" fill="#ffffff" stroke="#4f46e5" strokeWidth="2" />
                  <circle cx="330" cy="81.25" r="3.5" fill="#ffffff" stroke="#4f46e5" strokeWidth="2" />
                  <circle cx="410" cy="37.5" r="3.5" fill="#ffffff" stroke="#4f46e5" strokeWidth="2" />
                  <circle cx="490" cy="0" r="3.5" fill="#ffffff" stroke="#4f46e5" strokeWidth="2" />
                </svg>

                {/* X-axis Labels */}
                <div className="flex justify-between text-[11px] font-semibold text-gray-400 mt-2 select-none uppercase tracking-wider">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Recent Activity Table */}
          <Card title="Accessed Resources" subtitle="Study materials downloaded recently">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase font-black text-gray-400 tracking-wider">
                    <th className="pb-3">Material</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Progress</th>
                    <th className="pb-3">Accessed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[14px] text-gray-700">
                  {recentMaterials.map((row) => (
                    <tr key={row.title} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 flex items-center gap-3 font-semibold text-gray-900">
                        <i className={row.icon} />
                        <span>{row.title}</span>
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${row.bg}`}>
                          {row.type}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600" style={{ width: `${row.progress}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-500 font-extrabold">{row.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-xs text-gray-400 font-bold">{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN - 30% */}
        <div className="lg:col-span-3 space-y-6">
          {/* Quick Actions Panel */}
          <Card title="Quick Actions">
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/knownook')}
                className="flex items-center justify-between w-full p-4 border border-slate-200 bg-white rounded-2xl font-bold text-xs text-gray-700 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm transition-all group uppercase tracking-wider"
              >
                <div className="flex items-center gap-3">
                  <i className="fas fa-robot text-indigo-600 text-base" />
                  <span>Ask AI Assistant</span>
                </div>
                <i className="fas fa-arrow-right text-[10px] text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
              </button>

              <button
                onClick={() => navigate('/materials')}
                className="flex items-center justify-between w-full p-4 border border-slate-200 bg-white rounded-2xl font-bold text-xs text-gray-700 hover:border-purple-300 hover:text-purple-600 hover:shadow-sm transition-all group uppercase tracking-wider"
              >
                <div className="flex items-center gap-3">
                  <i className="fas fa-upload text-purple-600 text-base" />
                  <span>Upload Material</span>
                </div>
                <i className="fas fa-arrow-right text-[10px] text-gray-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
              </button>

              <button
                onClick={() => navigate('/syllabus')}
                className="flex items-center justify-between w-full p-4 border border-slate-200 bg-white rounded-2xl font-bold text-xs text-gray-700 hover:border-teal-300 hover:text-teal-600 hover:shadow-sm transition-all group uppercase tracking-wider"
              >
                <div className="flex items-center gap-3">
                  <i className="fas fa-calendar-plus text-teal-600 text-base" />
                  <span>Study Scheduler</span>
                </div>
                <i className="fas fa-arrow-right text-[10px] text-gray-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </Card>

          {/* Activity Timeline */}
          <Card title="Activity Timeline" subtitle="Logs of recent workspace changes">
            <div className="relative pl-4 border-l border-slate-100 space-y-5 mt-2">
              {timelineEvents.map((ev) => (
                <div key={ev.id} className="relative">
                  <div className={`absolute -left-[25px] top-0 h-4.5 w-4.5 rounded-full border-2 border-white flex items-center justify-center ${ev.bg} ${ev.color} shadow-sm`}>
                    <i className={`${ev.icon} text-[8px]`} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 leading-none">{ev.title}</h4>
                    <p className="text-[10px] text-gray-400 font-semibold mt-1 leading-normal">{ev.desc}</p>
                    <span className="text-[9px] font-bold text-gray-400 uppercase mt-1.5 block tracking-widest">
                      {ev.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
