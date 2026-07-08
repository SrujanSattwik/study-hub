import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  Target, 
  Users, 
  Award, 
  Globe, 
  Cpu, 
  BookOpen, 
  Sparkles, 
  Zap, 
  Shield, 
  Heart,
  MessageSquare,
  Smile,
  Info
} from 'lucide-react';

export const About: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const achievements = [
    { number: '10,000+', label: 'Active Students', icon: Users },
    { number: '500+', label: 'Study Groups', icon: BookOpen },
    { number: '95%', label: 'Success Rate', icon: Award },
    { number: '50+', label: 'Countries', icon: Globe },
  ];

  const teamMembers = [
    {
      name: 'Srujan Sattwik',
      role: 'Founder & CEO',
      initials: 'SS',
      bio: 'Former educator with 10+ years experience in educational technology and student success.',
      color: 'from-blue-500 to-indigo-500',
    },
    {
      name: 'Kusum Sethi',
      role: 'CTO',
      initials: 'KS',
      bio: 'Tech enthusiast passionate about creating innovative learning platforms and tools.',
      color: 'from-purple-500 to-indigo-500',
    },
    {
      name: 'Janu',
      role: 'Head of Content',
      initials: 'JN',
      bio: 'Curriculum specialist dedicated to creating engaging and effective learning materials.',
      color: 'from-pink-500 to-purple-500',
    },
    {
      name: 'Sangita',
      role: 'Community Manager',
      initials: 'SG',
      bio: 'Building and nurturing our vibrant student community and study groups.',
      color: 'from-teal-500 to-emerald-500',
    },
  ];

  const benefits = [
    {
      title: 'Smart Learning',
      description: 'Leverage AI and integrated scheduling tools to optimize your study habits and plan syllabus milestones.',
      icon: Cpu,
      color: 'text-indigo-650 bg-indigo-50',
    },
    {
      title: 'Community Collaboration',
      description: 'Connect with peers, chat in real-time rooms, and work together synchronously on shared whiteboards.',
      icon: Users,
      color: 'text-purple-650 bg-purple-50',
    },
    {
      title: 'Resource Sharing',
      description: 'Instantly search and access textbooks, practice tests, and comprehensive study notes uploaded by peers.',
      icon: BookOpen,
      color: 'text-teal-650 bg-teal-50',
    },
    {
      title: 'Student Growth',
      description: 'Track your learning velocity, join milestones, and maintain academic momentum within structured modules.',
      icon: Sparkles,
      color: 'text-pink-650 bg-pink-50',
    },
  ];

  const values = [
    {
      title: 'Innovation',
      description: 'Integrating state-of-the-art tools, like AI proxy assistants, to unlock modern studying methods.',
      icon: Zap,
    },
    {
      title: 'Collaboration',
      description: 'Believing that shared knowledge and interactive workspaces create the ultimate virtual study environment.',
      icon: Heart,
    },
    {
      title: 'Accessibility',
      description: 'Ensuring every student has open access to study hubs, schedules, and learning materials globally.',
      icon: Globe,
    },
    {
      title: 'Excellence',
      description: 'Striving continuously to provide a secure, distraction-free sanctuary where students achieve high success.',
      icon: Shield,
    },
  ];

  return (
    <div className="flex-1 font-body text-slate-800">
      {/* Hero Section */}
      <section className="relative py-24 px-6 overflow-hidden bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 border-b border-slate-100">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.05),transparent_50%)]" />
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-750 border border-indigo-100 animate-fade-in">
            <Sparkles className="h-3 w-3" /> About StudyClub
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Building the future of <br />
            <span className="bg-gradient-to-r from-indigo-650 to-purple-650 bg-clip-text text-transparent">
              collaborative learning
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto font-light">
            StudyClub is a modern learning platform designed to connect students, create communities, share knowledge, and make education more interactive and accessible.
          </p>
          <div className="pt-4">
            <button
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
              className="bg-indigo-600 text-white px-8 py-3.5 rounded-full font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600">
            <Target className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Our Mission</h2>
          <p className="text-slate-600 leading-relaxed">
            Our mission is to empower learners worldwide by creating a collaborative environment where students can learn together, share resources, communicate effectively, and achieve their academic goals.
          </p>
          <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-indigo-600" /> Did you know?
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              We are committed to providing students worldwide with a secure, quiet, and collaborative sanctuary where knowledge thrives.
            </p>
          </div>
        </div>
        
        <div className="lg:col-span-6 space-y-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative">
          <div className="absolute top-0 right-0 h-24 w-24 bg-purple-100 rounded-full blur-3xl opacity-30 -z-10" />
          <h3 className="text-xl font-bold text-slate-900">Why StudyClub was built</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            StudyClub was built to address the lack of structured peer-to-peer virtual spaces for students. By combining study material hubs, focused group rooms, real-time shared whiteboards, and intelligent AI doubt-solving assistants, we enable students to maintain academic momentum from anywhere.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <h4 className="font-bold text-indigo-600 text-sm mb-1">Real-time Collab</h4>
              <p className="text-slate-500 text-xs leading-relaxed">
                Draw ideas and outline layouts interactively on group whiteboards, synchronized instantly over WebSockets.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <h4 className="font-bold text-purple-650 text-sm mb-1">AI Doubts Solver</h4>
              <p className="text-slate-500 text-xs leading-relaxed">
                Get immediate answers to complex equations and homework questions via our Google Gemini AI proxy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-20 bg-slate-50 border-y border-slate-100 px-6">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900">Our Achievements</h2>
          <p className="text-sm text-slate-500 mt-2">Milestones reached together with our global community</p>
        </div>
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {achievements.map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-150/60 hover-lift text-center flex flex-col items-center justify-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <item.icon className="h-5 w-5" />
              </div>
              <span className="text-3xl md:text-4xl font-extrabold text-purple-650 font-heading">
                {item.number}
              </span>
              <span className="text-sm font-semibold text-slate-650">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose StudyClub Section */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Why Choose StudyClub?</h2>
          <p className="text-slate-550 text-sm leading-relaxed">
            Our platform provides custom learning integrations that empower students to organize, collaborate, and excel in one consolidated hub.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="bg-white border border-slate-205/70 p-6 rounded-2xl shadow-sm hover-lift flex gap-5 items-start">
              <div className={`p-3.5 rounded-xl shrink-0 ${benefit.color}`}>
                <benefit.icon className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-slate-900 text-lg leading-tight">{benefit.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-20 bg-slate-50 border-t border-slate-100 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Our Values</h2>
            <p className="text-slate-550 text-sm leading-relaxed">
              These core principles drive our product design, content pipeline, and community governance.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((val, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-sm hover:shadow-md transition-shadow duration-200 space-y-4">
                <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-650 flex items-center justify-center">
                  <val.icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-base">{val.title}</h4>
                  <p className="text-slate-500 text-xs leading-relaxed">{val.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Meet Our Team</h2>
          <p className="text-slate-550 text-sm leading-relaxed">
            The passionate educators, engineers, and creatives building the ultimate digital learning sanctuary.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamMembers.map((member, idx) => (
            <div 
              key={idx} 
              className="bg-white border rounded-2xl p-6 transition-all duration-300 card-glow-active hover:scale-[1.03]"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-tr ${member.color} text-white flex items-center justify-center text-xl font-bold font-heading shadow-md shadow-indigo-100`}>
                  {member.initials}
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-900 text-lg leading-tight">{member.name}</h3>
                  <span className="inline-block text-indigo-650 text-xs font-semibold tracking-wide uppercase">{member.role}</span>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed pt-2 border-t border-slate-100">
                  {member.bio}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default About;
