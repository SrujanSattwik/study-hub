import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'fas fa-chart-pie' },
    { name: 'Get Started', path: '/get-started', icon: 'fas fa-rocket' },
    { name: 'Materials', path: '/materials', icon: 'fas fa-book' },
    { name: 'Resources', path: '/resources', icon: 'fas fa-globe' },
    { name: 'Community', path: '/community', icon: 'fas fa-users' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getHeaderTitle = () => {
    const activePath = location.pathname;
    const item = menuItems.find((m) => m.path === activePath);
    if (item) return item.name;
    if (activePath === '/syllabus') return 'Syllabus Scheduler';
    if (activePath === '/subscription') return 'Membership / Settings';
    if (activePath === '/knownook') return 'KnowNook AI Chat';
    return 'StudyClub';
  };

  const activePath = location.pathname;

  return (
    <div className="h-screen w-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-gray-150 flex flex-col transition-all duration-300 z-30 h-full shrink-0 ${
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
        <header className="h-16 bg-white border-b border-gray-150 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-gray-900">
              {getHeaderTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Badges */}
            <div className="h-8 px-3.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full text-xs font-bold flex items-center gap-1.5">
              <i className="fas fa-certificate text-xs" />
              <span>Pro Student</span>
            </div>

            {/* Profile Dropdown */}
            {user && (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2.5 p-1.5 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all focus:outline-none"
                >
                  <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 font-extrabold text-xs flex items-center justify-center">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-gray-700 hidden sm:block">
                    {user.full_name}
                  </span>
                  <i className="fas fa-chevron-down text-[10px] text-gray-400 hidden sm:block" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-150 rounded-2xl shadow-xl p-4 z-50 space-y-3.5">
                    {/* User Details */}
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                      <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 font-extrabold text-sm flex items-center justify-center shrink-0">
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-gray-900 truncate leading-tight">{user.full_name}</p>
                        <p className="text-[11px] text-gray-400 truncate leading-normal">{user.email}</p>
                        <span className="mt-1 inline-block text-[9px] font-extrabold tracking-wider uppercase bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                          {user.role}
                        </span>
                      </div>
                    </div>

                    {/* Navigation Options */}
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('/dashboard');
                        }}
                        className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all text-left"
                      >
                        <i className="fas fa-chart-pie text-gray-400 text-sm w-4 text-center" />
                        <span>Dashboard</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('/get-started');
                        }}
                        className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all text-left"
                      >
                        <i className="fas fa-rocket text-gray-400 text-sm w-4 text-center" />
                        <span>Get Started</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('/subscription');
                        }}
                        className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all text-left"
                      >
                        <i className="fas fa-cog text-gray-400 text-sm w-4 text-center" />
                        <span>Settings</span>
                      </button>

                      <div className="border-t border-gray-100 my-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all text-left"
                        >
                          <i className="fas fa-sign-out-alt text-rose-500 text-sm w-4 text-center" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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
