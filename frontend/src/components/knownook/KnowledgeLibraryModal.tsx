import React, { useState } from 'react';
import {
  AiCollection,
  AiBookmark,
  AiTag,
  UniversalSearchResultItem,
  StorageInsights,
  LibraryEntityType,
} from '../../types/ai.types';

interface KnowledgeLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: AiCollection[];
  bookmarks: AiBookmark[];
  tags: AiTag[];
  insights: StorageInsights | null;
  searchResults: UniversalSearchResultItem[];
  searchQuery: string;
  onSearch: (q: string, type?: string) => void;
  onCreateCollection: (data: { title: string; description?: string; color?: string; icon?: string }) => void;
  onDeleteCollection: (id: string) => void;
  onDeleteBookmark: (id: string) => void;
  onExportBundle: () => void;
  isLoading: boolean;
}

const COLLECTION_TEMPLATES = [
  { title: '🎓 Semester Subject', icon: '📚', color: '#0284c7', description: 'Organize notes, assignments, and exam prep for a course.' },
  { title: '💼 Technical Interview Prep', icon: '💻', color: '#10b981', description: 'DS, Algorithms, System Design questions & quizzes.' },
  { title: '🔬 Research Project', icon: '📄', color: '#8b5cf6', description: 'PDF documents, OCR notes, and research summaries.' },
  { title: '🏆 Competitive Exam (GATE)', icon: '🎯', color: '#f59e0b', description: 'Comprehensive subject decks, flashcards & milestone plans.' },
];

export const KnowledgeLibraryModal: React.FC<KnowledgeLibraryModalProps> = ({
  isOpen,
  onClose,
  collections,
  bookmarks,
  tags,
  insights,
  searchResults,
  searchQuery,
  onSearch,
  onCreateCollection,
  onDeleteCollection,
  onDeleteBookmark,
  onExportBundle,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'search' | 'collections' | 'bookmarks' | 'lineage' | 'export'>('overview');
  const [selectedFilterType, setSelectedFilterType] = useState<string>('');

  // Collection Form State
  const [newColTitle, setNewColTitle] = useState('');
  const [newColIcon, setNewColIcon] = useState('📂');
  const [newColColor, setNewColColor] = useState('#0284c7');

  if (!isOpen) return null;

  const handleCreateCollectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;
    onCreateCollection({
      title: newColTitle.trim(),
      icon: newColIcon,
      color: newColColor,
    });
    setNewColTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[88vh] text-gray-100 font-sans">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-gradient-to-tr from-cyan-500 to-indigo-600 rounded-xl text-white font-bold text-base shadow">
              📚
            </span>
            <div>
              <h2 className="font-bold text-white text-lg leading-tight">KnowNook Enterprise Knowledge Library</h2>
              <p className="text-xs text-cyan-400 font-medium">Centralized Assets, Collections, Bookmarks & Lineage Graph</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition font-bold"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-gray-800 bg-gray-950/60 flex items-center gap-2">
          {[
            { id: 'overview', label: '📊 Storage Insights', desc: 'Asset Summary' },
            { id: 'search', label: '🔍 Universal Search', desc: 'Cross-Asset Search' },
            { id: 'collections', label: '📁 Collections & Folders', desc: 'Subject Workspaces' },
            { id: 'bookmarks', label: '🔖 Bookmarks Panel', desc: 'Saved Snippets' },
            { id: 'lineage', label: '🕸️ Asset Lineage Graph', desc: 'Knowledge Tree' },
            { id: 'export', label: '📦 Export Center', desc: 'Bundle Exporter' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 text-xs font-bold transition border-b-2 ${
                activeTab === tab.id
                  ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0 bg-gray-900/90">
          {/* TAB 1: STORAGE INSIGHTS & OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="font-bold text-white text-base">Knowledge Asset Breakdown</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-gray-800/60 border border-gray-700/80 rounded-2xl">
                  <span className="text-xs text-gray-400 font-bold block uppercase">📝 AI Notes</span>
                  <span className="text-2xl font-black text-emerald-400 mt-1 block">{insights?.notesCount || 0} Notes</span>
                </div>

                <div className="p-4 bg-gray-800/60 border border-gray-700/80 rounded-2xl">
                  <span className="text-xs text-gray-400 font-bold block uppercase">🎴 Flashcard Decks</span>
                  <span className="text-2xl font-black text-amber-400 mt-1 block">{insights?.decksCount || 0} Decks</span>
                  <span className="text-[10px] text-gray-500">{insights?.flashcardsCount || 0} cards total</span>
                </div>

                <div className="p-4 bg-gray-800/60 border border-gray-700/80 rounded-2xl">
                  <span className="text-xs text-gray-400 font-bold block uppercase">🎯 AI Quizzes</span>
                  <span className="text-2xl font-black text-rose-400 mt-1 block">{insights?.quizzesCount || 0} Quizzes</span>
                </div>

                <div className="p-4 bg-gray-800/60 border border-gray-700/80 rounded-2xl">
                  <span className="text-xs text-gray-400 font-bold block uppercase">📄 Documents & PDFs</span>
                  <span className="text-2xl font-black text-cyan-400 mt-1 block">{insights?.documentsCount || 0} Files</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-800/60 border border-gray-700/80 rounded-2xl">
                  <span className="text-xs text-gray-400 font-bold block uppercase">📅 Study Plans</span>
                  <span className="text-xl font-bold text-white mt-1 block">{insights?.studyPlansCount || 0} Active Plans</span>
                </div>
                <div className="p-4 bg-gray-800/60 border border-gray-700/80 rounded-2xl">
                  <span className="text-xs text-gray-400 font-bold block uppercase">🔖 Bookmarks</span>
                  <span className="text-xl font-bold text-white mt-1 block">{insights?.bookmarksCount || 0} Saved Bookmarks</span>
                </div>
                <div className="p-4 bg-gray-800/60 border border-gray-700/80 rounded-2xl">
                  <span className="text-xs text-gray-400 font-bold block uppercase">📁 Collections</span>
                  <span className="text-xl font-bold text-white mt-1 block">{insights?.collectionsCount || 0} Folders</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: UNIVERSAL SEARCH */}
          {activeTab === 'search' && (
            <div className="space-y-6">
              {/* Search Bar & Filters */}
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="🔍 Search across Notes, Flashcards, Quizzes, Plans, Documents..."
                  value={searchQuery}
                  onChange={(e) => onSearch(e.target.value, selectedFilterType)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 shadow-inner"
                />

                <div className="flex gap-2">
                  {['', 'note', 'flashcard', 'quiz', 'plan'].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setSelectedFilterType(type);
                        onSearch(searchQuery, type);
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
                        selectedFilterType === type
                          ? 'bg-cyan-500 text-gray-950 border-cyan-400'
                          : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
                      }`}
                    >
                      {type ? type.toUpperCase() : 'ALL ASSETS'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results List */}
              <div className="space-y-2">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-gray-800/60 border border-gray-700/80 rounded-2xl space-y-1 hover:border-cyan-500/50 transition"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{item.entityType}</span>
                      <span className="text-[10px] text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-bold text-white text-sm">{item.title}</h4>
                    <p className="text-xs text-gray-400 font-mono bg-gray-900/60 p-2 rounded-lg">{item.snippet}</p>
                  </div>
                ))}
                {searchQuery && searchResults.length === 0 && (
                  <p className="text-center text-xs text-gray-500 py-8">No learning assets found matching "{searchQuery}".</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: COLLECTIONS & FOLDERS */}
          {activeTab === 'collections' && (
            <div className="space-y-6">
              {/* Presets */}
              <div>
                <h3 className="font-bold text-white text-xs uppercase tracking-wider block mb-2">Collection Templates</h3>
                <div className="grid grid-cols-2 gap-3">
                  {COLLECTION_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.title}
                      onClick={() => onCreateCollection({ title: tmpl.title, icon: tmpl.icon, color: tmpl.color, description: tmpl.description })}
                      className="p-4 bg-gray-800/60 hover:bg-gray-800 border border-gray-700/80 text-left rounded-2xl transition space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <span>{tmpl.icon}</span>
                        <h4 className="font-bold text-white text-sm">{tmpl.title}</h4>
                      </div>
                      <p className="text-xs text-gray-400">{tmpl.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Create Custom Collection */}
              <form onSubmit={handleCreateCollectionSubmit} className="p-4 bg-gray-800/40 border border-gray-700/80 rounded-2xl flex gap-3">
                <input
                  type="text"
                  placeholder="Collection Title (e.g. Operating Systems Kernel)"
                  value={newColTitle}
                  onChange={(e) => setNewColTitle(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
                <button type="submit" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs">
                  + Create Folder
                </button>
              </form>

              {/* User Collections Grid */}
              <div className="grid grid-cols-3 gap-4">
                {collections.map((col) => (
                  <div key={col.id} className="p-4 bg-gray-800/60 border border-gray-700/80 rounded-2xl space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-2xl">{col.icon}</span>
                        <button
                          onClick={() => onDeleteCollection(col.id)}
                          className="text-gray-500 hover:text-rose-400 text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                      <h4 className="font-bold text-white text-sm mt-2">{col.title}</h4>
                      <p className="text-xs text-gray-400">{col.description || 'Collection Folder'}</p>
                    </div>

                    <div className="pt-2 border-t border-gray-700/60 flex justify-between items-center text-[10px] text-gray-400">
                      <span>{col._count?.items || 0} Items</span>
                      <span className="font-bold" style={{ color: col.color }}>● Folder</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: BOOKMARKS */}
          {activeTab === 'bookmarks' && (
            <div className="space-y-4">
              <h3 className="font-bold text-white text-base">Bookmarked Snippets ({bookmarks.length})</h3>
              <div className="space-y-2">
                {bookmarks.map((bm) => (
                  <div key={bm.id} className="p-4 bg-gray-800/60 border border-gray-700/80 rounded-2xl flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">{bm.entityType}</span>
                      <h4 className="font-bold text-white text-sm">{bm.title}</h4>
                      {bm.snippet && <p className="text-xs text-gray-400">{bm.snippet}</p>}
                    </div>

                    <button
                      onClick={() => onDeleteBookmark(bm.id)}
                      className="text-gray-500 hover:text-rose-400 text-xs font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: ASSET LINEAGE GRAPH */}
          {activeTab === 'lineage' && (
            <div className="p-6 bg-gray-800/40 border border-gray-700/80 rounded-2xl space-y-4">
              <h3 className="font-bold text-white text-base">🕸️ Knowledge Asset Relationship Tree</h3>
              <p className="text-xs text-gray-400">Exposes asset connections across conversations, notes, flashcard decks, quizzes, and study plans.</p>

              <div className="p-4 bg-gray-950/80 rounded-xl border border-gray-800 font-mono text-xs space-y-2">
                <div className="text-emerald-400">💬 AI Conversation ("DBMS Indexing & B-Trees")</div>
                <div className="pl-4 text-cyan-400">└─ 📝 Generated Note ("B-Tree & B+ Tree Differences")</div>
                <div className="pl-8 text-amber-400">└─ 🎴 Flashcard Deck ("B-Tree Properties")</div>
                <div className="pl-12 text-rose-400">└─ 🎯 Quiz ("DBMS Indexing Practice")</div>
                <div className="pl-16 text-indigo-400">└─ 📅 Study Plan ("DBMS 14-Day Roadmap")</div>
              </div>
            </div>
          )}

          {/* TAB 6: EXPORT CENTER */}
          {activeTab === 'export' && (
            <div className="p-6 bg-gradient-to-r from-cyan-950/80 to-indigo-950/60 border border-cyan-500/40 rounded-2xl space-y-4">
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">📦 Knowledge Bundle Exporter</span>
                <h3 className="text-lg font-bold text-white mt-1">Export Complete Learning Bundle with manifest.json</h3>
                <p className="text-xs text-gray-300 mt-1">Package all notes, flashcards, quizzes, study plans, and bookmarks into portable JSON format.</p>
              </div>

              <button
                onClick={onExportBundle}
                className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow transition"
              >
                📥 Download Knowledge Bundle (.JSON)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeLibraryModal;
