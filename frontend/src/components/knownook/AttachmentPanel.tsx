import React from 'react';
import { AiAttachment } from '../../types/ai.types';

interface AttachmentPanelProps {
  attachments: AiAttachment[];
  onRemove: (id: string) => void;
}

export const AttachmentPanel: React.FC<AttachmentPanelProps> = ({ attachments, onRemove }) => {
  if (attachments.length === 0) return null;

  return (
    <div className="bg-gray-800/80 border-b border-gray-700 p-3 text-xs">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 mb-2">
        <h4 className="font-semibold text-gray-200 flex items-center gap-1.5">
          <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          Attached Materials ({attachments.length})
        </h4>
      </div>

      <div className="max-w-4xl mx-auto flex flex-wrap gap-2">
        {attachments.map((att) => (
          <div
            key={att.id}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-xl text-gray-200 shadow-sm"
          >
            <span className="px-1.5 py-0.5 bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold rounded text-[10px] uppercase">
              {att.extension.replace('.', '')}
            </span>
            <span className="truncate max-w-[180px] font-medium">{att.originalName}</span>
            <span className="text-[10px] text-gray-400">({(att.fileSize / 1024).toFixed(0)} KB)</span>
            <button
              onClick={() => onRemove(att.id)}
              className="text-gray-400 hover:text-rose-400 ml-1 font-bold"
              title="Delete attachment"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttachmentPanel;
