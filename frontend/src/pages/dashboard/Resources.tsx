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
    // Search filter
    const matchesSearch =
      res.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      res.description.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      res.category.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (res.details && res.details.some(d => d.toLowerCase().includes(debouncedSearch.toLowerCase())));

    // Category filter
    const matchesCategory = filterCategory === 'all' || res.category === filterCategory;

    // Type filter
    const matchesType = filterType === 'all' || res.type === filterType;

    return matchesSearch && matchesCategory && matchesType;
  });

  // Sorting Logic
  const sortedResources = [...filteredResources].sort((a, b) => {
    if (sortBy === 'newest') {
      return (a.isNew ? 1 : 0) - (b.isNew ? 1 : 0);
    }
    // Popularity
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
    <div className="space-y-8">
      {/* Unified Hero & Search Card */}
      <section className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm space-y-6 relative overflow-hidden">
        {/* Background gradient subtle glow */}
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-indigo-50 blur-3xl opacity-50" />
        <div className="absolute -left-24 -bottom-24 h-48 w-48 rounded-full bg-purple-50 blur-3xl opacity-50" />

        <div className="relative space-y-1">
          <h2 className="text-2xl font-extrabold text-gray-900 font-heading">
            Study Resources
          </h2>
          <p className="text-sm text-gray-600">
            Discover tools, apps, and resources to enhance your learning experience.
          </p>
        </div>

        <div className="relative grid grid-cols-1 gap-4 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">Search Resource</label>
            <Input
              id="res-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, description, keywords..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
              >
                <option value="all">All Categories</option>
                <option value="Study Apps">Study Apps</option>
                <option value="Software Tools">Software Tools</option>
                <option value="Online Platforms">Online Platforms</option>
                <option value="Audio Resources">Audio Resources</option>
                <option value="Study Groups">Study Groups</option>
                <option value="Study Tips">Study Tips</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">Resource Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
              >
                <option value="all">All Types</option>
                <option value="App">App</option>
                <option value="Tool">Tool</option>
                <option value="Site">Site</option>
                <option value="Audio">Audio</option>
                <option value="Group">Group</option>
                <option value="Tip">Tip</option>
              </select>
            </div>

            {/* Sort Select */}
            <div>
              <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
              >
                <option value="popular">Popularity</option>
                <option value="newest">Newest Released</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Category Overview Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoriesOverview.map((cat) => (
          <button
            key={cat.title}
            onClick={() => setFilterCategory(cat.title)}
            className={`border rounded-2xl p-6 shadow-sm flex items-start gap-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
              filterCategory === cat.title ? 'border-indigo-600 bg-indigo-50/20 shadow-sm' : 'bg-white border-gray-200'
            }`}
          >
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${cat.bg} ${cat.color}`}>
              <i className={`${cat.icon} text-lg`} />
            </div>
            <div className="space-y-1 overflow-hidden">
              <div className="flex justify-between items-baseline gap-2">
                <h4 className="text-sm font-extrabold text-gray-900 truncate leading-none">{cat.title}</h4>
                <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full shrink-0">
                  {cat.count}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-normal line-clamp-2">
                {cat.description}
              </p>
            </div>
          </button>
        ))}
      </section>

      {/* Catalog Grid */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">Resource Catalog</h3>
          {filterCategory !== 'all' && (
            <button
              onClick={() => {
                setFilterCategory('all');
                setFilterType('all');
                setSearchTerm('');
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        {sortedResources.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  className="flex flex-col justify-between border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="space-y-4">
                    {/* Header: Icon & Category */}
                    <div className="flex justify-between items-start">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${meta.bg} ${meta.color}`}>
                        <i className={`${item.icon} text-lg`} />
                      </div>
                      <span className="text-[10px] font-extrabold text-gray-400 bg-gray-50 border border-gray-150 px-2 py-0.5 rounded-full uppercase">
                        {item.type}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-1.5">
                      <h3 className="font-extrabold text-gray-900 text-sm leading-tight line-clamp-1" title={item.title}>
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-600 leading-relaxed min-h-[32px] line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    {/* Metadata: Category & Tags */}
                    <div className="space-y-2 border-t border-gray-100 pt-3">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400 font-semibold text-[10px] uppercase w-16 shrink-0">Category:</span>
                        <span className="text-gray-700 font-bold truncate">
                          {item.category}
                        </span>
                      </div>

                      {item.isNew && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-400 font-semibold text-[10px] uppercase w-16 shrink-0">Status:</span>
                          <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                            New
                          </span>
                        </div>
                      )}

                      {item.details && item.details.length > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-400 font-semibold text-[10px] uppercase w-16 shrink-0">Tags:</span>
                          <div className="flex flex-wrap gap-1 overflow-hidden max-h-[18px]">
                            {item.details.map((tag) => (
                              <span key={tag} className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer: Rating, Users count & Open/View button */}
                  <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-3.5 mt-4">
                    <div className="flex flex-col text-[10px] text-gray-400 font-bold uppercase">
                      <span className="flex items-center gap-1 text-amber-500 text-xs">
                        <i className="fas fa-star" /> {item.rating}
                      </span>
                      <span className="mt-0.5">{item.users}</span>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenResource(item.link, item.title)}
                    >
                      Open <i className="fas fa-external-link-alt ml-1.5 text-[10px]" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white border border-gray-250 rounded-2xl">
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
