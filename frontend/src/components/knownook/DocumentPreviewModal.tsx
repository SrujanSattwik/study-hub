import React, { useState } from 'react';
import { AiAttachment } from '../../types/ai.types';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: AiAttachment | null;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  attachment,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen || !attachment) return null;

  const content = attachment.extractedText || attachment.ocrText || 'No text extracted for this file.';
  const lines = content.split('\n');

  const filteredLines = search.trim()
    ? lines.filter((l) => l.toLowerCase().includes(search.toLowerCase()))
    : lines;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-1 bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold rounded text-xs uppercase">
              {attachment.extension.replace('.', '')}
            </span>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-base truncate">{attachment.originalName}</h3>
              <p className="text-xs text-gray-400">
                {(attachment.fileSize / 1024).toFixed(0)} KB • Status: <span className="text-emerald-400 font-semibold">{attachment.status}</span>
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700">
            ✕
          </button>
        </div>

        {/* Search inside Document */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search inside this document..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Content Viewer Box */}
        <div className="flex-1 overflow-y-auto bg-gray-900 border border-gray-700 rounded-xl p-4 font-mono text-xs text-gray-200 leading-relaxed custom-scrollbar whitespace-pre-wrap">
          {filteredLines.length > 0 ? (
            filteredLines.join('\n')
          ) : (
            <p className="text-gray-500 italic text-center py-6">No matching lines found for "{search}".</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-700 pt-3">
          <span>SHA-256: <code className="text-[10px] text-gray-500 font-mono">{attachment.sha256Hash || 'N/A'}</code></span>
          <button onClick={onClose} className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;
