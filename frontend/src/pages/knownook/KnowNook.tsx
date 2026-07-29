import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useKnownook } from '../../hooks/useKnownook';
import { useKnownookStream } from '../../hooks/useKnownookStream';
import attachmentService from '../../services/attachment.service';

import ConversationSidebar from '../../components/knownook/ConversationSidebar';
import ChatMessageList from '../../components/knownook/ChatMessageList';
import ChatInput from '../../components/knownook/ChatInput';
import AttachmentPanel from '../../components/knownook/AttachmentPanel';
import FlashcardDrawer from '../../components/knownook/FlashcardDrawer';
import NotesDrawer from '../../components/knownook/NotesDrawer';
import QuizWorkspaceModal from '../../components/knownook/QuizWorkspaceModal';
import StudyPlannerModal from '../../components/knownook/StudyPlannerModal';
import KnowledgeLibraryModal from '../../components/knownook/KnowledgeLibraryModal';
import LearningIntelligenceModal from '../../components/knownook/LearningIntelligenceModal';
import UsagePanel from '../../components/knownook/UsagePanel';
import DocumentPreviewModal from '../../components/knownook/DocumentPreviewModal';
import ToastNotification from '../../components/knownook/ToastNotification';
import ConfirmDeleteModal from '../../components/knownook/ConfirmDeleteModal';
import { useKnownookNotes } from '../../hooks/useKnownookNotes';
import { useKnownookQuizzes } from '../../hooks/useKnownookQuizzes';
import { useKnownookPlanner } from '../../hooks/useKnownookPlanner';
import { useKnownookLibrary } from '../../hooks/useKnownookLibrary';
import { useKnownookIntelligence } from '../../hooks/useKnownookIntelligence';
import { AiAttachment, AiConversation } from '../../types/ai.types';

export const KnowNook: React.FC = () => {
  const { conversationId: urlConversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();

  const {
    conversations,
    allConversations,
    activeConversation,
    messages,
    attachments,
    flashcards,
    usageStats,
    isLoadingConversations,
    isLoadingMessages,
    searchQuery,
    setSearchQuery,
    filterTab,
    changeFilterTab,
    sortMode,
    changeSortMode,
    toast,
    triggerToast,
    dismissToast,
    pinnedCount,
    favoritesCount,
    archivedCount,
    recycleBinCount,

    // Multi-Select
    isMultiSelectMode,
    setIsMultiSelectMode,
    selectedChatIds,
    toggleSelectChat,
    clearSelection,
    bulkArchive,
    bulkDelete,
    bulkExport,
    bulkRestore,

    // Actions
    selectConversation,
    createNewChat,
    renameChat,
    togglePinChat,
    toggleFavoriteChat,
    toggleArchiveChat,
    deleteChat,
    duplicateChat,
    exportChat,
    restoreChat,
    permanentDeleteChat,
    appendUserMessage,
    refreshMessages,
    addFlashcard,
    toggleFavoriteFlashcard,
    deleteFlashcard,
    refreshUsage,
  } = useKnownook(urlConversationId);

  const {
    isStreaming,
    streamingText,
    thinkingStatus,
    startStream,
    stopStream,
  } = useKnownookStream();

  // AI Notes Hook & Overlay
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const {
    notes,
    activeNote,
    setActiveNote,
    isLoading: isLoadingNotes,
    isGenerating: isGeneratingNote,
    searchQuery: noteSearchQuery,
    setSearchQuery: setNoteSearchQuery,
    filterType: noteFilterType,
    setFilterType: setNoteFilterType,
    generateNote,
    regenerateNote,
    updateNote,
    toggleFavorite: toggleFavoriteNote,
    deleteNote,
    exportToMarkdown: exportNoteMarkdown,
    exportToPdf: exportNotePdf,
  } = useKnownookNotes(activeConversation?.id);

  // AI Quiz Hook & Overlay
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const {
    quizzes,
    activeQuiz,
    activeAttempt,
    setActiveAttempt,
    selectQuiz,
    isLoading: isLoadingQuizzes,
    isGenerating: isGeneratingQuiz,
    generateQuiz,
    submitAttempt,
    deleteQuiz,
  } = useKnownookQuizzes(activeConversation?.id);

  // AI Learning Planner Hook & Overlay
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const {
    plans,
    activePlan,
    goals,
    progress,
    recommendations,
    selectPlan,
    isLoading: isLoadingPlanner,
    isGenerating: isGeneratingPlan,
    generatePlan,
    updateTaskStatus,
    createGoal,
    logSession,
  } = useKnownookPlanner(activeConversation?.id);

  // Knowledge Library Hook & Overlay
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const {
    collections,
    bookmarks,
    tags,
    insights,
    searchResults,
    searchQuery: librarySearchQuery,
    isLoading: isLoadingLibrary,
    search: searchLibrary,
    createCollection,
    deleteCollection,
    createBookmark,
    deleteBookmark,
    exportBundle,
  } = useKnownookLibrary();

  // Learning Intelligence Hook & Overlay
  const [isIntelligenceOpen, setIsIntelligenceOpen] = useState(false);
  const {
    profile: intelProfile,
    masteries: intelMasteries,
    weakTopics: intelWeakTopics,
    recommendations: intelRecs,
    weeklyReport: intelWeeklyReport,
    achievements: intelAchievements,
    isLoading: isLoadingIntel,
    sendRecommendationFeedback,
  } = useKnownookIntelligence();

  // Drawer & Modal overlays
  const [isFlashcardOpen, setIsFlashcardOpen] = useState(false);
  const [isUsageOpen, setIsUsageOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<AiAttachment | null>(null);
  const [pendingDeleteConversation, setPendingDeleteConversation] = useState<AiConversation | null>(null);

  // Keyboard Shortcuts: Ctrl+N (New Chat), Ctrl+K (Focus Search), Esc (Close search/menus)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createNewChat().then((chat) => navigate(`/knownook/${chat.id}`));
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('knownook-sidebar-search');
        searchInput?.focus();
      } else if (e.key === 'Escape') {
        setSearchQuery('');
        if (isMultiSelectMode) clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createNewChat, navigate, isMultiSelectMode, clearSelection, setSearchQuery]);

  // Sync active conversation with URL
  useEffect(() => {
    if (activeConversation && activeConversation.id !== urlConversationId) {
      navigate(`/knownook/${activeConversation.id}`, { replace: true });
    }
  }, [activeConversation?.id, urlConversationId, navigate]);

  // Handle Send Prompt
  const handleSendPrompt = async (text: string) => {
    let targetConv = activeConversation;

    if (!targetConv) {
      targetConv = await createNewChat(text.slice(0, 40));
    }

    appendUserMessage(text);

    startStream(targetConv.id, text, () => {
      refreshMessages();
      refreshUsage();
    });
  };

  // Handle File Upload
  const handleUploadFile = async (file: File) => {
    if (!activeConversation) return;

    try {
      await attachmentService.registerAttachment(activeConversation.id, {
        originalName: file.name,
        storedName: `${Date.now()}_${file.name}`,
        extension: `.${file.name.split('.').pop() || 'txt'}`,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        uploadPath: `/uploads/ai/${file.name}`,
      });
      refreshMessages();
    } catch (err) {
      console.error('File upload failed:', err);
    }
  };

  // Handle File Delete
  const handleRemoveAttachment = async (id: string) => {
    try {
      await attachmentService.deleteAttachment(id);
      refreshMessages();
    } catch (err) {
      console.error('Attachment removal failed:', err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full bg-gray-900 text-gray-100 overflow-hidden font-sans">
      {/* 1. Left Conversation Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        activeId={activeConversation?.id}
        isLoading={isLoadingConversations}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterTab={filterTab}
        onFilterTabChange={changeFilterTab}
        sortMode={sortMode}
        onSortModeChange={changeSortMode}
        pinnedCount={pinnedCount}
        favoritesCount={favoritesCount}
        archivedCount={archivedCount}
        recycleBinCount={recycleBinCount}

        // Multi-select
        isMultiSelectMode={isMultiSelectMode}
        onToggleMultiSelectMode={() => setIsMultiSelectMode(!isMultiSelectMode)}
        selectedChatIds={selectedChatIds}
        onToggleSelectChat={toggleSelectChat}
        onBulkArchive={bulkArchive}
        onBulkDelete={bulkDelete}
        onBulkExport={bulkExport}
        onBulkRestore={bulkRestore}

        // Single Actions
        onSelectChat={(id) => {
          selectConversation(id);
          navigate(`/knownook/${id}`);
        }}
        onNewChat={async () => {
          const chat = await createNewChat();
          navigate(`/knownook/${chat.id}`);
        }}
        onRenameChat={renameChat}
        onPinChat={togglePinChat}
        onFavoriteChat={toggleFavoriteChat}
        onArchiveChat={(id) => {
          toggleArchiveChat(id);
          triggerToast('Chat archived.', () => toggleArchiveChat(id));
        }}
        onDeleteChat={(id) => {
          deleteChat(id);
          triggerToast('Moved to Recycle Bin.', () => restoreChat(id));
        }}
        onDuplicateChat={async (id) => {
          const chat = await duplicateChat(id);
          if (chat) {
            navigate(`/knownook/${chat.id}`);
            triggerToast('Chat duplicated.');
          }
        }}
        onExportChat={(id) => {
          exportChat(id);
          triggerToast('Chat exported to Markdown.');
        }}
        onRestoreChat={(id) => {
          restoreChat(id);
          triggerToast('Chat restored to Workspace.');
        }}
        onPermanentDeleteChat={(id) => {
          const found = allConversations.find((c) => c.id === id);
          if (found) setPendingDeleteConversation(found);
        }}

        onOpenFlashcards={() => setIsFlashcardOpen(true)}
        onOpenNotes={() => setIsNotesOpen(true)}
        onOpenQuizzes={() => setIsQuizOpen(true)}
        onOpenPlanner={() => setIsPlannerOpen(true)}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onOpenIntelligence={() => setIsIntelligenceOpen(true)}
        onOpenUsage={() => setIsUsageOpen(true)}
      />

      {/* 2. Main Workspace / Chat Canvas */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-gray-900/95 relative">
        {/* Workspace Header */}
        <header className="px-4 py-3 border-b border-gray-700/80 bg-gray-800/40 backdrop-blur flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-bold text-white text-sm md:text-base truncate">
              {activeConversation ? activeConversation.title : 'KnowNook AI Workspace'}
            </h1>
            {activeConversation?.isPinned && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded text-[10px] font-semibold shrink-0">
                Pinned
              </span>
            )}
            {activeConversation?.metadata?.isFavorite && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-semibold shrink-0">
                ★ Starred
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="hidden sm:inline">Model: <strong className="text-cyan-400 font-semibold">Gemini 2.0 Flash</strong></span>
          </div>
        </header>

        {/* Attachment Banner */}
        <AttachmentPanel
          attachments={attachments}
          onRemove={handleRemoveAttachment}
          onPreview={(att) => setPreviewAttachment(att)}
        />

        {/* Chat Messages Canvas */}
        <ChatMessageList
          messages={messages}
          isLoading={isLoadingMessages}
          isStreaming={isStreaming}
          streamingText={streamingText}
          thinkingStatus={thinkingStatus}
          onDeleteMessage={async () => {
            refreshMessages();
          }}
        />

        {/* Chat Input Bar */}
        <ChatInput
          onSend={handleSendPrompt}
          onStop={stopStream}
          isStreaming={isStreaming}
          attachedFiles={attachments}
          onUploadFile={handleUploadFile}
          onRemoveAttachment={handleRemoveAttachment}
        />
      </main>

      {/* 3. Flashcard Drawer Overlay */}
      <FlashcardDrawer
        isOpen={isFlashcardOpen}
        onClose={() => setIsFlashcardOpen(false)}
        flashcards={flashcards}
        onAddFlashcard={addFlashcard}
        onToggleFavorite={toggleFavoriteFlashcard}
        onDeleteFlashcard={deleteFlashcard}
        onGenerateQuizFromDeck={(topic) => {
          setIsQuizOpen(true);
          generateQuiz({ topic: topic || 'Flashcard Deck Review', sourceType: 'flashcards' });
        }}
      />

      {/* 4. Usage Metrics Modal */}
      <UsagePanel
        isOpen={isUsageOpen}
        onClose={() => setIsUsageOpen(false)}
        stats={usageStats}
      />

      {/* 5. Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        attachment={previewAttachment}
      />

      {/* 6. AI Notes Workspace Drawer */}
      <NotesDrawer
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        notes={notes}
        activeNote={activeNote}
        onSelectNote={setActiveNote}
        isLoading={isLoadingNotes}
        isGenerating={isGeneratingNote}
        searchQuery={noteSearchQuery}
        onSearchChange={setNoteSearchQuery}
        filterType={noteFilterType}
        onFilterChange={setNoteFilterType}
        onGenerateNote={generateNote}
        onRegenerateNote={regenerateNote}
        onUpdateNote={updateNote}
        onToggleFavorite={toggleFavoriteNote}
        onDeleteNote={deleteNote}
        onExportMarkdown={exportNoteMarkdown}
        onExportPdf={exportNotePdf}
      />

      {/* 7. AI Quiz & Assessment Hub Modal */}
      <QuizWorkspaceModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        quizzes={quizzes}
        activeQuiz={activeQuiz}
        activeAttempt={activeAttempt}
        onSelectQuiz={selectQuiz}
        onGenerateQuiz={generateQuiz}
        onSubmitAttempt={submitAttempt}
        onDeleteQuiz={deleteQuiz}
        onResetAttempt={() => setActiveAttempt(null)}
        onCreateFlashcardFromQuestion={(qText, ans) => {
          addFlashcard({
            title: 'Quiz Review Concept',
            question: qText,
            answer: ans,
          });
          triggerToast('Created Flashcard from Quiz question!');
        }}
        isLoading={isLoadingQuizzes}
        isGenerating={isGeneratingQuiz}
      />

      {/* 8. AI Learning Planner & Progress Center Modal */}
      <StudyPlannerModal
        isOpen={isPlannerOpen}
        onClose={() => setIsPlannerOpen(false)}
        plans={plans}
        activePlan={activePlan}
        goals={goals}
        progress={progress}
        recommendations={recommendations}
        onSelectPlan={selectPlan}
        onGeneratePlan={generatePlan}
        onUpdateTaskStatus={updateTaskStatus}
        onCreateGoal={createGoal}
        onLogSession={logSession}
        isLoading={isLoadingPlanner}
        isGenerating={isGeneratingPlan}
      />

      {/* 9. Enterprise Knowledge Library Modal */}
      <KnowledgeLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        collections={collections}
        bookmarks={bookmarks}
        tags={tags}
        insights={insights}
        searchResults={searchResults}
        searchQuery={librarySearchQuery}
        onSearch={searchLibrary}
        onCreateCollection={createCollection}
        onDeleteCollection={deleteCollection}
        onDeleteBookmark={deleteBookmark}
        onExportBundle={exportBundle}
        isLoading={isLoadingLibrary}
      />

      {/* 10. Learning Intelligence & Personalization Engine Modal */}
      <LearningIntelligenceModal
        isOpen={isIntelligenceOpen}
        onClose={() => setIsIntelligenceOpen(false)}
        profile={intelProfile}
        masteries={intelMasteries}
        weakTopics={intelWeakTopics}
        recommendations={intelRecs}
        weeklyReport={intelWeeklyReport}
        achievements={intelAchievements}
        onFeedback={sendRecommendationFeedback}
        isLoading={isLoadingIntel}
      />

      {/* 11. Permanent Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!pendingDeleteConversation}
        conversation={pendingDeleteConversation}
        onConfirm={() => {
          if (pendingDeleteConversation) {
            permanentDeleteChat(pendingDeleteConversation.id);
            setPendingDeleteConversation(null);
            triggerToast('Conversation permanently deleted.');
          }
        }}
        onCancel={() => setPendingDeleteConversation(null)}
      />

      {/* 12. Floating Toast Undo Notification */}
      <ToastNotification toast={toast} onDismiss={dismissToast} />
    </div>
  );
};

export default KnowNook;
