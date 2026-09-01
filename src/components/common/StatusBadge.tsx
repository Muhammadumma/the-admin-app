import React from 'react';
import { SubmissionStatus, ClearanceOverallStatus, StageReviewStatus } from '../../types';

interface StatusBadgeProps {
  status:
    | SubmissionStatus
    | ClearanceOverallStatus
    | StageReviewStatus
    | 'ACTIVE'
    | 'DEACTIVATED'
    | 'PAUSED'
    | 'SUPER_ADMIN'
    | 'ADMIN'
    | 'STAFF';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  let bg = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = status as string;
  let dotColor = 'bg-slate-400';

  switch (status) {
    case 'approved':
    case 'completed':
    case 'ACTIVE':
      bg = 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
      dotColor = 'bg-emerald-500';
      label = status === 'completed' ? 'Completed' : status === 'approved' ? 'Approved' : 'Active';
      break;

    case 'pending':
    case 'awaiting_review':
      bg = 'bg-amber-50 text-amber-800 border-amber-200/80';
      dotColor = 'bg-amber-500';
      label = status === 'awaiting_review' ? 'Awaiting Review' : 'Pending Review';
      break;

    case 'rejected':
    case 'DEACTIVATED':
    case 'PAUSED':
      bg = 'bg-rose-50 text-rose-800 border-rose-200/80';
      dotColor = 'bg-rose-500';
      label = status === 'rejected' ? 'Rejected' : status === 'DEACTIVATED' ? 'Deactivated' : 'Paused';
      break;

    case 'in_progress':
      bg = 'bg-blue-50 text-blue-800 border-blue-200/80';
      dotColor = 'bg-blue-500';
      label = 'In Progress';
      break;

    case 'not_started':
      bg = 'bg-slate-100 text-slate-600 border-slate-200';
      dotColor = 'bg-slate-400';
      label = 'Not Started';
      break;

    case 'SUPER_ADMIN':
      bg = 'bg-purple-50 text-purple-800 border-purple-200';
      dotColor = 'bg-purple-600';
      label = 'Super Admin';
      break;

    case 'ADMIN':
      bg = 'bg-indigo-50 text-indigo-800 border-indigo-200';
      dotColor = 'bg-indigo-600';
      label = 'Administrator';
      break;

    case 'STAFF':
      bg = 'bg-cyan-50 text-cyan-800 border-cyan-200';
      dotColor = 'bg-cyan-600';
      label = 'Staff Reviewer';
      break;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium gap-1',
    md: 'text-xs px-2.5 py-1 font-semibold gap-1.5',
    lg: 'text-sm px-3 py-1.5 font-semibold gap-2',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${bg} ${sizeClasses[size]} ${className} tracking-wide whitespace-nowrap`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {label}
    </span>
  );
};
