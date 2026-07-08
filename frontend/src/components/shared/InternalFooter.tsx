import React from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Youtube 
} from 'lucide-react';

interface InternalFooterProps {
  variant?: 'dashboard' | 'auth';
}

export const InternalFooter: React.FC<InternalFooterProps> = ({ variant = 'dashboard' }) => {
  const currentYear = new Date().getFullYear();

  if (variant === 'auth') {
    return (
      <footer className="w-full py-6 mt-8 border-t border-gray-200 text-center text-xs text-gray-400 font-body">
        <div className="max-w-md mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 px-4">
          <p>&copy; {currentYear} StudyClub. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <Link to="/about" className="hover:text-indigo-600 transition-colors">Privacy</Link>
            <span>•</span>
            <Link to="/about" className="hover:text-indigo-600 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="w-full bg-white border-t border-slate-200 py-8 px-6 mt-auto font-body text-slate-500">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Brand & Tagline */}
        <div className="flex flex-col items-center md:items-start gap-1">
          <Link to="/dashboard" className="flex items-center gap-2 text-base font-extrabold text-indigo-600">
            <GraduationCap className="h-5 w-5 text-indigo-600" />
            <span className="font-heading">StudyClub</span>
          </Link>
          <p className="text-[11px] text-slate-400">
            Helping students learn, collaborate, and grow.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-650">
          <Link to="/dashboard" className="hover:text-indigo-650 transition-colors">Dashboard</Link>
          <Link to="/community" className="hover:text-indigo-650 transition-colors">Communities</Link>
          <Link to="/materials" className="hover:text-indigo-650 transition-colors">Materials</Link>
          <Link to="/community" className="hover:text-indigo-650 transition-colors">Study Groups</Link>
          <a href="mailto:support@studyclub.com" className="hover:text-indigo-650 transition-colors">Help & Support</a>
          <a href="mailto:support@studyclub.com" className="hover:text-indigo-650 transition-colors">Contact Us</a>
        </div>

        {/* Socials & Legal */}
        <div className="flex flex-col items-center md:items-end gap-2.5">
          <div className="flex items-center gap-3">
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noreferrer" 
              className="p-1.5 rounded-md hover:bg-slate-50 text-slate-400 hover:text-blue-600 transition-all"
              aria-label="Facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noreferrer" 
              className="p-1.5 rounded-md hover:bg-slate-50 text-slate-400 hover:text-pink-600 transition-all"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noreferrer" 
              className="p-1.5 rounded-md hover:bg-slate-50 text-slate-400 hover:text-blue-700 transition-all"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
            </a>
            <a 
              href="https://youtube.com" 
              target="_blank" 
              rel="noreferrer" 
              className="p-1.5 rounded-md hover:bg-slate-50 text-slate-400 hover:text-red-600 transition-all"
              aria-label="YouTube"
            >
              <Youtube className="h-4 w-4" />
            </a>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span>&copy; {currentYear} StudyClub</span>
            <span>•</span>
            <Link to="/about" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="/about" className="hover:text-indigo-600 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default InternalFooter;
