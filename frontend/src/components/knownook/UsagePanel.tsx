import React from 'react';
import { AiUsageStats } from '../../types/ai.types';

interface UsagePanelProps {
  isOpen: boolean;
  onClose: () => void;
  stats: AiUsageStats | null;
}

export const UsagePanel: React.FC<UsagePanelProps> = ({ isOpen, onClose, stats }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-gray-700 pb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </span>
            <div>
              <h3 className="font-bold text-white text-lg">AI Usage Metrics</h3>
              <p className="text-xs text-gray-400">Token budget & activity stats</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700">
            ✕
          </button>
        </div>

        {stats ? (
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-gray-900 border border-gray-700 rounded-xl space-y-1">
              <p className="text-gray-400 font-semibold">Today's Tokens</p>
              <p className="text-2xl font-extrabold text-cyan-400">{stats.today.totalTokens.toLocaleString()}</p>
              <p className="text-[11px] text-gray-500">
                Prompt: {stats.today.promptTokens} | Completion: {stats.today.completionTokens}
              </p>
            </div>

            <div className="p-4 bg-gray-900 border border-gray-700 rounded-xl space-y-1">
              <p className="text-gray-400 font-semibold">Monthly Tokens</p>
              <p className="text-2xl font-extrabold text-emerald-400">{stats.monthly.totalTokens.toLocaleString()}</p>
              <p className="text-[11px] text-gray-500">{stats.monthly.requestCount} AI Requests</p>
            </div>

            <div className="p-4 bg-gray-900 border border-gray-700 rounded-xl space-y-1">
              <p className="text-gray-400 font-semibold">Total Conversations</p>
              <p className="text-xl font-bold text-white">{stats.totalConversations}</p>
            </div>

            <div className="p-4 bg-gray-900 border border-gray-700 rounded-xl space-y-1">
              <p className="text-gray-400 font-semibold">Saved Flashcards</p>
              <p className="text-xl font-bold text-amber-400">{stats.totalFlashcards}</p>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-gray-400">Loading metrics...</div>
        )}

        <div className="text-right">
          <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold rounded-xl">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsagePanel;
