import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-6 bg-gradient-to-br from-indigo-50/40 to-purple-50/40">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
                Your Learning Journey <br />
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Starts Here
                </span>
              </h1>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-lg">
                Discover a peaceful space designed for focused learning. Join thousands of students who have found their perfect study environment.
              </p>
              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
                  className="bg-indigo-600 text-white px-8 py-3.5 rounded-full font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  Get Started
                </button>
                <button
                  onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
                  className="bg-white border border-gray-250 text-gray-800 px-8 py-3.5 rounded-full font-bold text-sm hover:bg-gray-50 transition-all shadow-sm"
                >
                  Dashboard
                </button>
              </div>
            </div>
            
            {/* Cards Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div
                onClick={() => navigate('/materials')}
                className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-3 group"
              >
                <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <i className="fas fa-book text-xl" />
                </div>
                <span className="font-bold text-gray-800 text-sm">Study Materials</span>
              </div>
              
              <div
                onClick={() => navigate('/community')}
                className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-3 group"
              >
                <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
                  <i className="fas fa-users text-xl" />
                </div>
                <span className="font-bold text-gray-800 text-sm">Community</span>
              </div>
              
              <div
                onClick={() => navigate('/dashboard')}
                className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-3 group"
              >
                <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all">
                  <i className="fas fa-chart-line text-xl" />
                </div>
                <span className="font-bold text-gray-800 text-sm">Progress</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-6 max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 text-center mb-12">
            Why Choose StudyClub?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-indigo-600 mb-4">
                <i className="fas fa-brain text-3xl" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Focused Learning</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Distraction-free environment designed to help you concentrate and retain information better.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-purple-600 mb-4">
                <i className="fas fa-clock text-3xl" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Flexible Schedule</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Study at your own pace with 24/7 access to all learning materials and resources.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-teal-600 mb-4">
                <i className="fas fa-shield-alt text-3xl" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Safe Environment</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Your privacy and security are our top priorities. Learn with confidence.
              </p>
            </div>
          </div>
        </section>
    </div>
  );
};
export default Home;
