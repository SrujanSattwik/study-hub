import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import communityService from '../../services/community.service';
import { API_URL } from '../../services/api';

interface GroupChatProps {
  groupId: string;
  messages: any[];
  typingUsers: Record<string, any>;
  sendMessage: (content: string, parentId?: string | null, attachment?: { fileName: string; filePath: string; fileType: string; fileSize: number } | null) => void;
  sendTyping: (isTyping: boolean) => void;
}

export const GroupChat: React.FC<GroupChatProps> = ({
  groupId,
  messages,
  typingUsers,
  sendMessage,
  sendTyping,
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !attachedFile) return;

    let attachmentPayload = null;

    if (attachedFile) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', attachedFile);
        const uploadRes = await communityService.uploadChatAttachment(groupId, formData);
        attachmentPayload = {
          fileName: uploadRes.fileName,
          filePath: uploadRes.filePath,
          fileType: uploadRes.fileType,
          fileSize: uploadRes.fileSize,
        };
      } catch (err) {
        alert('File upload failed. Please try again.');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    sendMessage(content.trim(), replyTo?.messageId || null, attachmentPayload);
    setContent('');
    setReplyTo(null);
    setAttachedFile(null);
    sendTyping(false);
  };

  // Extract other members typing list
  const activeTyping = Object.entries(typingUsers)
    .filter(([uId, typingState]) => uId !== user?.user_id && typingState)
    .map(([_, typingState]) => typeof typingState === 'string' ? typingState : 'Someone');

  return (
    <div className="flex flex-col h-[500px] border border-gray-200 rounded-2xl bg-white overflow-hidden shadow-sm">
      {/* Thread Reply Banner */}
      {replyTo && (
        <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-indigo-700 truncate">
            Replying to {replyTo.authorName}: "{replyTo.content || 'Attachment'}"
          </span>
          <button onClick={() => setReplyTo(null)} className="text-indigo-400 hover:text-indigo-600">
            <i className="fas fa-times text-xs" />
          </button>
        </div>
      )}

      {/* Attached File Banner */}
      {attachedFile && (
        <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-700 truncate flex items-center gap-1.5">
            <i className="fas fa-paperclip text-[10px]" />
            File attached: {attachedFile.name} ({(attachedFile.size / 1024).toFixed(0)} KB)
          </span>
          <button onClick={() => setAttachedFile(null)} className="text-emerald-400 hover:text-emerald-600">
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
                    ? 'bg-indigo-650 text-white rounded-br-none'
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
                
                {msg.content && <p className="leading-relaxed break-words">{msg.content}</p>}

                {/* Attachments rendering */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 space-y-1.5 max-w-sm">
                    {msg.attachments.map((att: any, idx: number) => {
                      const isImg = ['png', 'jpg', 'jpeg', 'gif'].includes(att.fileType.toLowerCase());
                      const attUrl = att.filePath.startsWith('/') ? `${API_URL}${att.filePath}` : att.filePath;
                      return (
                        <div key={idx} className="mt-1">
                          {isImg ? (
                            <img
                              src={attUrl}
                              alt={att.fileName}
                              onClick={() => window.open(attUrl, '_blank')}
                              className="max-h-48 rounded-xl object-cover border border-white/20 shadow-inner cursor-pointer"
                            />
                          ) : (
                            <a
                              href={attUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold border transition-colors select-none ${
                                isMe
                                  ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                                  : 'bg-slate-50 hover:bg-slate-100 border-gray-200 text-indigo-700'
                              }`}
                            >
                              <i className="fas fa-file-download text-sm" />
                              <div className="truncate flex-1">
                                <p className="truncate leading-none">{att.fileName}</p>
                                <span className="text-[9px] opacity-75">
                                  ({(att.fileSize / 1024).toFixed(0)} KB)
                                </span>
                              </div>
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

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
          {activeTyping.join(', ')} {activeTyping.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="border-t border-gray-150 p-4 bg-white flex gap-2.5 items-center">
        <input
          type="file"
          id="chat-file-input"
          onChange={(e) => setAttachedFile(e.target.files?.[0] || null)}
          className="hidden"
        />
        <label
          htmlFor="chat-file-input"
          className="p-2 border border-gray-250 hover:bg-slate-50 text-gray-500 rounded-xl cursor-pointer select-none transition-colors h-[38px] w-[38px] flex items-center justify-center shrink-0"
          title="Attach file"
        >
          <i className="fas fa-paperclip text-xs" />
        </label>
        
        <input
          type="text"
          value={content}
          onChange={handleInputChange}
          placeholder={replyTo ? "Type your reply..." : "Send a message..."}
          className="flex-1 px-4 py-2 border border-gray-250 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 h-[38px]"
        />
        
        <Button
          type="submit"
          variant="primary"
          size="sm"
          className="px-5 shrink-0 h-[38px]"
          isLoading={isUploading}
        >
          <i className="fas fa-paper-plane text-xs" />
        </Button>
      </form>
    </div>
  );
};
export default GroupChat;
