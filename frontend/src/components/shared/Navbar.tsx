import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { GraduationCap } from 'lucide-react';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const isAboutActive = location.pathname === '/about';

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-indigo-600 transition-transform duration-200 hover:scale-102">
          <GraduationCap className="h-7 w-7 text-indigo-600" />
          <span className="font-heading">StudyClub</span>
        </Link>
        
        <ul className="flex items-center gap-6">
          <li>
            <Link
              to="/about"
              className={`font-semibold text-sm transition-colors duration-200 ${
                isAboutActive
                  ? 'text-indigo-600'
                  : 'text-gray-700 hover:text-indigo-600'
              }`}
            >
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
  );
};

export default Navbar;
