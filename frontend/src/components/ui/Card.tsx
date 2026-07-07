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
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 ${
        isClickable ? 'cursor-pointer hover:border-indigo-300 hover:shadow-md active:scale-[0.99]' : ''
      } ${className}`}
      onClick={onClick}
    >
      {(title || icon) && (
        <div className="mb-4 flex items-center justify-between">
          <div className="space-y-1">
            {title && <h3 className="text-[15px] font-semibold text-gray-900 tracking-tight leading-none">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-400 font-medium leading-normal">{subtitle}</p>}
          </div>
          {icon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
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
