import React from 'react';
import { LucideIcon, FileQuestion, AlertCircle } from 'lucide-react';

export const LoadingSkeleton: React.FC<{ rows?: number; type?: 'table' | 'card' | 'profile' }> = ({
  rows = 4,
  type = 'table',
}) => {
  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-slate-200 h-32 flex flex-col justify-between">
            <div className="h-4 bg-slate-200 rounded-md w-24 mb-2" />
            <div className="h-8 bg-slate-200 rounded-md w-16" />
            <div className="h-3 bg-slate-100 rounded-md w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'profile') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-200" />
          <div className="space-y-2">
            <div className="h-6 bg-slate-200 rounded-md w-48" />
            <div className="h-4 bg-slate-100 rounded-md w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-slate-100 rounded-lg" />
          <div className="h-20 bg-slate-100 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex gap-4">
        <div className="h-4 bg-slate-200 rounded-md w-32" />
        <div className="h-4 bg-slate-200 rounded-md w-24" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200" />
              <div className="space-y-1">
                <div className="h-4 bg-slate-200 rounded-md w-36" />
                <div className="h-3 bg-slate-100 rounded-md w-24" />
              </div>
            </div>
            <div className="h-6 bg-slate-200 rounded-md w-20" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
}> = ({
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
      {description && <p className="text-sm text-slate-500 max-w-md mb-6">{description}</p>}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition shadow-xs"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
