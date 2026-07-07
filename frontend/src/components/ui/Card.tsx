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
      className={`rounded-2xl border border-gray-150 bg-white p-6 shadow-sm transition-all duration-200 ${
        isClickable ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : ''
      } ${className}`}
      onClick={onClick}
    >
      {(title || icon) && (
        <div className="mb-4 flex items-center justify-between">
          <div>
            {title && <h3 className="text-base font-bold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <i className={`${icon} text-lg`} />
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};
export default Card;
