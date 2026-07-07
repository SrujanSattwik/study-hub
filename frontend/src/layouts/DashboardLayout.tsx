import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'fas fa-chart-pie' },
    { name: 'Syllabus Scheduler', path: '/syllabus', icon: 'fas fa-calendar-alt' },
    { name: 'Materials Hub', path: '/materials', icon: 'fas fa-book' },
    { name: 'Community Workspace', path: '/community', icon: 'fas fa-users' },
    { name: 'KnowNook AI Chat', path: '/knownook', icon: 'fas fa-brain' },
    { name: 'Membership / Settings', path: '/subscription', icon: 'fas fa-cog' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const activePath = location.pathname;

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-gray-150 flex flex-col transition-all duration-300 z-30 ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="h-16 px-6 border-b border-gray-150 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 font-extrabold text-indigo-600">
            <i className="fas fa-graduation-cap text-2xl" />
            {isSidebarOpen && <span className="text-gray-900 text-sm tracking-tight">StudyClub</span>}
          </Link>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hidden md:block"
          >
            <i className={`fas ${isSidebarOpen ? 'fa-angle-left' : 'fa-angle-right'} text-sm`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = activePath === item.path;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                title={item.name}
              >
                <i className={`${item.icon} text-lg ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                {isSidebarOpen && <span className="truncate">{item.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Card / Logout */}
        <div className="p-4 border-t border-gray-150 space-y-3">
          {isSidebarOpen && user && (
            <div className="flex items-center gap-3 px-2 py-1.5">
              <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 font-extrabold text-sm flex items-center justify-center">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold text-gray-900 truncate leading-none">{user.full_name}</p>
                <span className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider">
                  {user.role}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors`}
            title="Log Out"
          >
            <i className="fas fa-sign-out-alt text-lg text-rose-500" />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-150 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-gray-900">
              {menuItems.find((m) => m.path === activePath)?.name || 'StudyClub'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Badges */}
            <div className="h-8 px-3.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full text-xs font-bold flex items-center gap-1.5">
              <i className="fas fa-certificate text-xs" />
              <span>Pro Student</span>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
