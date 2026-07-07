import React, { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={id}
            ref={ref}
            className={`w-full px-4 py-2.5 rounded-xl border ${
              error 
                ? 'border-rose-500 focus:ring-rose-500/10 focus:border-rose-500' 
                : 'border-gray-250 focus:ring-indigo-500/10 focus:border-indigo-600'
            } bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-4 ${className}`}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs font-bold text-rose-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
