import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const Loader: React.FC<LoaderProps> = ({ size = 'md', label }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-[3px]',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-4">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-indigo-100 border-t-indigo-600`}
        role="status"
      />
      {label && (
        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
};
export default Loader;
