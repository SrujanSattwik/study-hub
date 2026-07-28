import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import InternalFooter from '../components/shared/InternalFooter';

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
    <div className="h-screen w-screen bg-[#F8FAFC] flex overflow-hidden font-body text-[14px]">
      {/* Top Workspace System Header Bar */}
      <div className="fixed top-0 left-0 right-0 h-10 bg-slate-900 text-white text-[11px] font-bold px-6 flex items-center justify-between z-40 select-none shadow-sm">
        <div className="flex items-center gap-6">
          <span className="uppercase tracking-widest text-slate-300 font-heading">
            <i className="fas fa-layer-group text-[#06B6D4] mr-2" />
            STUDYHUB WORKSPACE
          </span>
          <span className="text-slate-500 font-normal">|</span>
          <span className="text-slate-400 font-medium">GLOBAL DASHBOARD</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-slate-300">
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-[#6366F1]" />
            <span>Color: Slate Iris <code className="text-indigo-300">#6366F1</code></span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-[#06B6D4]" />
            <span>Accent: Cyan Pulse <code className="text-cyan-300">#06B6D4</code></span>
          </div>
          <div className="bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700 font-mono text-slate-300">
            July 28, 2026
          </div>
        </div>
      </div>

      {/* Main Container below top workspace banner */}
      <div className="flex-1 flex overflow-hidden pt-10">
        {/* Sidebar */}
        <aside
          className={`bg-white border-r border-slate-200/80 flex flex-col transition-all duration-300 z-30 h-full shrink-0 shadow-sm ${
            isSidebarOpen ? 'w-64 md:w-72' : 'w-[70px]'
          }`}
        >
          {/* Logo */}
          <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between shrink-0">
            <Link to="/dashboard" className="flex items-center gap-3 font-bold text-[#6366F1] select-none">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] text-white flex items-center justify-center text-lg font-black shadow-md shadow-indigo-500/20 shrink-0">
                <i className="fas fa-shapes" />
              </div>
              {isSidebarOpen && (
                <span className="text-gray-900 text-lg font-bold font-heading tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                  StudyHub
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 hidden md:block transition-colors shrink-0"
            >
              <i className={`fas ${isSidebarOpen ? 'fa-angle-left' : 'fa-angle-right'} text-sm`} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = activePath === item.path;
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center h-12 px-4 rounded-xl text-[16px] font-medium transition-all select-none relative group ${
                    isActive
                      ? 'bg-[#6366F1]/10 text-[#6366F1] font-bold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  title={item.name}
                >
                  {isActive && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#6366F1] rounded-r-full" />
                  )}
                  {/* Fixed width icon container */}
                  <div className="w-6 flex items-center justify-center shrink-0">
                    <i className={`${item.icon} text-[18px] ${isActive ? 'text-[#6366F1]' : 'text-slate-400 group-hover:text-slate-700'} transition-colors`} />
                  </div>
                  {isSidebarOpen && (
                    <span className="ml-3.5 truncate whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.name}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Card / Logout */}
          <div className="p-4 border-t border-slate-100 space-y-3 shrink-0 bg-slate-50/50">
            {isSidebarOpen && user && (
              <div className="flex items-center gap-3 px-2 py-1 bg-white p-2 rounded-xl border border-slate-200/60 shadow-xs">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-bold text-gray-900 truncate leading-none">
                    {user.full_name}
                  </p>
                  <span className="text-[10px] uppercase font-bold text-[#6366F1] tracking-wider mt-1 block">
                    {user.role}
                  </span>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center h-11 px-4 rounded-xl text-[14px] font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors select-none"
              title="Log Out"
            >
              <div className="w-6 flex items-center justify-center shrink-0">
                <i className="fas fa-sign-out-alt text-[16px] text-rose-500" />
              </div>
              {isSidebarOpen && (
                <span className="ml-3.5 whitespace-nowrap overflow-hidden text-ellipsis">
                  Logout
                </span>
              )}
            </button>
          </div>
        </aside>

        {/* Main Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium select-none">
                <Link to="/dashboard" className="hover:text-[#6366F1] transition-colors">Workspace</Link>
                <span>/</span>
                <span className="text-slate-900 font-bold">{getHeaderTitle()}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Search Box Trigger */}
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="hidden sm:flex items-center gap-3 px-4 py-2 w-64 md:w-80 lg:w-96 text-left border border-slate-200 hover:border-[#6366F1]/40 bg-slate-50 hover:bg-white rounded-xl text-slate-400 text-sm font-normal transition-all select-none shadow-xs"
              >
                <i className="fas fa-search text-sm text-slate-400" />
                <span>Search...</span>
                <kbd className="ml-auto text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-xs text-slate-400 font-mono">
                  ⌘K
                </kbd>
              </button>

              {/* Notifications Center */}
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative h-10 w-10 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all focus:outline-none"
                >
                  <i className="fas fa-bell text-base" />
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-4.5 z-50 space-y-3.5 animate-scale-in">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Notifications</span>
                      <button
                        onClick={() => setIsNotificationsOpen(false)}
                        className="text-[11px] text-[#6366F1] font-bold hover:underline"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      <div className="p-3 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 transition-all space-y-1">
                        <p className="text-xs font-bold text-gray-900 leading-tight">Calculus study session starting soon</p>
                        <p className="text-[10px] text-slate-400 font-medium">Room A • starting in 5 minutes</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all space-y-1">
                        <p className="text-xs font-bold text-gray-800 leading-tight">New Materials Uploaded</p>
                        <p className="text-[10px] text-slate-400 font-medium">Data Structures Textbook • 2h ago</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar Dropdown */}
              {user && (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-50 border border-slate-200/80 transition-all focus:outline-none"
                  >
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <i className="fas fa-chevron-down text-[10px] text-slate-400 px-1" />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2.5 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 space-y-3 animate-scale-in">
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-gray-900 truncate leading-none">{user.full_name}</p>
                          <p className="text-[10px] text-slate-400 truncate mt-1 leading-none">{user.email}</p>
                          <span className="mt-1.5 inline-block text-[9px] font-bold uppercase bg-indigo-50 border border-indigo-100 text-[#6366F1] px-2 py-0.5 rounded-md">
                            {user.role}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            navigate('/dashboard');
                          }}
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all text-left"
                        >
                          <i className="fas fa-chart-pie text-slate-400 text-sm w-4 text-center" />
                          <span>Dashboard</span>
                        </button>

                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            navigate('/knownook');
                          }}
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all text-left"
                        >
                          <i className="fas fa-robot text-slate-400 text-sm w-4 text-center" />
                          <span>KnowNook AI</span>
                        </button>

                        <div className="border-t border-slate-100 my-1.5 pt-1.5">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all text-left"
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
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex flex-col">
            <div className="w-full flex-1 flex flex-col justify-between gap-8">
              <div className="flex-1 flex flex-col">
                <Outlet />
              </div>
              <InternalFooter />
            </div>
          </main>
        </div>
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
