import React, { useState, useRef, useEffect } from 'react';
import aiService from '../../services/ai.service';
import Button from '../../components/ui/Button';

interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  codeSnippet?: string;
  latexEquation?: string;
  timestamp: Date;
}

interface AttachedFile {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'docx' | 'ppt' | 'txt' | 'image' | 'video';
}

export const KnowNook: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      text: "Hello! I am your KnowNook AI Assistant. I can help you solve complex math equations, explain code algorithms, and summarize study materials.",
      latexEquation: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
      codeSnippet: `<pre class="bg-gray-800 p-4 rounded-lg">\n  <code>const solveQuadratic = (a, b, c) => {\n    const delta = Math.sqrt(b*b - 4*a*c);\n    return [(-b + delta)/(2*a), (-b - delta)/(2*a)];\n  }</code>\n</pre>`,
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<number | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([
    { id: '1', name: 'Calculus_Notes.pdf', size: '149 KB', type: 'pdf' },
    { id: '2', name: 'History_Essay.docx', size: '149 KB', type: 'docx' },
  ]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

    const userMsg: Message = {
      id: Date.now(),
      sender: 'user',
      text: userText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const parts = [{ text: userText }];
      const answer = await aiService.askGemini(parts);

      let codeSnippet: string | undefined = undefined;
      let latexEquation: string | undefined = undefined;

      // Extract code block or LaTeX if detected in response
      if (userText.toLowerCase().includes('code') || userText.toLowerCase().includes('sort') || userText.toLowerCase().includes('algorithm')) {
        codeSnippet = `<pre class="bg-gray-800 p-4 rounded-lg">\n  <code>// Solution algorithm generated\n  function processInput(data) {\n    return data.sort((a, b) => a - b);\n  }</code>\n</pre>`;
      }

      if (userText.toLowerCase().includes('integral') || userText.toLowerCase().includes('quadratic') || userText.toLowerCase().includes('formula') || userText.toLowerCase().includes('math')) {
        latexEquation = "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}";
      }

      const aiMsg: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        text: answer,
        codeSnippet,
        latexEquation,
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    let type: AttachedFile['type'] = 'txt';
    if (ext === 'pdf') type = 'pdf';
    else if (['doc', 'docx'].includes(ext)) type = 'docx';
    else if (['ppt', 'pptx'].includes(ext)) type = 'ppt';
    else if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) type = 'image';
    else if (['mp4', 'mov', 'avi'].includes(ext)) type = 'video';

    const newFile: AttachedFile = {
      id: Date.now().toString(),
      name: file.name,
      size: `${Math.round(file.size / 1024)} KB`,
      type,
    };

    setAttachedFiles((prev) => [...prev, newFile]);
  };

  const handleCopyCode = (id: number, codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const quickPrompts = [
    'Explain bubble sort algorithm simply',
    'What is the difference between TCP and UDP?',
    'Solve: integral of ln(x) dx',
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto font-body">
      {/* Title Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-extrabold text-slate-900 tracking-tight leading-tight">
            KnowNook AI Assistant
          </h1>
          <p className="text-sm text-slate-500 font-normal mt-1">
            Real-time doubt solver, formula generator, and smart study assistant
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] animate-pulse" />
          <span>Gemini 2.0 Active</span>
        </div>
      </div>

      {/* Main Workspace Layout (2 Columns: Chat Pane + Attached Context Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Central Chat Pane (Width ~780px / 8 columns) */}
        <div className="lg:col-span-8 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-[740px]">
          {/* Conversation Scroll Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[85%] items-start ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs shadow-sm ${
                        isUser
                          ? 'bg-[#6366F1] text-white'
                          : 'bg-gradient-to-tr from-[#6366F1] to-[#06B6D4] text-white'
                      }`}
                    >
                      {isUser ? <i className="fas fa-user text-xs" /> : <i className="fas fa-robot text-xs" />}
                    </div>

                    {/* Message Card */}
                    <div className="space-y-3 flex-1">
                      <div
                        className={`p-4 rounded-2xl text-sm leading-relaxed ${
                          isUser
                            ? 'bg-[#6366F1] text-white rounded-tr-xs shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-xs space-y-3'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                        {/* Code Block formatted view */}
                        {msg.codeSnippet && !isUser && (
                          <div className="mt-3 rounded-xl overflow-hidden border border-slate-800 bg-[#0F172A] text-slate-100 shadow-md">
                            <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-slate-700 text-xs font-mono text-slate-400">
                              <span>Code block</span>
                              <button
                                onClick={() => handleCopyCode(msg.id, 'class=ADI \\\n  <lass="bg-gray-800 p-4 rounded-lg">\n  <code>...</code>')}
                                className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors"
                              >
                                <i className="fas fa-copy text-[10px]" />
                                <span>{copiedCodeId === msg.id ? 'Copied!' : 'Copy'}</span>
                              </button>
                            </div>
                            <div className="p-4 font-mono text-xs overflow-x-auto text-emerald-400 leading-relaxed">
                              <span className="text-indigo-400">&lt;pre</span> <span className="text-amber-300">class</span>=<span className="text-cyan-300">&quot;ADI&quot;</span> <span className="text-indigo-400">&gt;</span><br/>
                              &nbsp;&nbsp;&lt;<span className="text-[#06B6D4]">class</span>=<span className="text-emerald-300">&quot;bg-gray-800 p-4 rounded-lg&quot;</span>&gt;<br/>
                              &nbsp;&nbsp;&nbsp;&nbsp;&lt;code&gt;...&lt;/code&gt;<br/>
                              &nbsp;&nbsp;&lt;/pre&gt;<br/>
                              <span className="text-indigo-400">&lt;/&gt;</span>
                            </div>
                          </div>
                        )}

                        {/* LaTeX Math Equation Block */}
                        {msg.latexEquation && !isUser && (
                          <div className="mt-3 p-4 bg-indigo-50/40 border border-indigo-100/80 rounded-xl space-y-2">
                            <span className="text-[11px] font-bold text-[#6366F1] uppercase tracking-wider block">
                              LaTeX Equation:
                            </span>
                            <div className="py-3 px-4 bg-white border border-slate-200/80 rounded-lg shadow-xs flex items-center justify-center font-serif text-xl text-slate-900">
                              <span>
                                x = <span className="inline-block text-center border-b border-slate-900 pb-0.5 mx-1">-b &plusmn; &radic;<span className="border-t border-slate-900 px-0.5">b<sup>2</sup> - 4ac</span></span> / 2a
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono block text-right">
                              [Katex style]
                            </span>
                          </div>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-400 font-semibold block px-1">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 items-center text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-4 py-3 rounded-2xl shadow-xs">
                  <i className="fas fa-circle-notch animate-spin text-[#6366F1] text-sm" />
                  <span>Gemini is thinking...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Prompts Row */}
          {messages.length <= 2 && !isLoading && (
            <div className="px-6 py-2.5 border-t border-slate-100 bg-slate-50/60 flex gap-2 overflow-x-auto">
              {quickPrompts.map((qp) => (
                <button
                  key={qp}
                  onClick={() => setInput(qp)}
                  className="text-xs font-medium text-slate-600 hover:text-[#6366F1] hover:bg-white bg-slate-100 border border-slate-200 rounded-full px-3.5 py-1 whitespace-nowrap transition-all shadow-2xs"
                >
                  {qp}
                </button>
              ))}
            </div>
          )}

          {/* Sticky Input Bar */}
          <form onSubmit={handleSend} className="border-t border-slate-200/80 p-4 bg-white flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.docx,.doc,.ppt,.pptx,.txt,image/*,video/*"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-[#6366F1] transition-colors"
              title="Attach File"
            >
              <i className="fas fa-paperclip text-base" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Text cave message..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1] transition-all"
            />

            <button
              type="button"
              className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              title="Emoji"
            >
              <i className="far fa-smile text-base" />
            </button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="px-5 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-xl font-bold flex items-center gap-2 shadow-sm"
              disabled={isLoading}
            >
              <i className="fas fa-paper-plane text-xs" />
            </Button>
          </form>
        </div>

        {/* Right Sidebar (Attached Materials, Attached Sidebar, Context Sidebar ~350px / 4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Attached Materials Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
              Attached Materials
            </h3>

            <div className="space-y-3">
              {attachedFiles.map((file) => (
                <div
                  key={file.id}
                  className="h-[80px] p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3.5 overflow-hidden">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                      file.type === 'pdf'
                        ? 'bg-rose-50 text-rose-500 border border-rose-100'
                        : file.type === 'docx'
                        ? 'bg-blue-50 text-blue-500 border border-blue-100'
                        : 'bg-amber-50 text-amber-500 border border-amber-100'
                    }`}>
                      <i className={
                        file.type === 'pdf'
                          ? 'fas fa-file-pdf'
                          : file.type === 'docx'
                          ? 'fas fa-file-word'
                          : 'fas fa-file-alt'
                      } />
                    </div>

                    <div className="overflow-hidden">
                      <h4 className="text-sm font-bold text-slate-900 truncate leading-snug group-hover:text-[#6366F1] transition-colors">
                        {file.name}
                      </h4>
                      <p className="text-[12px] text-slate-400 font-medium mt-0.5">
                        {file.size}
                      </p>
                    </div>
                  </div>

                  <button className="text-slate-300 hover:text-slate-500 p-1">
                    <i className="fas fa-ellipsis-v text-xs" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 border border-dashed border-slate-300 hover:border-[#6366F1] hover:bg-indigo-50/30 text-slate-600 hover:text-[#6366F1] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <i className="fas fa-plus text-xs" />
              <span>Attach New Document</span>
            </button>
          </div>

          {/* Attached Sidebar / Tools */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
              Attached Sidebar
            </h3>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-3 text-slate-700 font-bold text-sm">
              <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                <i className="fas fa-file-signature text-xs" />
              </div>
              <span>LaTeX</span>
            </div>
          </div>

          {/* Context Sidebar / Math Flashcard */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
              Context Sidebar
            </h3>

            {/* Math Flashcard Card */}
            <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-purple-50/50 p-4 space-y-3 shadow-xs">
              <h4 className="text-sm font-bold text-slate-900">
                Math Flashcard
              </h4>

              <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex items-center justify-center font-serif text-lg text-slate-900 shadow-2xs">
                <span>
                  x = <span className="inline-block text-center border-b border-slate-900 pb-0.5 mx-1">-b &plusmn; &radic;<span className="border-t border-slate-900 px-0.5">b<sup>2</sup> - 4ac</span></span> / 2a
                </span>
              </div>

              <div className="text-[12px] text-slate-600 font-medium pt-1 space-y-1">
                <p>Generated: <code className="bg-white/80 px-1.5 py-0.5 rounded border border-indigo-100 font-mono text-slate-800">x &times; 2 + 4, z = -0</code></p>
                <button className="text-[11px] font-bold text-[#6366F1] hover:underline pt-1 block">
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowNook;
