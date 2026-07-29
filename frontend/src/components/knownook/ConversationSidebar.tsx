import React, { useState } from 'react';
import { AiConversation } from '../../types/ai.types';
import { groupConversationsByDate, formatRelativeTime, SortMode } from '../../utils/date-grouper';
import { SidebarTab } from '../../hooks/useKnownook';

interface ConversationSidebarProps {
  conversations: AiConversation[];
  activeId: string | undefined;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterTab: SidebarTab;
  onFilterTabChange: (tab: SidebarTab) => void;
  sortMode: SortMode;
  onSortModeChange: (mode: SortMode) => void;
  pinnedCount: number;
  favoritesCount: number;
  archivedCount: number;
  recycleBinCount: number;

  // Multi-select state
  isMultiSelectMode: boolean;
  onToggleMultiSelectMode: () => void;
  selectedChatIds: string[];
  onToggleSelectChat: (id: string) => void;
  onBulkArchive: () => void;
  onBulkDelete: () => void;
  onBulkExport: () => void;
  onBulkRestore: () => void;

  // Actions
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onPinChat: (id: string) => void;
  onFavoriteChat: (id: string) => void;
  onArchiveChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onDuplicateChat: (id: string) => void;
  onExportChat: (id: string) => void;
  onRestoreChat: (id: string) => void;
  onPermanentDeleteChat: (id: string) => void;

  onOpenFlashcards: () => void;
  onOpenNotes: () => void;
  onOpenQuizzes: () => void;
  onOpenPlanner: () => void;
  onOpenUsage: () => void;
}

const LOCAL_STORAGE_COLLAPSED_GROUPS = 'knownook_collapsed_date_groups';

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  activeId,
  isLoading,
  searchQuery,
  onSearchChange,
  filterTab,
  onFilterTabChange,
  sortMode,
  onSortModeChange,
  pinnedCount,
  favoritesCount,
  archivedCount,
  recycleBinCount,

  isMultiSelectMode,
  onToggleMultiSelectMode,
  selectedChatIds,
  onToggleSelectChat,
  onBulkArchive,
  onBulkDelete,
  onBulkExport,
  onBulkRestore,

  onSelectChat,
  onNewChat,
  onRenameChat,
  onPinChat,
  onFavoriteChat,
  onArchiveChat,
  onDeleteChat,
  onDuplicateChat,
  onExportChat,
  onRestoreChat,
  onPermanentDeleteChat,

  onOpenFlashcards,
  onOpenNotes,
  onOpenQuizzes,
  onOpenPlanner,
  onOpenUsage,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Persistent collapsed date sections
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_STORAGE_COLLAPSED_GROUPS) || '{}');
    } catch {
      return {};
    }
  });

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [groupKey]: !prev[groupKey] };
      localStorage.setItem(LOCAL_STORAGE_COLLAPSED_GROUPS, JSON.stringify(next));
      return next;
    });
  };

  const handleStartRename = (e: React.MouseEvent, chat: AiConversation) => {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditTitle(chat.title);
    setOpenMenuId(null);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameChat(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const groupedWorkspace = filterTab === 'recent' ? groupConversationsByDate(conversations) : null;

  const renderChatItem = (chat: AiConversation) => {
    const isActive = chat.id === activeId;
    const isEditing = editingId === chat.id;
    const isSelected = selectedChatIds.includes(chat.id);
    const isMenuOpen = openMenuId === chat.id;

    return (
      <div
        key={chat.id}
        draggable={true}
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', chat.id);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onClick={() => {
          if (isMultiSelectMode) {
            onToggleSelectChat(chat.id);
          } else {
            onSelectChat(chat.id);
          }
        }}
        className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-all ${
          isActive && !isMultiSelectMode
            ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/50 text-white border-l-4 border-cyan-400 shadow-md font-medium'
            : isSelected
            ? 'bg-cyan-950/40 border border-cyan-500/60 text-white'
            : 'text-gray-300 hover:bg-gray-700/50 hover:text-white border border-transparent'
        }`}
      >
        {/* Checkbox for Multi-Select */}
        {isMultiSelectMode && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelectChat(chat.id)}
            onClick={(e) => e.stopPropagation()}
            className="mr-2.5 rounded bg-gray-900 border-gray-700 text-cyan-500 focus:ring-0 cursor-pointer"
          />
        )}

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
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="truncate font-semibold">{chat.title}</span>
                <span className="text-[10px] text-gray-400 shrink-0">
                  {formatRelativeTime(chat.lastMessageAt || chat.createdAt)}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 truncate mt-0.5">
                {chat.summary || 'No summary available...'}
              </p>
            </div>
          )}
        </div>

        {/* 3-Dot Context Menu Trigger */}
        {!isEditing && !isMultiSelectMode && (
          <div className="relative ml-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(isMenuOpen ? null : chat.id);
              }}
              className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white rounded hover:bg-gray-800 transition"
              title="Chat Options"
            >
              ⋮
            </button>

            {/* Context Dropdown Menu */}
            {isMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-6 z-50 w-44 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-1 text-xs text-gray-200 space-y-0.5"
              >
                <button
                  onClick={(e) => handleStartRename(e, chat)}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-gray-800 rounded flex items-center gap-2"
                >
                  ✏️ Rename
                </button>
                <button
                  onClick={() => {
                    onPinChat(chat.id);
                    setOpenMenuId(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-gray-800 rounded flex items-center gap-2"
                >
                  {chat.isPinned ? '📌 Unpin' : '📌 Pin Chat'}
                </button>
                <button
                  onClick={() => {
                    onFavoriteChat(chat.id);
                    setOpenMenuId(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-gray-800 rounded flex items-center gap-2"
                >
                  {chat.metadata?.isFavorite ? '★ Unfavorite' : '★ Add to Favorites'}
                </button>
                <button
                  onClick={() => {
                    onArchiveChat(chat.id);
                    setOpenMenuId(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-gray-800 rounded flex items-center gap-2"
                >
                  {chat.isArchived ? '📂 Restore Chat' : '📂 Archive Chat'}
                </button>
                <button
                  onClick={() => {
                    onDuplicateChat(chat.id);
                    setOpenMenuId(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-gray-800 rounded flex items-center gap-2"
                >
                  📋 Duplicate Chat
                </button>
                <button
                  onClick={() => {
                    onExportChat(chat.id);
                    setOpenMenuId(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-gray-800 rounded flex items-center gap-2"
                >
                  📥 Export (.md)
                </button>

                <div className="border-t border-gray-800 my-1" />

                {chat.isDeleted ? (
                  <>
                    <button
                      onClick={() => {
                        onRestoreChat(chat.id);
                        setOpenMenuId(null);
                      }}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-gray-800 rounded text-emerald-400"
                    >
                      ♻️ Restore Chat
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Permanently delete this chat? This cannot be undone.')) {
                          onPermanentDeleteChat(chat.id);
                        }
                        setOpenMenuId(null);
                      }}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-gray-800 rounded text-rose-400"
                    >
                      ⚠️ Permanent Delete
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      onDeleteChat(chat.id);
                      setOpenMenuId(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-gray-800 rounded text-rose-400"
                  >
                    🗑 Move to Recycle Bin
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderDateGroup = (title: string, groupKey: string, items: AiConversation[]) => {
    if (!items || items.length === 0) return null;
    const isCollapsed = collapsedGroups[groupKey];

    return (
      <div key={groupKey} className="space-y-1 my-2">
        <button
          onClick={() => toggleGroupCollapse(groupKey)}
          className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold text-gray-400 hover:text-gray-200 uppercase tracking-wider transition"
        >
          <span>{title} ({items.length})</span>
          <span>{isCollapsed ? '►' : '▼'}</span>
        </button>
        {!isCollapsed && <div className="space-y-1 pl-1">{items.map(renderChatItem)}</div>}
      </div>
    );
  };

  return (
    <aside className="w-80 border-r border-gray-700 bg-gray-800/80 backdrop-blur-md flex flex-col h-full select-none" aria-label="Conversation Workspace Sidebar">
      {/* Sticky Header & New Chat */}
      <div className="p-4 border-b border-gray-700 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg text-white font-bold text-sm shadow-md">
              KN
            </span>
            <div>
              <h2 className="font-bold text-white text-base leading-tight">KnowNook Workspace</h2>
              <p className="text-xs text-cyan-400 font-medium">Enterprise History</p>
            </div>
          </div>

          <button
            onClick={onNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow transition hover:scale-105 active:scale-95"
            title="New Chat (Ctrl+N)"
          >
            <span>➕ New</span>
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <input
            id="knownook-sidebar-search"
            type="text"
            placeholder="Search chats... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-900/90 border border-gray-700 rounded-xl text-xs text-gray-200 placeholder-gray-400 focus:outline-none focus:border-cyan-500 transition"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Workspace Nav Tabs & Badges */}
        <div className="grid grid-cols-5 gap-1 bg-gray-900/80 p-1 rounded-xl text-[11px] font-medium text-center border border-gray-700/60">
          <button
            onClick={() => onFilterTabChange('recent')}
            className={`py-1 rounded-lg transition ${filterTab === 'recent' ? 'bg-cyan-600 text-white font-bold' : 'text-gray-400 hover:text-white'}`}
            title="Workspace chats"
          >
            💬
          </button>
          <button
            onClick={() => onFilterTabChange('pinned')}
            className={`py-1 rounded-lg transition relative ${filterTab === 'pinned' ? 'bg-cyan-600 text-white font-bold' : 'text-gray-400 hover:text-white'}`}
            title="Pinned chats"
          >
            📌 {pinnedCount > 0 && <span className="text-[9px] font-bold text-amber-400 ml-0.5">{pinnedCount}</span>}
          </button>
          <button
            onClick={() => onFilterTabChange('favorites')}
            className={`py-1 rounded-lg transition relative ${filterTab === 'favorites' ? 'bg-cyan-600 text-white font-bold' : 'text-gray-400 hover:text-white'}`}
            title="Favorite chats"
          >
            ★ {favoritesCount > 0 && <span className="text-[9px] font-bold text-amber-300 ml-0.5">{favoritesCount}</span>}
          </button>
          <button
            onClick={() => onFilterTabChange('archived')}
            className={`py-1 rounded-lg transition relative ${filterTab === 'archived' ? 'bg-cyan-600 text-white font-bold' : 'text-gray-400 hover:text-white'}`}
            title="Archived chats"
          >
            📂 {archivedCount > 0 && <span className="text-[9px] font-bold text-cyan-300 ml-0.5">{archivedCount}</span>}
          </button>
          <button
            onClick={() => onFilterTabChange('recycle_bin')}
            className={`py-1 rounded-lg transition relative ${filterTab === 'recycle_bin' ? 'bg-cyan-600 text-white font-bold' : 'text-gray-400 hover:text-white'}`}
            title="Recycle Bin"
          >
            🗑 {recycleBinCount > 0 && <span className="text-[9px] font-bold text-rose-400 ml-0.5">{recycleBinCount}</span>}
          </button>
        </div>

        {/* Multi-Select & Sort Toolbar */}
        <div className="flex items-center justify-between text-xs pt-1 gap-2">
          <button
            onClick={onToggleMultiSelectMode}
            className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition shrink-0 ${
              isMultiSelectMode ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-white'
            }`}
            title="Multi-select mode for bulk actions"
          >
            {isMultiSelectMode ? `Cancel (${selectedChatIds.length})` : 'Select Multiple'}
          </button>

          {!isMultiSelectMode && (
            <select
              value={sortMode}
              onChange={(e) => onSortModeChange(e.target.value as SortMode)}
              className="bg-gray-900 border border-gray-700 text-gray-300 rounded-lg text-[10px] px-2 py-1 focus:outline-none focus:border-cyan-500 font-medium"
              title="Sort conversations"
            >
              <option value="lastUpdated">🕒 Last Updated</option>
              <option value="dateCreated">📅 Date Created</option>
              <option value="alphabetical">🔤 Alphabetical (A-Z)</option>
              <option value="mostMessages">💬 Most Messages</option>
              <option value="recentlyOpened">👁 Recently Opened</option>
            </select>
          )}

          {isMultiSelectMode && selectedChatIds.length > 0 && (
            <div className="flex items-center gap-1">
              <button onClick={onBulkExport} className="p-1 text-cyan-400 hover:bg-gray-700 rounded" title="Bulk Export">
                📥
              </button>
              {filterTab === 'recycle_bin' ? (
                <button onClick={onBulkRestore} className="p-1 text-emerald-400 hover:bg-gray-700 rounded" title="Bulk Restore">
                  ♻️
                </button>
              ) : (
                <>
                  <button onClick={onBulkArchive} className="p-1 text-blue-400 hover:bg-gray-700 rounded" title="Bulk Archive">
                    📂
                  </button>
                  <button onClick={onBulkDelete} className="p-1 text-rose-400 hover:bg-gray-700 rounded" title="Bulk Delete">
                    🗑
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-700/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filterTab === 'recent' && groupedWorkspace ? (
          /* Date-Grouped Workspace View */
          <div>
            {renderDateGroup('Today', 'today', groupedWorkspace.today)}
            {renderDateGroup('Yesterday', 'yesterday', groupedWorkspace.yesterday)}
            {renderDateGroup('Last 7 Days', 'last7Days', groupedWorkspace.last7Days)}
            {renderDateGroup('Last 30 Days', 'last30Days', groupedWorkspace.last30Days)}
            {renderDateGroup('Older', 'older', groupedWorkspace.older)}

            {conversations.length === 0 && (
              <div className="p-6 text-center text-xs text-gray-400">No conversations in workspace.</div>
            )}
          </div>
        ) : (
          /* Flat Section List (Pinned / Favorites / Archived / Recycle Bin) */
          <div className="space-y-1">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">
                No {filterTab.replace('_', ' ')} conversations.
              </div>
            ) : (
              conversations.map(renderChatItem)
            )}
          </div>
        )}
      </div>

      {/* Footer Tools Drawer Triggers */}
      <div className="p-3 border-t border-gray-700 bg-gray-900/50 flex items-center justify-between gap-1">
        <button
          onClick={onOpenPlanner}
          className="flex-1 py-1.5 px-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-xs font-medium text-gray-300 hover:text-white flex items-center justify-center gap-1 transition"
          title="AI Learning Planner & Progress (Ctrl+Shift+P)"
        >
          <span className="text-emerald-400">📅</span>
          <span>Planner</span>
        </button>

        <button
          onClick={onOpenNotes}
          className="py-1.5 px-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-xs font-medium text-gray-300 hover:text-white flex items-center justify-center gap-1 transition"
          title="AI Notes Workspace (Ctrl+Shift+N)"
        >
          <span>📝</span>
        </button>

        <button
          onClick={onOpenQuizzes}
          className="py-1.5 px-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-xs font-medium text-gray-300 hover:text-white flex items-center justify-center gap-1 transition"
          title="AI Quizzes & Assessment (Ctrl+Shift+Q)"
        >
          <span className="text-rose-400">🎯</span>
        </button>

        <button
          onClick={onOpenFlashcards}
          className="py-1.5 px-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-xs font-medium text-gray-300 hover:text-white flex items-center justify-center gap-1 transition"
          title="AI Flashcards"
        >
          <span className="text-amber-400">🎴</span>
        </button>

        <button
          onClick={onOpenUsage}
          className="py-1.5 px-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-xs font-medium text-gray-300 hover:text-white flex items-center justify-center gap-1 transition"
          title="Usage Metrics"
        >
          <span className="text-cyan-400">📊</span>
        </button>
      </div>
    </aside>
  );
};

export default ConversationSidebar;
