import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const Loader: React.FC<LoaderProps> = ({ size = 'md', label }) => {
  const sizeClasses = {
    sm: 'h-5 w-5 border-2',
    md: 'h-10 w-10 border-3',
    lg: 'h-16 w-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-indigo-200 border-t-indigo-600`}
        role="status"
      />
      {label && <p className="text-sm font-medium text-gray-500">{label}</p>}
    </div>
  );
};
export default Loader;
