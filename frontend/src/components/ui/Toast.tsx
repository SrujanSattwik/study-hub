import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const bgColors = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    error: 'bg-rose-50 text-rose-800 border-rose-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  };

  const icons = {
    success: 'fa-check-circle text-emerald-500',
    error: 'fa-exclamation-circle text-rose-500',
    info: 'fa-info-circle text-blue-500',
  };

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-bounce ${bgColors[type]}`}
    >
      <i className={`fas ${icons[type]} text-lg`} />
      <span className="text-sm font-semibold">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 rounded-lg p-0.5 text-gray-400 hover:bg-black/5 hover:text-gray-600 transition-colors"
      >
        <i className="fas fa-times" />
      </button>
    </div>
  );
};
export default Toast;
