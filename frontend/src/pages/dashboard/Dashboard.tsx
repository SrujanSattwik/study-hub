import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/ui/Card';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const stats = [
    { label: 'Materials Accessed', value: '24', icon: 'fas fa-book-open', change: '+12%', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Study Time', value: '18.5h', icon: 'fas fa-clock', change: '+8%', color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Completion Rate', value: '87%', icon: 'fas fa-check-circle', change: '+5%', color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Day Streak', value: '12', icon: 'fas fa-fire', change: 'Active', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const recentMaterials = [
    { title: 'Data Structures', type: 'Textbook', icon: 'fas fa-book text-indigo-500', bg: 'bg-indigo-50/10 text-indigo-600', progress: 75, date: '2 hours ago' },
    { title: 'Machine Learning Basics', type: 'Video', icon: 'fas fa-video text-purple-500', bg: 'bg-purple-50/10 text-purple-600', progress: 45, date: '5 hours ago' },
    { title: 'Calculus Notes', type: 'Notes', icon: 'fas fa-file-alt text-teal-500', bg: 'bg-teal-50/10 text-teal-600', progress: 100, date: '1 day ago' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <section className="p-8 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border border-gray-200 rounded-2xl">
        <h2 className="text-2xl font-extrabold text-gray-900">
          Welcome back, {user?.full_name || 'Student'}! 👋
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Here's what's happening with your learning journey today
        </p>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-36">
            <div className="flex justify-between items-start">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <i className={`${stat.icon} text-lg`} />
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {stat.change}
              </span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-extrabold text-gray-900">{stat.value}</div>
              <div className="text-[10px] uppercase font-bold text-gray-400 mt-1 tracking-wider">
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2" title="Recent Activity">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  <th className="pb-3 font-semibold">Material</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Progress</th>
                  <th className="pb-3 font-semibold">Last Accessed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                {recentMaterials.map((row) => (
                  <tr key={row.title} className="hover:bg-gray-50/50">
                    <td className="py-3.5 flex items-center gap-3 font-semibold text-gray-900">
                      <i className={row.icon} />
                      <span>{row.title}</span>
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${row.bg}`}>
                        {row.type}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600" style={{ width: `${row.progress}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 font-semibold">{row.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-xs text-gray-400 font-semibold">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <div className="flex flex-col gap-4">
            <button
              onClick={() => navigate('/knownook')}
              className="flex items-center gap-3 w-full p-4 border border-gray-200 bg-white rounded-xl font-bold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-all text-sm group"
            >
              <i className="fas fa-robot text-indigo-600 text-lg group-hover:scale-110 transition-transform" />
              <span>Ask AI Assistant</span>
            </button>

            <button
              onClick={() => navigate('/materials')}
              className="flex items-center gap-3 w-full p-4 border border-gray-200 bg-white rounded-xl font-bold text-gray-700 hover:bg-gray-50 hover:text-purple-600 transition-all text-sm group"
            >
              <i className="fas fa-upload text-purple-600 text-lg group-hover:scale-110 transition-transform" />
              <span>Upload Material</span>
            </button>

            <button
              onClick={() => navigate('/syllabus')}
              className="flex items-center gap-3 w-full p-4 border border-gray-200 bg-white rounded-xl font-bold text-gray-700 hover:bg-gray-50 hover:text-teal-600 transition-all text-sm group"
            >
              <i className="fas fa-calendar-plus text-teal-600 text-lg group-hover:scale-110 transition-transform" />
              <span>Syllabus Scheduler</span>
            </button>
          </div>
        </Card>
      </div>

      {/* AI Recommendations Panel */}
      <Card title="AI Insights & Recommendations">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          <div className="space-y-2 pb-6 md:pb-0">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
              <i className="fas fa-chart-line" />
              <span>Study Pattern</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Your focus is highest between 2:00 PM and 5:00 PM. We recommend scheduling complex problem sets during these hours.
            </p>
          </div>

          <div className="space-y-2 pt-6 md:pt-0 md:pl-6">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
              <i className="fas fa-bullseye" />
              <span>Suggested Groups</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Based on your calculus activity, you might benefit from joining the **Advanced Math Club** to study for upcoming midterms.
            </p>
          </div>

          <div className="space-y-2 pt-6 md:pt-0 md:pl-6">
            <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
              <i className="fas fa-lightbulb" />
              <span>Tip of the Day</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Try the Pomodoro technique (25 min study, 5 min break) to optimize your notes reading session today.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
export default Dashboard;
