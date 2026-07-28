import React, { useState } from 'react';
import { AiConversation } from '../../types/ai.types';

interface ConversationSidebarProps {
  conversations: AiConversation[];
  activeId: string | undefined;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterTab: 'recent' | 'pinned' | 'archived';
  onFilterTabChange: (tab: 'recent' | 'pinned' | 'archived') => void;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onPinChat: (id: string) => void;
  onArchiveChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onOpenFlashcards: () => void;
  onOpenUsage: () => void;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  activeId,
  isLoading,
  searchQuery,
  onSearchChange,
  filterTab,
  onFilterTabChange,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onPinChat,
  onArchiveChat,
  onDeleteChat,
  onOpenFlashcards,
  onOpenUsage,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartRename = (e: React.MouseEvent, chat: AiConversation) => {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameChat(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <aside className="w-80 border-r border-gray-700 bg-gray-800/80 backdrop-blur-md flex flex-col h-full select-none" aria-label="Conversation Sidebar">
      {/* Header & New Chat */}
      <div className="p-4 border-b border-gray-700 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg text-white font-bold text-sm shadow-md">
              KN
            </span>
            <div>
              <h2 className="font-bold text-white text-base leading-tight">KnowNook AI</h2>
              <p className="text-xs text-cyan-400 font-medium">Study Workspace</p>
            </div>
          </div>
          <button
            onClick={onNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow transition-all hover:scale-105 active:scale-95"
            aria-label="New Chat (Ctrl+Shift+O)"
            title="New Chat (Ctrl+Shift+O)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-900/90 border border-gray-700 rounded-lg text-xs text-gray-200 placeholder-gray-400 focus:outline-none focus:border-cyan-500 transition"
          />
          <svg
            className="w-4 h-4 text-gray-400 absolute left-2.5 top-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Tab Filters */}
        <div className="flex border-b border-gray-700 text-xs font-medium">
          <button
            onClick={() => onFilterTabChange('recent')}
            className={`flex-1 py-1.5 text-center transition-colors border-b-2 ${
              filterTab === 'recent'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => onFilterTabChange('pinned')}
            className={`flex-1 py-1.5 text-center transition-colors border-b-2 ${
              filterTab === 'pinned'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Pinned
          </button>
          <button
            onClick={() => onFilterTabChange('archived')}
            className={`flex-1 py-1.5 text-center transition-colors border-b-2 ${
              filterTab === 'archived'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Archived
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {isLoading ? (
          /* Skeleton Loader */
          <div className="space-y-2 p-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-gray-700/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-400">
            <p>No {filterTab} conversations found.</p>
          </div>
        ) : (
          conversations.map((chat) => {
            const isActive = chat.id === activeId;
            const isEditing = editingId === chat.id;

            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`group relative flex items-center justify-between px-3 py-2.5 rounded-lg text-xs cursor-pointer transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-900/60 to-blue-900/40 text-white font-medium border-l-4 border-cyan-400 shadow-sm'
                    : 'text-gray-300 hover:bg-gray-700/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <svg className="w-4 h-4 shrink-0 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
                  </svg>

                  {isEditing ? (
                    <input
                      type="text"
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => handleSaveRename(chat.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(chat.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="w-full bg-gray-900 border border-cyan-500 rounded px-1.5 py-0.5 text-xs text-white outline-none"
                    />
                  ) : (
                    <span className="truncate">{chat.title}</span>
                  )}
                </div>

                {/* Quick Action Icons */}
                {!isEditing && (
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <button
                      onClick={(e) => handleStartRename(e, chat)}
                      title="Rename"
                      className="p-1 text-gray-400 hover:text-cyan-300 rounded hover:bg-gray-800"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPinChat(chat.id);
                      }}
                      title={chat.isPinned ? 'Unpin' : 'Pin'}
                      className={`p-1 rounded hover:bg-gray-800 ${chat.isPinned ? 'text-amber-400' : 'text-gray-400 hover:text-amber-400'}`}
                    >
                      <svg className="w-3.5 h-3.5" fill={chat.isPinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchiveChat(chat.id);
                      }}
                      title={chat.isArchived ? 'Restore' : 'Archive'}
                      className="p-1 text-gray-400 hover:text-blue-400 rounded hover:bg-gray-800"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v1a2 2 0 01-2 2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this conversation?')) onDeleteChat(chat.id);
                      }}
                      title="Delete"
                      className="p-1 text-gray-400 hover:text-rose-400 rounded hover:bg-gray-800"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Tools Drawer Triggers */}
      <div className="p-3 border-t border-gray-700 bg-gray-900/50 flex items-center justify-between gap-2">
        <button
          onClick={onOpenFlashcards}
          className="flex-1 py-1.5 px-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs font-medium text-gray-300 hover:text-white flex items-center justify-center gap-1.5 transition"
        >
          <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>Flashcards</span>
        </button>

        <button
          onClick={onOpenUsage}
          className="flex-1 py-1.5 px-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs font-medium text-gray-300 hover:text-white flex items-center justify-center gap-1.5 transition"
        >
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Usage</span>
        </button>
      </div>
    </aside>
  );
};

export default ConversationSidebar;
