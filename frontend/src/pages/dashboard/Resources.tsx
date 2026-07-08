import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import useDebounce from '../../hooks/useDebounce';

interface ResourceItem {
  id: string;
  title: string;
  description: string;
  category: 'Study Apps' | 'Software Tools' | 'Online Platforms' | 'Audio Resources' | 'Study Groups' | 'Study Tips';
  type: 'App' | 'Tool' | 'Site' | 'Audio' | 'Group' | 'Tip';
  rating: string;
  users: string;
  icon: string;
  isPopular?: boolean;
  isNew?: boolean;
  link?: string;
  details?: string[];
}

export const Resources: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  const debouncedSearch = useDebounce(searchTerm, 300);

  const categoriesOverview = [
    { title: 'Study Apps', count: '50+ Apps', description: 'Mobile productivity apps.', icon: 'fas fa-mobile-alt', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Software Tools', count: '30+ Tools', description: 'Advanced desktop tools.', icon: 'fas fa-laptop', color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Online Platforms', count: '100+ Sites', description: 'Educational websites.', icon: 'fas fa-globe', color: 'text-teal-600', bg: 'bg-teal-50' },
    { title: 'Audio Resources', count: '200+ Audio', description: 'Podcasts & audiobooks.', icon: 'fas fa-headphones', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Study Groups', count: '150+ Groups', description: 'Collaborative study spaces.', icon: 'fas fa-users', color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Study Tips', count: '500+ Tips', description: 'Effective study techniques.', icon: 'fas fa-lightbulb', color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  const allResources: ResourceItem[] = [
    {
      id: '1',
      title: 'Focus Timer',
      description: 'Pomodoro technique timer with customizable study sessions and breaks.',
      category: 'Software Tools',
      type: 'Tool',
      rating: '4.8/5',
      users: '10k+ users',
      icon: 'fas fa-stopwatch',
      isPopular: true,
      isNew: false,
      link: 'https://pomofocus.io/'
    },
    {
      id: '2',
      title: 'NoteMaster Pro',
      description: 'Advanced note-taking app with cloud sync and collaborative features.',
      category: 'Study Apps',
      type: 'App',
      rating: '4.9/5',
      users: '25k+ users',
      icon: 'fas fa-file-signature',
      isPopular: true,
      isNew: true,
      link: 'https://notion.so/'
    },
    {
      id: '3',
      title: 'Study Analytics',
      description: 'Track your learning progress with detailed analytics and insights.',
      category: 'Software Tools',
      type: 'Tool',
      rating: '4.7/5',
      users: '15k+ users',
      icon: 'fas fa-chart-line',
      isPopular: true,
      isNew: false
    },
    {
      id: '4',
      title: 'Wolfram Alpha',
      description: 'Computational knowledge engine for math, science, and STEM calculations.',
      category: 'Online Platforms',
      type: 'Site',
      rating: '4.8/5',
      users: '100k+ users',
      icon: 'fas fa-square-root-alt',
      isPopular: true,
      isNew: false,
      link: 'https://www.wolframalpha.com/',
      details: ['STEM', 'Math', 'Science']
    },
    {
      id: '5',
      title: 'Khan Academy',
      description: 'Free educational videos, quizzes, and course materials across all topics.',
      category: 'Online Platforms',
      type: 'Site',
      rating: '4.9/5',
      users: '500k+ users',
      icon: 'fas fa-graduation-cap',
      isPopular: true,
      isNew: false,
      link: 'https://www.khanacademy.org/',
      details: ['STEM', 'Math', 'Videos']
    },
    {
      id: '6',
      title: 'Duolingo',
      description: 'Language learning app with gamified daily speaking, listening, and spelling lessons.',
      category: 'Study Apps',
      type: 'App',
      rating: '4.7/5',
      users: '1M+ users',
      icon: 'fas fa-language',
      isPopular: true,
      isNew: false,
      link: 'https://www.duolingo.com/',
      details: ['Languages', 'Arts']
    },
    {
      id: '7',
      title: 'Project Gutenberg',
      description: 'Free online library of over 70,000 public domain books and literary works.',
      category: 'Online Platforms',
      type: 'Site',
      rating: '4.6/5',
      users: '50k+ users',
      icon: 'fas fa-book-reader',
      isPopular: false,
      isNew: false,
      link: 'https://www.gutenberg.org/',
      details: ['Arts', 'Ebooks']
    },
    {
      id: '8',
      title: 'Coursera',
      description: 'Online learning platform offering certified courses from top universities.',
      category: 'Online Platforms',
      type: 'Site',
      rating: '4.8/5',
      users: '200k+ users',
      icon: 'fas fa-award',
      isPopular: true,
      isNew: true,
      link: 'https://www.coursera.org/',
      details: ['Business', 'STEM', 'Programming']
    },
    {
      id: '9',
      title: 'Audio Study Guide: Calculus',
      description: 'Daily mathematical principles and audio breakdowns of calculus problems.',
      category: 'Audio Resources',
      type: 'Audio',
      rating: '4.5/5',
      users: '2k+ users',
      icon: 'fas fa-volume-up',
      isPopular: false,
      isNew: true,
      details: ['Math', 'Calculus', 'Audio']
    },
    {
      id: '10',
      title: 'Feynman Study Technique Group',
      description: 'Collaborative spaces for practicing the Feynman learning technique with peers.',
      category: 'Study Groups',
      type: 'Group',
      rating: '4.9/5',
      users: '5k+ users',
      icon: 'fas fa-user-friends',
      isPopular: true,
      isNew: false,
      details: ['Groups', 'Techniques']
    },
    {
      id: '11',
      title: 'Pomodoro Study Tip Sheets',
      description: 'Curated strategies for optimal focus intervals, break management, and time tracking.',
      category: 'Study Tips',
      type: 'Tip',
      rating: '4.7/5',
      users: '12k+ users',
      icon: 'fas fa-lightbulb',
      isPopular: false,
      isNew: false,
      details: ['Tips', 'Focus']
    }
  ];

  // Filtering Logic
  const filteredResources = allResources.filter(res => {
    const matchesSearch =
      res.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      res.description.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      res.category.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (res.details && res.details.some(d => d.toLowerCase().includes(debouncedSearch.toLowerCase())));

    const matchesCategory = filterCategory === 'all' || res.category === filterCategory;
    const matchesType = filterType === 'all' || res.type === filterType;

    return matchesSearch && matchesCategory && matchesType;
  });

  // Sorting Logic
  const sortedResources = [...filteredResources].sort((a, b) => {
    if (sortBy === 'newest') {
      return (a.isNew ? 1 : 0) - (b.isNew ? 1 : 0);
    }
    return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
  });

  const handleOpenResource = (link?: string, title?: string) => {
    if (link) {
      window.open(link, '_blank');
    } else {
      alert(`Opening tool / space: ${title}`);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up w-full">
      {/* Welcome banner */}
      <section className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-[28px] font-bold text-gray-900 tracking-tight leading-tight font-heading">
            Study Resources
          </h2>
          <p className="text-[14px] text-gray-500 mt-1">
            Discover tools, apps, and resources to enhance your learning experience.
          </p>
        </div>
      </section>

      {/* Categories Overview Bar (100px max height) */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {categoriesOverview.map((cat) => (
          <button
            key={cat.title}
            onClick={() => setFilterCategory(cat.title)}
            className={`border rounded-2xl p-4 shadow-sm flex items-center gap-3 h-[90px] hover:border-indigo-300 transition-all duration-200 text-left ${
              filterCategory === cat.title ? 'border-indigo-600 bg-indigo-50/20 shadow-sm' : 'bg-white border-slate-200'
            }`}
          >
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${cat.bg} ${cat.color} border border-slate-100`}>
              <i className={`${cat.icon} text-base`} />
            </div>
            <div className="overflow-hidden">
              <h4 className="text-[14px] font-bold text-gray-900 leading-none truncate">{cat.title}</h4>
              <span className="text-[11px] text-gray-400 font-semibold block mt-1.5">{cat.count}</span>
            </div>
          </button>
        ))}
      </section>

      {/* Search & Filters Toolbar */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch">
        <div className="flex-1">
          <Input
            id="res-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search resources..."
            className="w-full"
          />
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3.5 py-2.5 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 font-semibold"
          >
            <option value="all">All Categories</option>
            <option value="Study Apps">Study Apps</option>
            <option value="Software Tools">Software Tools</option>
            <option value="Online Platforms">Online Platforms</option>
            <option value="Audio Resources">Audio Resources</option>
            <option value="Study Groups">Study Groups</option>
            <option value="Study Tips">Study Tips</option>
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3.5 py-2.5 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 font-semibold"
          >
            <option value="all">All Types</option>
            <option value="App">App</option>
            <option value="Tool">Tool</option>
            <option value="Site">Site</option>
            <option value="Audio">Audio</option>
            <option value="Group">Group</option>
            <option value="Tip">Tip</option>
          </select>

          {/* Sort Select */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3.5 py-2.5 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 font-semibold"
          >
            <option value="popular">Popularity</option>
            <option value="newest">Newest Released</option>
          </select>
        </div>
      </section>

      {/* Resources Result Listing */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">Resource Catalog</h3>
          {filterCategory !== 'all' && (
            <button
              onClick={() => {
                setFilterCategory('all');
                setFilterType('all');
                setSearchTerm('');
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline font-heading uppercase"
            >
              Reset Filters
            </button>
          )}
        </div>

        {sortedResources.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedResources.map((item) => {
              const typeColors: Record<string, { color: string; bg: string }> = {
                App: { color: "text-indigo-600", bg: "bg-indigo-50" },
                Tool: { color: "text-purple-600", bg: "bg-purple-50" },
                Site: { color: "text-teal-600", bg: "bg-teal-50" },
                Audio: { color: "text-pink-600", bg: "bg-pink-50" },
                Group: { color: "text-blue-600", bg: "bg-blue-50" },
                Tip: { color: "text-amber-600", bg: "bg-amber-50" },
              };
              const meta = typeColors[item.type] || typeColors.App;

              return (
                <Card
                  key={item.id}
                  className="flex flex-col justify-between border border-slate-200 p-6 hover-lift bg-white shadow-sm rounded-2xl min-h-[350px]"
                >
                  <div className="flex-1 flex flex-col justify-between">
                    {/* Top Area: Icon & Category */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${meta.bg} ${meta.color} border border-slate-100`}>
                          <i className={`${item.icon} text-base`} />
                        </div>
                        <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {item.type}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-2">
                        <h4 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug line-clamp-1" title={item.title}>
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 font-medium min-h-[50px]">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Details / Middle Section */}
                    <div className="border-t border-slate-100 pt-4 mt-4 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-20 shrink-0">Category</span>
                        <span className="text-xs font-bold text-slate-700 truncate">{item.category}</span>
                      </div>

                      {item.isNew && (
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-20 shrink-0">Status</span>
                          <span className="text-[9px] font-black text-emerald-650 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full uppercase leading-none">
                            New
                          </span>
                        </div>
                      )}

                      {item.details && item.details.length > 0 && (
                        <div className="flex items-start gap-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-20 shrink-0 mt-1">Tags</span>
                          <div className="flex flex-wrap gap-1.5 leading-none">
                            {item.details.map((tag) => (
                              <span key={tag} className="text-[9px] font-bold text-indigo-650 bg-indigo-50/60 border border-indigo-100/40 px-2.5 py-0.5 rounded-full leading-none">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Area: Rating, Stats & Action Button */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-5 shrink-0">
                    <div className="flex items-center gap-3 select-none leading-none">
                      <span className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                        <i className="fas fa-star" /> {item.rating}
                      </span>
                      <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                        {item.users}
                      </span>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenResource(item.link, item.title)}
                      className="py-1.5 px-4 text-xs font-bold transition-all duration-200 h-9"
                    >
                      Open <i className="fas fa-external-link-alt ml-1.5 text-[9px] text-slate-400" />
                    </Button>
                  </div>
                </Card>

              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <i className="fas fa-folder-open text-4xl text-gray-300 mb-4" />
            <p className="text-sm font-semibold text-gray-500">
              No resources match your filters.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Resources;
