import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const About: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-indigo-600">
            <i className="fas fa-graduation-cap text-2xl"></i>
            <span>StudyClub</span>
          </Link>
          <ul className="flex items-center gap-6">
            <li>
              <Link to="/about" className="text-indigo-600 font-semibold text-sm">
                About
              </Link>
            </li>
            {isAuthenticated ? (
              <li>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-indigo-600 text-white px-5 py-2 rounded-full font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
                >
                  Dashboard
                </button>
              </li>
            ) : (
              <li>
                <Link
                  to="/login"
                  className="bg-indigo-600 text-white px-5 py-2 rounded-full font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
                >
                  Login
                </Link>
              </li>
            )}
          </ul>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto py-16 px-6 space-y-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 text-center">About StudyClub</h1>
        <p className="text-gray-600 leading-relaxed text-center max-w-lg mx-auto">
          We are committed to providing students worldwide with a secure, quiet, and collaborative sanctuary where knowledge thrives.
        </p>

        <hr className="border-gray-200" />

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed text-sm">
            StudyClub was built to address the lack of structured peer-to-peer virtual spaces for students. By combining study material hubs, focused group rooms, real-time shared whiteboards, and intelligent AI doubt-solving assistants, we enable students to maintain academic momentum from anywhere.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
          <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm">
            <h3 className="font-bold text-indigo-600 mb-2">Real-time Collab</h3>
            <p className="text-gray-600 text-xs leading-relaxed">
              Draw ideas and outline layouts interactively on group whiteboards, synchronized instantly over WebSockets.
            </p>
          </div>
          
          <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm">
            <h3 className="font-bold text-purple-600 mb-2">AI Doubts Solver</h3>
            <p className="text-gray-600 text-xs leading-relaxed">
              Get immediate answers to complex equations and homework questions via our Google Gemini AI proxy.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} StudyClub. All rights reserved.</p>
      </footer>
    </div>
  );
};
export default About;
