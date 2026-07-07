import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';

interface GroupChatProps {
  messages: any[];
  typingUsers: Record<string, boolean>;
  sendMessage: (content: string, parentId?: string | null) => void;
  sendTyping: (isTyping: boolean) => void;
}

export const GroupChat: React.FC<GroupChatProps> = ({
  messages,
  typingUsers,
  sendMessage,
  sendTyping,
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimer = useRef<any>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
    sendTyping(true);

    if (typingTimer.current) clearTimeout(typingTimer.current);

    typingTimer.current = setTimeout(() => {
      sendTyping(false);
    }, 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    sendMessage(content.trim(), replyTo?.messageId || null);
    setContent('');
    setReplyTo(null);
    sendTyping(false);
  };

  // Extract other members typing list
  const activeTyping = Object.entries(typingUsers)
    .filter(([uId, isTyping]) => uId !== user?.user_id && isTyping)
    .map(([_, isTyping]) => 'Someone'); // we can show "Someone" or fetch names

  return (
    <div className="flex flex-col h-[500px] border border-gray-200 rounded-2xl bg-white overflow-hidden shadow-sm">
      {/* Thread Reply Banner */}
      {replyTo && (
        <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-indigo-700 truncate">
            Replying to {replyTo.authorName}: "{replyTo.content}"
          </span>
          <button onClick={() => setReplyTo(null)} className="text-indigo-400 hover:text-indigo-600">
            <i className="fas fa-times text-xs" />
          </button>
        </div>
      )}

      {/* Messages Panel */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
        {messages.map((msg) => {
          const isMe = msg.userId === user?.user_id;
          return (
            <div key={msg.messageId || Math.random()} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm shadow-sm relative group ${
                  isMe
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-white border border-gray-150 text-gray-800 rounded-bl-none'
                }`}
              >
                {!isMe && (
                  <p className="text-[10px] font-bold text-indigo-500 mb-0.5 tracking-wide">
                    {msg.authorName || 'Student'}
                  </p>
                )}
                
                {/* Reply context line */}
                {msg.parentId && (
                  <div className={`text-[10px] italic border-l-2 pl-2 mb-1.5 ${isMe ? 'border-white/50 text-white/70' : 'border-gray-300 text-gray-400'}`}>
                    Replying to another message
                  </div>
                )}
                
                <p className="leading-relaxed break-words">{msg.content}</p>

                {/* Reply quick icon */}
                <button
                  onClick={() => setReplyTo(msg)}
                  className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded ${
                    isMe ? 'text-white/75 hover:bg-white/10' : 'text-gray-400 hover:bg-gray-100'
                  }`}
                  title="Reply"
                >
                  <i className="fas fa-reply text-[10px]" />
                </button>
              </div>
              <span className="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-wider px-1">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Typing Indicators */}
      {activeTyping.length > 0 && (
        <div className="px-4 py-1.5 bg-white text-[10px] italic text-gray-400 font-bold">
          {activeTyping.join(', ')} is typing...
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="border-t border-gray-150 p-4 bg-white flex gap-3">
        <input
          type="text"
          value={content}
          onChange={handleInputChange}
          placeholder={replyTo ? "Type your reply..." : "Send a message..."}
          className="flex-1 px-4 py-2 border border-gray-250 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <Button type="submit" variant="primary" size="sm" className="px-5">
          <i className="fas fa-paper-plane" />
        </Button>
      </form>
    </div>
  );
};
export default GroupChat;
