import React from 'react';
import { AiConversation } from '../../types/ai.types';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  conversation: AiConversation | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  conversation,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !conversation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-gray-800 border border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
        <div className="flex items-center gap-3 border-b border-gray-700 pb-3 text-rose-400 font-bold text-base">
          <span className="p-2 bg-rose-500/20 rounded-xl">⚠️</span>
          <span>Permanent Delete Confirmation</span>
        </div>

        <p className="text-gray-300 leading-relaxed">
          Are you sure you want to permanently delete this conversation? This action <strong className="text-rose-400">cannot be undone</strong>.
        </p>

        <div className="p-3 bg-gray-900 border border-gray-700 rounded-xl">
          <p className="text-[10px] text-gray-400 font-semibold uppercase">Chat Title</p>
          <p className="font-bold text-white text-sm truncate mt-0.5">{conversation.title}</p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition shadow-lg"
          >
            Permanently Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
