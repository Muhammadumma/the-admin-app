import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  subtitle?: string;
  accentColor?: 'navy' | 'emerald' | 'amber' | 'blue' | 'purple';
  onClick?: () => void;
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  subtitle,
  accentColor = 'navy',
  onClick,
  badge,
}) => {
  const colorStyles = {
    navy: {
      iconBg: 'bg-slate-900/90 text-white',
      borderLeft: '',
      textColor: 'text-slate-900',
      subTextColor: 'text-blue-600 font-semibold',
    },
    emerald: {
      iconBg: 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30',
      borderLeft: '',
      textColor: 'text-emerald-600',
      subTextColor: 'text-slate-500 font-semibold',
    },
    amber: {
      iconBg: 'bg-amber-500/20 text-amber-600 border border-amber-500/30',
      borderLeft: 'border-l-4 border-l-amber-400',
      textColor: 'text-amber-600',
      subTextColor: 'text-amber-700 font-semibold italic underline',
    },
    blue: {
      iconBg: 'bg-blue-500/20 text-blue-600 border border-blue-500/30',
      borderLeft: '',
      textColor: 'text-blue-600',
      subTextColor: 'text-slate-500 font-semibold',
    },
    purple: {
      iconBg: 'bg-purple-500/20 text-purple-600 border border-purple-500/30',
      borderLeft: '',
      textColor: 'text-purple-600',
      subTextColor: 'text-slate-500 font-semibold',
    },
  }[accentColor];

  return (
    <div
      onClick={onClick}
      className={`bg-white/80 backdrop-blur-md border border-white/60 p-5 rounded-2xl shadow-sm transition-all duration-200 ${
        colorStyles.borderLeft
      } ${
        onClick
          ? 'cursor-pointer hover:bg-white/90 hover:shadow-md hover:border-white/80 active:scale-[0.99]'
          : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            {title}
          </p>
          <h3 className={`text-3xl font-black tracking-tight tabular-nums ${colorStyles.textColor}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </h3>
          {subtitle && (
            <div className={`mt-2 text-xs ${colorStyles.subTextColor}`}>
              {subtitle}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className={`p-3 rounded-xl ${colorStyles.iconBg} shadow-xs`}>
            <Icon className="w-5 h-5" />
          </div>
          {badge && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100/90 text-slate-700 border border-slate-200/60">
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
