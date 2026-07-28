import React, { useEffect, useRef, useState } from 'react';
import { AiMessage } from '../../types/ai.types';

import RichMarkdownRenderer from './RichMarkdownRenderer';

interface ChatMessageListProps {
  messages: AiMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingText: string;
  thinkingStatus: string | null;
  onRegenerate?: () => void;
  onDeleteMessage?: (messageId: string) => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isLoading,
  isStreaming,
  streamingText,
  thinkingStatus,
  onRegenerate,
  onDeleteMessage,
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Smart auto-scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (isNearBottom || isStreaming) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingText, thinkingStatus, isStreaming]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar"
      aria-label="Chat Messages"
    >
      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4 max-w-3xl mx-auto">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex gap-3 ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`h-16 rounded-2xl animate-pulse ${
                  i % 2 === 0 ? 'w-2/3 bg-cyan-950/40' : 'w-3/4 bg-gray-800/60'
                }`}
              />
            </div>
          ))}
        </div>
      ) : messages.length === 0 && !isStreaming ? (
        /* Empty Conversation State */
        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 max-w-lg mx-auto">
          <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center border border-cyan-500/30 mb-4 shadow-lg">
            <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Welcome to KnowNook AI Workspace</h3>
          <p className="text-xs text-gray-400 leading-relaxed mb-6">
            Ask any academic question, paste code snippets, or upload study materials. KnowNook provides step-by-step tutoring across all subjects.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full text-left">
            <div className="p-3 bg-gray-800/60 border border-gray-700/60 rounded-xl hover:border-cyan-500/50 transition cursor-pointer text-xs">
              <p className="font-semibold text-cyan-300">📐 Math & Calculus</p>
              <p className="text-gray-400 text-[11px] mt-0.5">Solve differential equations or quadratic formulas with step explanations.</p>
            </div>
            <div className="p-3 bg-gray-800/60 border border-gray-700/60 rounded-xl hover:border-cyan-500/50 transition cursor-pointer text-xs">
              <p className="font-semibold text-blue-300">💻 Programming Mentor</p>
              <p className="text-gray-400 text-[11px] mt-0.5">Debug Python, TypeScript, algorithms, or database queries.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Historical Messages */}
          {messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} group`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow shrink-0 mt-1">
                    AI
                  </div>
                )}

                <div
                  className={`relative max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-cyan-600 text-white rounded-tr-none shadow-md'
                      : 'bg-gray-800/90 border border-gray-700 text-gray-100 rounded-tl-none shadow'
                  }`}
                >
                  {/* Content */}
                  {isUser ? (
                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  ) : (
                    <RichMarkdownRenderer content={msg.content} />
                  )}

                  {/* Footer / Actions */}
                  <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-gray-700/40">
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-opacity">
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="hover:text-cyan-300 transition"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? 'Copied!' : 'Copy'}
                      </button>

                      {onDeleteMessage && (
                        <button
                          onClick={() => onDeleteMessage(msg.id)}
                          className="hover:text-rose-400 transition"
                          title="Delete message"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-gray-200 font-semibold text-xs shrink-0 mt-1">
                    You
                  </div>
                )}
              </div>
            );
          })}

          {/* Real-Time Thinking State Indicator */}
          {thinkingStatus && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow shrink-0 animate-pulse">
                AI
              </div>
              <div className="bg-gray-800/90 border border-gray-700 rounded-2xl p-4 text-xs text-cyan-400 flex items-center gap-2 shadow">
                <svg className="w-4 h-4 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>{thinkingStatus}</span>
              </div>
            </div>
          )}

          {/* Real-Time Streamed Assistant Bubble */}
          {isStreaming && streamingText && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow shrink-0 mt-1">
                AI
              </div>

              <div className="relative max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed bg-gray-800/90 border border-cyan-500/40 text-gray-100 rounded-tl-none shadow-lg">
                <RichMarkdownRenderer content={streamingText} isStreaming={true} />
                <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-pulse rounded-sm align-middle" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};

export default ChatMessageList;
