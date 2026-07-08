import React from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Mail, 
  MapPin, 
  LifeBuoy, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Youtube, 
  Twitter 
} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-900 pt-16 pb-8 px-6 font-body">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 mb-12">
        {/* Brand Section */}
        <div className="lg:col-span-4 space-y-5">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-extrabold text-white">
            <GraduationCap className="h-8 w-8 text-indigo-500" />
            <span className="font-heading">StudyClub</span>
          </Link>
          <p className="text-slate-400 text-sm leading-relaxed">
            Empowering students to achieve their academic goals through innovative learning experiences, collaborative study groups, and smart educational tools.
          </p>
        </div>

        {/* Quick Links Section */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-white font-heading font-semibold text-sm uppercase tracking-wider">Quick Links</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/" className="text-slate-450 hover:text-indigo-400 transition-colors duration-250">
                Home
              </Link>
            </li>
            <li>
              <Link to="/about" className="text-slate-450 hover:text-indigo-400 transition-colors duration-250">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/register" className="text-slate-450 hover:text-indigo-400 transition-colors duration-250">
                Create Account
              </Link>
            </li>
            <li>
              <Link to="/login" className="text-slate-450 hover:text-indigo-400 transition-colors duration-250">
                Login
              </Link>
            </li>
            <li>
              <Link to="/community" className="text-slate-450 hover:text-indigo-400 transition-colors duration-250">
                Communities
              </Link>
            </li>
            <li>
              <Link to="/community" className="text-slate-450 hover:text-indigo-400 transition-colors duration-250">
                Study Groups
              </Link>
            </li>
            <li>
              <a href="mailto:support@studyclub.com" className="text-slate-450 hover:text-indigo-400 transition-colors duration-250">
                Contact Us
              </a>
            </li>
            <li>
              <Link to="/resources" className="text-slate-450 hover:text-indigo-400 transition-colors duration-250">
                Help Center
              </Link>
            </li>
          </ul>
        </div>

        {/* Community / Platform Section */}
        <div className="lg:col-span-3 space-y-4">
          <h4 className="text-white font-heading font-semibold text-sm uppercase tracking-wider">Platform</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/community" className="text-slate-450 hover:text-indigo-400 transition-colors duration-250">
                Explore Communities
              </Link>
            </li>
            <li>
              <Link to="/community" className="text-slate-450 hover:text-indigo-400 transition-colors duration-250">
                Create Community
              </Link>
            </li>
            <li>
              <Link to="/community" className="text-slate-450 hover:text-indigo-400 transition-colors duration-250">
                Find Study Partners
              </Link>
            </li>
            <li>
              <Link to="/materials" className="text-slate-450 hover:text-indigo-400 transition-colors duration-250">
                Learning Materials
              </Link>
            </li>
            <li>
              <Link to="/get-started" className="text-slate-450 hover:text-indigo-400 transition-colors duration-250">
                Events
              </Link>
            </li>
            <li>
              <Link to="/about" className="text-slate-450 hover:text-indigo-400 transition-colors duration-250">
                FAQ
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Info & Socials Section */}
        <div className="lg:col-span-3 space-y-6">
          <div className="space-y-4">
            <h4 className="text-white font-heading font-semibold text-sm uppercase tracking-wider">Contact Info</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-indigo-450 shrink-0" />
                <a href="mailto:support@studyclub.com" className="hover:text-indigo-400 transition-colors">
                  support@studyclub.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-indigo-450 shrink-0" />
                <span>India</span>
              </li>
              <li className="flex items-center gap-3">
                <LifeBuoy className="h-4 w-4 text-indigo-450 shrink-0" />
                <a href="mailto:support@studyclub.com" className="hover:text-indigo-400 transition-colors">
                  24/7 Support Desk
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="text-white font-heading font-semibold text-xs uppercase tracking-wider text-slate-400">Connect With Us</h5>
            <div className="flex flex-wrap gap-2.5">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noreferrer" 
                className="h-9 w-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600 hover:border-blue-600 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/25"
                aria-label="Facebook"
              >
                <Facebook className="h-4.5 w-4.5" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noreferrer" 
                className="h-9 w-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-pink-600 hover:border-pink-600 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-pink-500/25"
                aria-label="Instagram"
              >
                <Instagram className="h-4.5 w-4.5" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noreferrer" 
                className="h-9 w-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-700 hover:border-blue-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-700/25"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4.5 w-4.5" />
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noreferrer" 
                className="h-9 w-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-655 hover:border-red-655 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-600/25"
                aria-label="YouTube"
              >
                <Youtube className="h-4.5 w-4.5" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noreferrer" 
                className="h-9 w-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-800 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-500/25"
                aria-label="Twitter / X"
              >
                <Twitter className="h-4.5 w-4.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Area */}
      <div className="max-w-6xl mx-auto pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} StudyClub. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link to="/about" className="hover:text-indigo-400 transition-colors">Privacy Policy</Link>
          <span>|</span>
          <Link to="/about" className="hover:text-indigo-400 transition-colors">Terms of Service</Link>
          <span>|</span>
          <Link to="/about" className="hover:text-indigo-400 transition-colors">Cookie Policy</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
