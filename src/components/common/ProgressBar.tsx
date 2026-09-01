import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showLabel = false,
  size = 'md',
  color,
  className = '',
}) => {
  const clamped = Math.min(100, Math.max(0, progress));

  const heightClass = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }[size];

  const getAutoColor = () => {
    if (color) return color;
    if (clamped >= 100) return 'bg-emerald-600';
    if (clamped >= 75) return 'bg-blue-600';
    if (clamped >= 50) return 'bg-indigo-600';
    if (clamped >= 25) return 'bg-amber-500';
    return 'bg-slate-400';
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1 text-xs font-semibold text-slate-700">
          <span>Progress</span>
          <span className="tabular-nums font-bold text-slate-900">{clamped}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${heightClass} border border-slate-200/60`}>
        <div
          className={`${heightClass} rounded-full transition-all duration-500 ease-out ${getAutoColor()}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
