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
import UsagePanel from '../../components/knownook/UsagePanel';
import DocumentPreviewModal from '../../components/knownook/DocumentPreviewModal';
import { AiAttachment } from '../../types/ai.types';

export const KnowNook: React.FC = () => {
  const { conversationId: urlConversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();

  const {
    conversations,
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
    selectConversation,
    createNewChat,
    renameChat,
    togglePinChat,
    toggleArchiveChat,
    deleteChat,
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

  // Drawer & Modal overlays
  const [isFlashcardOpen, setIsFlashcardOpen] = useState(false);
  const [isUsageOpen, setIsUsageOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<AiAttachment | null>(null);

  // Sync active conversation with URL
  useEffect(() => {
    if (activeConversation && activeConversation.id !== urlConversationId) {
      navigate(`/knownook/${activeConversation.id}`, { replace: true });
    }
  }, [activeConversation?.id, urlConversationId, navigate]);

  // Handle Send Prompt
  const handleSendPrompt = async (text: string) => {
    let targetConv = activeConversation;

    // If no active conversation, create one first
    if (!targetConv) {
      targetConv = await createNewChat(text.slice(0, 40));
    }

    // Append user message optimistically to UI
    appendUserMessage(text);

    // Start SSE token stream
    startStream(targetConv.id, text, () => {
      // On completed event, refresh messages and usage stats
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
        onArchiveChat={toggleArchiveChat}
        onDeleteChat={deleteChat}
        onOpenFlashcards={() => setIsFlashcardOpen(true)}
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
          onDeleteMessage={async (msgId) => {
            // Delete message and refresh list
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

      {/* 3. Slide-over Flashcard Drawer */}
      <FlashcardDrawer
        isOpen={isFlashcardOpen}
        onClose={() => setIsFlashcardOpen(false)}
        flashcards={flashcards}
        onAddFlashcard={addFlashcard}
        onToggleFavorite={toggleFavoriteFlashcard}
        onDeleteFlashcard={deleteFlashcard}
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
    </div>
  );
};

export default KnowNook;
