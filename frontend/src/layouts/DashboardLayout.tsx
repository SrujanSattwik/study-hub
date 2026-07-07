import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState('');

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'fas fa-chart-pie' },
    { name: 'Get Started', path: '/get-started', icon: 'fas fa-rocket' },
    { name: 'Materials', path: '/materials', icon: 'fas fa-book' },
    { name: 'Resources', path: '/resources', icon: 'fas fa-globe' },
    { name: 'Community', path: '/community', icon: 'fas fa-users' },
  ];

  const paletteItems = [
    { name: 'Dashboard Workspace', path: '/dashboard', icon: 'fas fa-chart-pie', description: 'View analytics, stats, and recent study materials.' },
    { name: 'Get Started Onboarding', path: '/get-started', icon: 'fas fa-rocket', description: 'Interactive onboarding wizard and Scheduler.' },
    { name: 'Materials Hub', path: '/materials', icon: 'fas fa-book', description: 'Browse, filter, and upload academic notes & textbooks.' },
    { name: 'Resources Marketplace', path: '/resources', icon: 'fas fa-globe', description: 'Discover study apps and online courses.' },
    { name: 'Community Workspace', path: '/community', icon: 'fas fa-users', description: 'Connect with peers, chat in rooms, and view schedules.' },
    { name: 'KnowNook AI Assistant', path: '/knownook', icon: 'fas fa-robot', description: 'Interact with AI to answer study questions.' },
    { name: 'Syllabus Scheduler', path: '/syllabus', icon: 'fas fa-calendar-alt', description: 'Automated study schedule generator.' },
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
    if (activePath === '/subscription') return 'Membership Settings';
    if (activePath === '/knownook') return 'KnowNook AI Chat';
    return 'StudyClub';
  };

  const activePath = location.pathname;

  const filteredPaletteItems = paletteItems.filter(
    (item) =>
      item.name.toLowerCase().includes(paletteSearch.toLowerCase()) ||
      item.description.toLowerCase().includes(paletteSearch.toLowerCase())
  );

  return (
    <div className="h-screen w-screen bg-slate-50 flex overflow-hidden font-body text-[14px]">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-30 h-full shrink-0 ${
          isSidebarOpen ? 'w-72' : 'w-[70px]'
        }`}
      >
        {/* Logo */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <Link to="/dashboard" className="flex items-center gap-3 font-extrabold text-indigo-600 select-none">
            <i className="fas fa-graduation-cap text-2xl text-indigo-600 shrink-0" />
            {isSidebarOpen && (
              <span className="text-gray-900 text-sm tracking-tight font-heading font-black whitespace-nowrap overflow-hidden text-ellipsis">
                StudyClub
              </span>
            )}
          </Link>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600 hidden md:block transition-colors shrink-0"
          >
            <i className={`fas ${isSidebarOpen ? 'fa-angle-left' : 'fa-angle-right'} text-sm`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = activePath === item.path;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center h-[46px] px-4 rounded-xl text-[14px] font-medium transition-all select-none relative group ${
                  isActive
                    ? 'bg-indigo-50/50 text-indigo-600 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={item.name}
              >
                {isActive && (
                  <div className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-indigo-600 rounded-r" />
                )}
                {/* Fixed width icon container to align texts perfectly */}
                <div className="w-5 flex items-center justify-center shrink-0">
                  <i className={`${item.icon} text-[16px] ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'} transition-colors`} />
                </div>
                {isSidebarOpen && (
                  <span className="ml-[14px] truncate whitespace-nowrap overflow-hidden text-ellipsis">
                    {item.name}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card / Logout */}
        <div className="p-3.5 border-t border-slate-100 space-y-3 shrink-0">
          {isSidebarOpen && user && (
            <div className="flex items-center gap-3 px-2 py-1.5">
              <div className="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-extrabold text-gray-900 truncate leading-none whitespace-nowrap overflow-hidden text-ellipsis">
                  {user.full_name}
                </p>
                <span className="text-[9px] uppercase font-black text-gray-400 tracking-widest mt-1 block">
                  {user.role}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center h-[46px] px-4 rounded-xl text-[14px] font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors select-none"
            title="Log Out"
          >
            <div className="w-5 flex items-center justify-center shrink-0">
              <i className="fas fa-sign-out-alt text-[16px] text-rose-500" />
            </div>
            {isSidebarOpen && (
              <span className="ml-[14px] whitespace-nowrap overflow-hidden text-ellipsis">
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-extrabold uppercase tracking-wider select-none">
              <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">Workspace</Link>
              <span>/</span>
              <span className="text-gray-900">{getHeaderTitle()}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Trigger */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-3 px-3.5 py-2 w-64 md:w-80 lg:w-96 text-left border border-slate-200 hover:border-slate-350 bg-slate-50/50 hover:bg-slate-50 rounded-xl text-gray-400 text-xs font-semibold transition-all select-none"
            >
              <i className="fas fa-search text-xs text-gray-400" />
              <span>Search workspace...</span>
              <kbd className="ml-auto text-[9px] bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm text-gray-400 font-sans font-semibold uppercase tracking-tight">
                ⌘K
              </kbd>
            </button>

            {/* Quick Badges */}
            <div className="h-8 px-3.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 select-none shadow-sm">
              <i className="fas fa-certificate text-xs" />
              <span>Pro Student</span>
            </div>

            {/* Notifications Center */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-gray-400 hover:text-gray-600 transition-all focus:outline-none"
              >
                <i className="fas fa-bell text-sm" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 border-2 border-white text-[8px] font-black text-white flex items-center justify-center">
                  2
                </span>
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-4.5 z-50 space-y-3.5 animate-scale-in">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-[10px] font-extrabold text-gray-900 uppercase tracking-widest">Notifications</span>
                    <button
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-[10px] text-indigo-600 font-extrabold hover:underline uppercase"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <div className="p-3 rounded-xl bg-indigo-50/50 hover:bg-indigo-50/75 border border-indigo-100/50 transition-all space-y-1">
                      <p className="text-xs font-extrabold text-gray-900 leading-tight">Calculus study session starting soon</p>
                      <p className="text-[10px] text-gray-400 font-semibold">Room A • starting in 5 minutes</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all space-y-1">
                      <p className="text-xs font-extrabold text-gray-800 leading-tight">New Materials Uploaded</p>
                      <p className="text-[10px] text-gray-400 font-semibold">Data Structures Textbook • 2h ago</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            {user && (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2.5 p-1 rounded-full hover:bg-gray-50 border border-transparent hover:border-slate-200 transition-all focus:outline-none"
                >
                  <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-extrabold text-xs flex items-center justify-center">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-extrabold text-gray-700 hidden sm:block">
                    {user.full_name}
                  </span>
                  <i className="fas fa-chevron-down text-[9px] text-gray-400 hidden sm:block" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2.5 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 space-y-3 animate-scale-in">
                    {/* User Details */}
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-extrabold text-sm flex items-center justify-center shrink-0">
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-extrabold text-gray-900 truncate leading-none">{user.full_name}</p>
                        <p className="text-[10px] text-gray-400 truncate mt-1 leading-none">{user.email}</p>
                        <span className="mt-1.5 inline-block text-[8px] font-black tracking-widest uppercase bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
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
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-slate-50 hover:text-gray-900 transition-all text-left"
                      >
                        <i className="fas fa-chart-pie text-gray-400 text-sm w-4 text-center" />
                        <span>Dashboard</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('/get-started');
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-slate-50 hover:text-gray-900 transition-all text-left"
                      >
                        <i className="fas fa-rocket text-gray-400 text-sm w-4 text-center" />
                        <span>Get Started</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('/subscription');
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-slate-50 hover:text-gray-900 transition-all text-left"
                      >
                        <i className="fas fa-cog text-gray-400 text-sm w-4 text-center" />
                        <span>Settings</span>
                      </button>

                      <div className="border-t border-slate-100 my-1.5 pt-1.5">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all text-left"
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

        {/* Content Outlet (Occupies 100% of workspace width, removes max-width limits) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Command Palette */}
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 animate-fade-in">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsCommandPaletteOpen(false)}
          />
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-scale-in">
            <div className="flex items-center gap-3.5 px-4.5 py-3 border-b border-slate-100 bg-slate-50/50">
              <i className="fas fa-search text-gray-400 text-sm" />
              <input
                type="text"
                value={paletteSearch}
                onChange={(e) => setPaletteSearch(e.target.value)}
                placeholder="Search tools, materials, settings..."
                className="w-full bg-transparent border-0 text-sm focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-400"
                autoFocus
              />
              <button
                onClick={() => setIsCommandPaletteOpen(false)}
                className="text-[10px] text-gray-400 border border-slate-200 px-1.5 py-0.5 rounded shadow-sm hover:bg-gray-100"
              >
                ESC
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {filteredPaletteItems.length > 0 ? (
                filteredPaletteItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => {
                      setIsCommandPaletteOpen(false);
                      setPaletteSearch('');
                      navigate(item.path);
                    }}
                    className="flex items-start gap-4 w-full p-3.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <i className={item.icon} />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-gray-900 leading-none">{item.name}</h4>
                      <p className="text-[10px] text-gray-400 mt-1 font-semibold leading-normal">{item.description}</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-gray-400">
                  No matching workspace actions found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
