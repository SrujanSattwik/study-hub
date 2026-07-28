import React, { useEffect } from 'react';

export interface ToastData {
  id: string;
  message: string;
  onUndo?: () => void;
}

interface ToastNotificationProps {
  toast: ToastData | null;
  onDismiss: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-gray-900 border border-cyan-500/60 text-gray-100 rounded-2xl shadow-2xl animate-bounce text-xs">
      <span className="flex items-center gap-1.5 font-medium">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        {toast.message}
      </span>

      {toast.onUndo && (
        <button
          onClick={() => {
            toast.onUndo?.();
            onDismiss();
          }}
          className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition"
        >
          Undo
        </button>
      )}

      <button onClick={onDismiss} className="text-gray-400 hover:text-white ml-1 font-bold">
        ✕
      </button>
    </div>
  );
};

export default ToastNotification;
