import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  icon?: string;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  icon,
  className = '',
  onClick,
}) => {
  const isClickable = !!onClick;

  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white/95 backdrop-blur-sm p-6 shadow-sm transition-all duration-300 ${
        isClickable ? 'cursor-pointer hover:-translate-y-1 hover:shadow-md hover:border-indigo-300 active:scale-[0.99]' : ''
      } ${className}`}
      onClick={onClick}
    >
      {(title || icon) && (
        <div className="mb-4 flex items-center justify-between">
          <div>
            {title && <h3 className="text-sm font-extrabold text-gray-900 tracking-tight leading-none">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-400 font-medium mt-1">{subtitle}</p>}
          </div>
          {icon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <i className={`${icon} text-sm`} />
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};
export default Card;
