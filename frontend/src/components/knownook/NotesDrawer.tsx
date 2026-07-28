import React, { useState } from 'react';
import { AiNote, NoteType } from '../../types/ai.types';
import RichMarkdownRenderer from './RichMarkdownRenderer';

interface NotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notes: AiNote[];
  activeNote: AiNote | null;
  onSelectNote: (note: AiNote) => void;
  isLoading: boolean;
  isGenerating: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterType: string;
  onFilterChange: (type: string) => void;
  onGenerateNote: (noteType: NoteType, customTopic?: string, instructions?: string) => void;
  onRegenerateNote: (id: string, instructions?: string) => void;
  onUpdateNote: (id: string, data: { title?: string; content?: string }) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onExportMarkdown: (note: AiNote) => void;
  onExportPdf: (note: AiNote) => void;
}

const NOTE_TYPES: Array<{ type: NoteType; label: string; icon: string; desc: string }> = [
  { type: 'executive_summary', label: 'Executive Summary', icon: '🧠', desc: 'High-level overview & takeaways' },
  { type: 'detailed', label: 'Detailed Notes', icon: '📖', desc: 'Comprehensive study breakdown' },
  { type: 'bullet', label: 'Bullet Notes', icon: '⚡', desc: 'Scannable facts & bullet points' },
  { type: 'revision', label: 'Revision Guide', icon: '🎯', desc: 'Quick review before tests' },
  { type: 'exam', label: 'Exam Cheat Sheet', icon: '📝', desc: 'High-yield formulas & definitions' },
  { type: 'eli5', label: 'Explain Like I\'m 5', icon: '👶', desc: 'Simple everyday analogies' },
  { type: 'definitions', label: 'Definitions Index', icon: '📚', desc: 'Glossary of terms & acronyms' },
  { type: 'formulas', label: 'Formula Sheet', icon: '📐', desc: 'LaTeX math formulas & equations' },
  { type: 'mindmap', label: 'Mind Map Diagram', icon: '🗺️', desc: 'Mermaid visual diagram' },
];

export const NotesDrawer: React.FC<NotesDrawerProps> = ({
  isOpen,
  onClose,
  notes,
  activeNote,
  onSelectNote,
  isLoading,
  isGenerating,
  searchQuery,
  onSearchChange,
  filterType,
  onFilterChange,
  onGenerateNote,
  onRegenerateNote,
  onUpdateNote,
  onToggleFavorite,
  onDeleteNote,
  onExportMarkdown,
  onExportPdf,
}) => {
  const [selectedGenerateType, setSelectedGenerateType] = useState<NoteType>('detailed');
  const [customTopic, setCustomTopic] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  if (!isOpen) return null;

  const handleStartEdit = () => {
    if (!activeNote) return;
    setEditTitle(activeNote.title);
    setEditContent(activeNote.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (activeNote && editTitle.trim()) {
      onUpdateNote(activeNote.id, { title: editTitle.trim(), content: editContent });
    }
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-5xl bg-gray-900 border-l border-gray-700 h-full flex flex-col shadow-2xl text-gray-100 font-sans">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/90">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl text-white font-bold text-base shadow">
              📝
            </span>
            <div>
              <h2 className="font-bold text-white text-lg leading-tight">KnowNook AI Notes Workspace</h2>
              <p className="text-xs text-cyan-400 font-medium">Smart AI Summaries, Mind Maps & Study Guides</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition font-bold"
          >
            ✕
          </button>
        </div>

        {/* Workspace Body */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Column: Note Generators & Saved Notes List */}
          <div className="w-80 border-r border-gray-800 flex flex-col bg-gray-900/60">
            {/* Generate Note Controls */}
            <div className="p-4 border-b border-gray-800 space-y-3">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Generate AI Study Note
              </label>

              <input
                type="text"
                placeholder="Topic focus (e.g., Calculus Derivatives)"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />

              <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto custom-scrollbar p-1 bg-gray-950/60 rounded-xl border border-gray-800">
                {NOTE_TYPES.map((t) => (
                  <button
                    key={t.type}
                    onClick={() => setSelectedGenerateType(t.type)}
                    className={`p-2 rounded-lg text-center transition flex flex-col items-center gap-1 ${
                      selectedGenerateType === t.type
                        ? 'bg-cyan-600 text-white font-bold shadow'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                    }`}
                    title={t.desc}
                  >
                    <span className="text-base">{t.icon}</span>
                    <span className="text-[10px] truncate w-full">{t.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => onGenerateNote(selectedGenerateType, customTopic)}
                disabled={isGenerating}
                className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Generating Note...</span>
                  </>
                ) : (
                  <>
                    <span>✨ Generate Note</span>
                  </>
                )}
              </button>
            </div>

            {/* Filter Tabs & Search */}
            <div className="p-3 border-b border-gray-800 space-y-2">
              <input
                type="text"
                placeholder="Search saved notes..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />

              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={() => onFilterChange('all')}
                  className={`flex-1 py-1 rounded-lg font-medium transition ${filterType === 'all' ? 'bg-cyan-950 text-cyan-400 font-bold border border-cyan-500/40' : 'text-gray-400 hover:text-white'}`}
                >
                  All ({notes.length})
                </button>
                <button
                  onClick={() => onFilterChange('favorite')}
                  className={`flex-1 py-1 rounded-lg font-medium transition ${filterType === 'favorite' ? 'bg-amber-950 text-amber-400 font-bold border border-amber-500/40' : 'text-gray-400 hover:text-white'}`}
                >
                  ★ Starred
                </button>
                <button
                  onClick={() => onFilterChange('mindmap')}
                  className={`flex-1 py-1 rounded-lg font-medium transition ${filterType === 'mindmap' ? 'bg-blue-950 text-blue-400 font-bold border border-blue-500/40' : 'text-gray-400 hover:text-white'}`}
                >
                  🗺️ Mind Maps
                </button>
              </div>
            </div>

            {/* Saved Notes List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {isLoading ? (
                <div className="space-y-2 p-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-gray-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : notes.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-500">
                  No notes found. Generate a smart note above!
                </div>
              ) : (
                notes.map((note) => {
                  const isActive = note.id === activeNote?.id;
                  return (
                    <div
                      key={note.id}
                      onClick={() => {
                        setIsEditing(false);
                        onSelectNote(note);
                      }}
                      className={`p-3 rounded-xl text-xs cursor-pointer transition flex items-start justify-between gap-2 border ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/40 border-cyan-500/60 text-white font-medium shadow-md'
                          : 'bg-gray-800/40 hover:bg-gray-800 border-transparent text-gray-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-semibold text-white">{note.title}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{note.summary || 'AI Generated Note'}</p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(note.id);
                        }}
                        className={`text-sm transition ${note.isFavorite ? 'text-amber-400' : 'text-gray-600 hover:text-gray-400'}`}
                      >
                        ★
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Note Viewer & Editor */}
          <div className="flex-1 flex flex-col h-full bg-gray-900/90 min-w-0">
            {activeNote ? (
              <>
                {/* Note Action Toolbar */}
                <div className="px-6 py-3 border-b border-gray-800 bg-gray-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2.5 py-1 bg-cyan-950 border border-cyan-500/40 text-cyan-400 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0">
                      {activeNote.noteType.replace('_', ' ')}
                    </span>
                    <h3 className="font-bold text-white text-base truncate">{activeNote.title}</h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {isEditing ? (
                      <button
                        onClick={handleSaveEdit}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition"
                      >
                        Save Changes
                      </button>
                    ) : (
                      <button
                        onClick={handleStartEdit}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 rounded-lg font-medium transition"
                      >
                        ✏️ Edit Note
                      </button>
                    )}

                    <button
                      onClick={() => onRegenerateNote(activeNote.id)}
                      disabled={isGenerating}
                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-cyan-400 border border-gray-700 rounded-lg font-medium transition disabled:opacity-50"
                      title="Regenerate note with AI"
                    >
                      🔄 Regenerate
                    </button>

                    <button
                      onClick={() => onExportMarkdown(activeNote)}
                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 rounded-lg font-medium transition"
                      title="Download Markdown file"
                    >
                      📥 .MD
                    </button>

                    <button
                      onClick={() => onExportPdf(activeNote)}
                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 rounded-lg font-medium transition"
                      title="Print / Save PDF"
                    >
                      🖨️ PDF
                    </button>

                    <button
                      onClick={() => onDeleteNote(activeNote.id)}
                      className="p-1.5 text-rose-400 hover:bg-gray-800 rounded-lg transition"
                      title="Delete Note"
                    >
                      🗑
                    </button>
                  </div>
                </div>

                {/* Note Content Area */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Title</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Markdown Content</label>
                        <textarea
                          rows={20}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl text-xs font-mono text-gray-200 focus:outline-none focus:border-cyan-500 leading-relaxed"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-invert max-w-none">
                      <RichMarkdownRenderer content={activeNote.content} />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
                <span className="text-5xl mb-4">📝</span>
                <h3 className="font-bold text-white text-base">Select or Generate a Note</h3>
                <p className="text-xs text-gray-400 max-w-md mt-1">
                  Choose a note type on the left to generate executive summaries, revision sheets, formula lists, or visual Mind Maps.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesDrawer;
