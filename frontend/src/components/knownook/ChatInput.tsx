import React, { useState, useRef, useEffect } from 'react';
import { AiAttachment } from '../../types/ai.types';

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  attachedFiles: AiAttachment[];
  onUploadFile: (file: File) => void;
  onRemoveAttachment: (id: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onStop,
  isStreaming,
  attachedFiles,
  onUploadFile,
  onRemoveAttachment,
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-resize textarea height up to 160px
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!input.trim() || isStreaming) return;
    onSend(input.trim());
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onUploadFile(files[0]);
    }
  };

  return (
    <div className="p-3 md:p-4 border-t border-gray-700 bg-gray-800/90 backdrop-blur-md">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Attached Files List Pills */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-1">
            {attachedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-900/90 border border-gray-700 rounded-lg text-xs text-gray-200 shadow-sm"
              >
                <span className="font-semibold text-cyan-400 uppercase text-[10px]">
                  {file.extension.replace('.', '')}
                </span>
                <span className="truncate max-w-[140px]">{file.originalName}</span>
                <button
                  onClick={() => onRemoveAttachment(file.id)}
                  className="text-gray-400 hover:text-rose-400 ml-1 text-xs"
                  title="Remove file"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Bar Form */}
        <div className="relative flex items-end gap-2 bg-gray-900 border border-gray-700 focus-within:border-cyan-500 rounded-2xl p-2 transition shadow-lg">
          {/* File Upload Trigger */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-cyan-400 rounded-xl hover:bg-gray-800 transition shrink-0"
            title="Attach file (.pdf, .docx, .txt, .png)"
            disabled={isStreaming}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
          />

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask KnowNook AI anything... (Shift+Enter for newline)"
            className="flex-1 bg-transparent text-xs md:text-sm text-gray-100 placeholder-gray-400 focus:outline-none resize-none py-1.5 custom-scrollbar max-h-40"
          />

          {/* Action Button: Send or Stop Generation */}
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold shadow transition shrink-0 flex items-center gap-1 text-xs"
              title="Stop Generation (Esc)"
            >
              <span className="w-2.5 h-2.5 bg-white rounded-sm" />
              <span className="hidden sm:inline">Stop</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!input.trim()}
              className={`p-2 rounded-xl text-white font-semibold shadow transition shrink-0 flex items-center justify-center ${
                input.trim()
                  ? 'bg-cyan-600 hover:bg-cyan-500 scale-100 hover:scale-105 active:scale-95'
                  : 'bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed'
              }`}
              title="Send Message (Enter)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          )}
        </div>

        {/* Input Helper Footer */}
        <div className="flex items-center justify-between text-[10px] text-gray-400 px-2">
          <span>KnowNook AI Assistant • StudyHub Academic Engine</span>
          <span>{input.length} / 32,000</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
