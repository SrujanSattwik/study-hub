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
          <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={`w-full px-4 py-2.5 rounded-xl border ${
            error ? 'border-rose-500 focus:ring-rose-500' : 'border-gray-250 focus:ring-indigo-500'
          } bg-white text-gray-900 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs font-medium text-rose-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
