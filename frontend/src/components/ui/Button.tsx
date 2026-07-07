import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-semibold rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-md shadow-indigo-200',
    secondary: 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 focus:ring-indigo-500',
    danger: 'bg-rose-500 text-white hover:bg-rose-600 focus:ring-rose-500 shadow-md shadow-rose-200',
    success: 'bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500 shadow-md shadow-emerald-200',
    ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-800 focus:ring-gray-300',
  };

  const sizes = {
    sm: 'px-4 py-1.5 text-xs',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base',
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};
export default Button;
