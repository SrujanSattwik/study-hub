import React, { useState } from 'react';
import MarkdownSanitizer from '../../utils/markdown-sanitizer';

interface RichMarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

export const RichMarkdownRenderer: React.FC<RichMarkdownRendererProps> = ({
  content,
  isStreaming = false,
}) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  // Balance streaming text & sanitize
  const safeText = isStreaming
    ? MarkdownSanitizer.balanceStreamingMarkdown(content)
    : MarkdownSanitizer.sanitizeHtml(content);

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  /**
   * Parse content blocks: Code blocks (```), Mermaid diagrams (```mermaid),
   * display math ($$), and Markdown text blocks.
   */
  const parseBlocks = (text: string) => {
    const blocks: Array<{ type: 'text' | 'code' | 'mermaid' | 'math'; content: string; language?: string }> = [];
    const lines = text.split('\n');

    let currentType: 'text' | 'code' | 'mermaid' | 'math' = 'text';
    let currentBuffer: string[] = [];
    let currentLang = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code or Mermaid fence start
      if (line.trim().startsWith('```')) {
        if (currentType === 'text') {
          if (currentBuffer.length > 0) {
            blocks.push({ type: 'text', content: currentBuffer.join('\n') });
            currentBuffer = [];
          }
          const rawLang = line.trim().slice(3).toLowerCase();
          if (rawLang === 'mermaid') {
            currentType = 'mermaid';
          } else {
            currentType = 'code';
            currentLang = rawLang || 'code';
          }
        } else {
          // Close block
          blocks.push({
            type: currentType,
            content: currentBuffer.join('\n'),
            language: currentLang,
          });
          currentBuffer = [];
          currentType = 'text';
          currentLang = '';
        }
        continue;
      }

      // Display math $$ start/end
      if (line.trim().startsWith('$$')) {
        if (currentType === 'text') {
          if (currentBuffer.length > 0) {
            blocks.push({ type: 'text', content: currentBuffer.join('\n') });
            currentBuffer = [];
          }
          currentType = 'math';
        } else if (currentType === 'math') {
          blocks.push({ type: 'math', content: currentBuffer.join('\n') });
          currentBuffer = [];
          currentType = 'text';
        }
        continue;
      }

      currentBuffer.push(line);
    }

    if (currentBuffer.length > 0) {
      blocks.push({
        type: currentType,
        content: currentBuffer.join('\n'),
        language: currentLang,
      });
    }

    return blocks;
  };

  /**
   * Inline formatter for bold, italic, inline code, inline math ($...$), and Citations.
   */
  const formatInline = (text: string): React.ReactNode[] => {
    // Replace citations [Doc: filename, Sec N] with badge tokens
    const citationRegex = /\[Doc:\s*([^,\]]+)(?:,\s*([^\]]+))?\]/g;
    const parts = text.split(citationRegex);

    // If citations detected
    const nodes: React.ReactNode[] = [];
    let matchIdx = 0;

    // Process citations and inline formatting
    const renderSimpleText = (str: string, keyPrefix: string) => {
      // Inline math $...$
      const mathParts = str.split(/\$([^$]+)\$/g);
      return mathParts.map((mPart, mIdx) => {
        if (mIdx % 2 === 1) {
          return (
            <span
              key={`${keyPrefix}-math-${mIdx}`}
              className="inline-block px-1.5 py-0.5 bg-black/40 text-cyan-300 font-mono text-xs rounded border border-cyan-900/40 my-0.5"
            >
              {mPart}
            </span>
          );
        }
        // Inline code `...`
        const codeParts = mPart.split(/`([^`]+)`/g);
        return codeParts.map((cPart, cIdx) => {
          if (cIdx % 2 === 1) {
            return (
              <code
                key={`${keyPrefix}-code-${cIdx}`}
                className="px-1.5 py-0.5 bg-gray-900 text-cyan-300 rounded font-mono text-xs border border-gray-700"
              >
                {cPart}
              </code>
            );
          }
          return cPart;
        });
      });
    };

    let textIdx = 0;
    const regex = /\[Doc:\s*([^,\]]+)(?:,\s*([^\]]+))?\]/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const precedingText = text.slice(textIdx, match.index);
      if (precedingText) {
        nodes.push(<React.Fragment key={`text-${textIdx}`}>{renderSimpleText(precedingText, `txt-${textIdx}`)}</React.Fragment>);
      }

      const docName = match[1];
      const docSection = match[2] || '';

      nodes.push(
        <span
          key={`cite-${match.index}`}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-cyan-950 to-blue-950 border border-cyan-700/60 rounded-lg text-xs font-semibold text-cyan-300 shadow-sm my-0.5 cursor-pointer hover:border-cyan-400 transition"
          title={`Source Reference: ${docName} ${docSection}`}
        >
          <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{docName}</span>
          {docSection && <span className="text-[10px] text-cyan-400 font-normal">({docSection})</span>}
        </span>
      );

      textIdx = regex.lastIndex;
    }

    if (textIdx < text.length) {
      nodes.push(<React.Fragment key={`text-end`}>{renderSimpleText(text.slice(textIdx), 'txt-end')}</React.Fragment>);
    }

    return nodes;
  };

  const blocks = parseBlocks(safeText);

  return (
    <div className="space-y-4 text-sm leading-relaxed font-sans text-gray-100">
      {blocks.map((block, idx) => {
        // ── Render Code Block ──────────────────────────────────────────────────
        if (block.type === 'code') {
          return (
            <div
              key={idx}
              className="my-3 rounded-xl overflow-hidden border border-gray-700 bg-gray-950 shadow-lg text-xs"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-gray-800 text-gray-400 font-mono text-[11px]">
                <span className="font-semibold text-cyan-400 uppercase">{block.language || 'code'}</span>
                <button
                  onClick={() => handleCopyCode(block.content, idx)}
                  className="hover:text-white transition flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>{copiedCodeIndex === idx ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              {/* Body */}
              <pre className="p-4 font-mono overflow-x-auto text-emerald-300 whitespace-pre leading-relaxed custom-scrollbar">
                <code>{block.content}</code>
              </pre>
            </div>
          );
        }

        // ── Render Mermaid Diagram ──────────────────────────────────────────────
        if (block.type === 'mermaid') {
          return (
            <div
              key={idx}
              className="my-3 p-4 bg-gray-950 border border-cyan-900/60 rounded-xl space-y-2 text-xs shadow-lg"
            >
              <div className="flex items-center justify-between text-cyan-400 font-semibold text-[11px] border-b border-gray-800 pb-1">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  Mermaid Diagram
                </span>
                <button
                  onClick={() => handleCopyCode(block.content, idx)}
                  className="hover:text-white transition"
                >
                  {copiedCodeIndex === idx ? 'Copied Source!' : 'Copy Diagram'}
                </button>
              </div>

              <pre className="p-3 bg-gray-900 rounded font-mono text-cyan-300 text-xs overflow-x-auto">
                <code>{block.content}</code>
              </pre>
            </div>
          );
        }

        // ── Render Display Math Block ──────────────────────────────────────────
        if (block.type === 'math') {
          return (
            <div
              key={idx}
              className="my-3 p-4 bg-black/60 border border-cyan-800/60 rounded-xl text-center font-mono text-sm text-cyan-300 shadow-md overflow-x-auto"
            >
              <div className="text-xs text-gray-400 mb-1 font-sans">Formula Block</div>
              <div>{block.content}</div>
            </div>
          );
        }

        // ── Render Standard Markdown Paragraphs / Lists ─────────────────────────
        const lines = block.content.split('\n');
        return (
          <div key={idx} className="space-y-2">
            {lines.map((line, lineIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={lineIdx} className="h-2" />;

              // Headings
              if (trimmed.startsWith('# ')) {
                return <h1 key={lineIdx} className="text-lg font-bold text-cyan-300 mt-3 mb-1 border-b border-gray-700 pb-1">{formatInline(trimmed.slice(2))}</h1>;
              }
              if (trimmed.startsWith('## ')) {
                return <h2 key={lineIdx} className="text-base font-bold text-white mt-3 mb-1">{formatInline(trimmed.slice(3))}</h2>;
              }
              if (trimmed.startsWith('### ')) {
                return <h3 key={lineIdx} className="text-sm font-semibold text-cyan-200 mt-2 mb-1">{formatInline(trimmed.slice(4))}</h3>;
              }

              // Bullet list
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return (
                  <div key={lineIdx} className="flex items-start gap-2 pl-3">
                    <span className="text-cyan-400 font-bold text-xs mt-1">•</span>
                    <div className="flex-1">{formatInline(trimmed.slice(2))}</div>
                  </div>
                );
              }

              // Numbered list
              const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
              if (numMatch) {
                return (
                  <div key={lineIdx} className="flex items-start gap-2 pl-3">
                    <span className="text-cyan-400 font-bold text-xs">{numMatch[1]}.</span>
                    <div className="flex-1">{formatInline(numMatch[2])}</div>
                  </div>
                );
              }

              // Blockquote
              if (trimmed.startsWith('> ')) {
                return (
                  <blockquote key={lineIdx} className="pl-3 border-l-2 border-cyan-400 italic text-gray-300 my-1 bg-cyan-950/20 py-1 rounded-r">
                    {formatInline(trimmed.slice(2))}
                  </blockquote>
                );
              }

              return <p key={lineIdx}>{formatInline(line)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
};

export default RichMarkdownRenderer;
