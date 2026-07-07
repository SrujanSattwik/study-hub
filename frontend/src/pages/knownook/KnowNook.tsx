import React, { useState, useRef, useEffect } from 'react';
import aiService from '../../services/ai.service';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export const KnowNook: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      text: "Hello! I am your KnowNook Study Assistant, powered by Gemini. Ask me any doubts about your courses, homework questions, or exam schedules!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    
    // Add user message
    const userMsg: Message = {
      id: Date.now(),
      sender: 'user',
      text: userText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Map prompt payload to Backend Gemini beta model content structures
      const parts = [{ text: userText }];
      const answer = await aiService.askGemini(parts);

      const aiMsg: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        text: answer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        text: "I encountered an issue processing your query. Please make sure the Gemini API key is configured correctly on the server.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  const quickPrompts = [
    'Explain bubble sort algorithm simply',
    'What is the difference between TCP and UDP?',
    'Solve: integral of ln(x) dx',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-6">
      {/* Welcome Banner */}
      <section className="bg-white border border-gray-200 p-6 rounded-2xl flex items-center gap-4 shadow-sm">
        <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl flex-shrink-0">
          <i className="fas fa-brain animate-pulse" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900 leading-none">KnowNook AI Doubts Solver</h2>
          <p className="text-xs text-gray-500 mt-1">
            Get instant breakdowns for equations, definitions, and code algorithms.
          </p>
        </div>
      </section>

      {/* Main chat box */}
      <div className="flex-1 flex flex-col border border-gray-200 rounded-2xl bg-white overflow-hidden shadow-sm">
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/20">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[75%] items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div
                    className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                      isUser ? 'bg-indigo-600 text-white' : 'bg-purple-100 text-purple-600'
                    }`}
                  >
                    {isUser ? <i className="fas fa-user" /> : <i className="fas fa-robot" />}
                  </div>

                  <div className="space-y-1">
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-white border border-gray-150 text-gray-800 rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block px-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 items-center text-xs text-gray-400 font-bold uppercase tracking-wider bg-white border border-gray-150 px-4 py-2.5 rounded-2xl">
                <i className="fas fa-circle-notch animate-spin text-purple-500 mr-1" />
                <span>Gemini is thinking...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick Questions suggestion row (only if no messages are ongoing) */}
        {messages.length === 1 && !isLoading && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex gap-2 overflow-x-auto">
            {quickPrompts.map((qp) => (
              <button
                key={qp}
                onClick={() => handleQuickQuestion(qp)}
                className="text-[10px] font-bold text-gray-500 hover:text-indigo-600 hover:border-indigo-200 bg-white border border-gray-200 rounded-full px-4 py-1.5 whitespace-nowrap transition-colors"
              >
                {qp}
              </button>
            ))}
          </div>
        )}

        {/* Input box */}
        <form onSubmit={handleSend} className="border-t border-gray-150 p-4 flex gap-3 bg-white">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question or copy-paste equations..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-250 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
          <Button type="submit" variant="primary" size="sm" className="px-6" disabled={isLoading}>
            Ask AI
          </Button>
        </form>
      </div>
    </div>
  );
};
export default KnowNook;
