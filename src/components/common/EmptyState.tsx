import React from 'react';
import { LucideIcon, FileQuestion } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = FileQuestion,
  actionText,
  onAction,
}) => {
  return (
    <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center my-4">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
      {description && <p className="text-xs text-slate-500 max-w-md mb-6">{description}</p>}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition shadow-xs"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
