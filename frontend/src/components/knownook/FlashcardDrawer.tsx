import React, { useState } from 'react';
import { AiFlashcard, FlashcardDifficulty } from '../../types/ai.types';

interface FlashcardDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  flashcards: AiFlashcard[];
  onAddFlashcard: (data: { title: string; question: string; answer: string; formula?: string }) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteFlashcard: (id: string) => void;
}

export const FlashcardDrawer: React.FC<FlashcardDrawerProps> = ({
  isOpen,
  onClose,
  flashcards,
  onAddFlashcard,
  onToggleFavorite,
  onDeleteFlashcard,
}) => {
  const [search, setSearch] = useState('');
  const [showOnlyFavorite, setShowOnlyFavorite] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // New card form state
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [formula, setFormula] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !question.trim() || !answer.trim()) return;
    onAddFlashcard({ title: title.trim(), question: question.trim(), answer: answer.trim(), formula: formula.trim() || undefined });
    setTitle('');
    setQuestion('');
    setAnswer('');
    setFormula('');
    setIsAdding(false);
  };

  const filtered = flashcards.filter((f) => {
    if (showOnlyFavorite && !f.isFavorite) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return f.title.toLowerCase().includes(q) || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-800 border-l border-gray-700 h-full flex flex-col shadow-2xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </span>
            <h3 className="font-bold text-white text-base">Study Flashcards</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700">
            ✕
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="my-3 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search flashcards..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold"
            >
              {isAdding ? 'Cancel' : '+ New'}
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyFavorite}
              onChange={(e) => setShowOnlyFavorite(e.target.checked)}
              className="rounded bg-gray-900 border-gray-700 text-amber-500 focus:ring-0"
            />
            <span>Show Favorites Only ({flashcards.filter((f) => f.isFavorite).length})</span>
          </label>
        </div>

        {/* New Flashcard Form */}
        {isAdding && (
          <form onSubmit={handleSubmit} className="p-3 bg-gray-900 border border-amber-500/40 rounded-xl space-y-2 text-xs mb-3">
            <h4 className="font-semibold text-amber-400">Create Flashcard</h4>
            <input
              type="text"
              placeholder="Title (e.g. Quadratic Formula)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-white outline-none"
              required
            />
            <textarea
              placeholder="Question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-white outline-none resize-none"
              rows={2}
              required
            />
            <textarea
              placeholder="Answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-white outline-none resize-none"
              rows={2}
              required
            />
            <input
              type="text"
              placeholder="LaTeX / Formula (optional)"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-white outline-none font-mono text-[11px]"
            />
            <button type="submit" className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded">
              Save Card
            </button>
          </form>
        )}

        {/* Cards List */}
        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
          {filtered.length === 0 ? (
            <p className="text-center text-xs text-gray-400 p-6">No flashcards found.</p>
          ) : (
            filtered.map((card) => (
              <div key={card.id} className="p-3 bg-gray-900/90 border border-gray-700 rounded-xl space-y-1.5 text-xs relative group shadow">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-amber-300 truncate pr-6">{card.title}</h4>
                  <button
                    onClick={() => onToggleFavorite(card.id)}
                    className={`text-sm ${card.isFavorite ? 'text-amber-400' : 'text-gray-500 hover:text-amber-400'}`}
                  >
                    ★
                  </button>
                </div>

                <div className="text-gray-200">
                  <span className="text-amber-400 font-semibold">Q: </span>
                  {card.question}
                </div>

                <div className="text-gray-300 bg-gray-800/80 p-2 rounded border border-gray-700/50 mt-1">
                  <span className="text-emerald-400 font-semibold">A: </span>
                  {card.answer}
                </div>

                {card.formula && (
                  <div className="font-mono text-[11px] bg-black/40 text-cyan-300 p-1.5 rounded border border-cyan-900/40">
                    {card.formula}
                  </div>
                )}

                <button
                  onClick={() => onDeleteFlashcard(card.id)}
                  className="absolute top-2 right-8 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-400 text-xs transition"
                  title="Delete card"
                >
                  🗑
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FlashcardDrawer;
