import React from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  CircleDashed,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { ClearanceStage, ClearanceStageKey, StageReviewStatus } from '../../types';
import { useData } from '../../context/DataContext';
import { StatusBadge } from '../common/StatusBadge';

interface ClearanceTimelineProps {
  stagesStatus: Record<ClearanceStageKey, StageReviewStatus>;
  selectedStage?: ClearanceStageKey;
  onSelectStage?: (stageId: ClearanceStageKey) => void;
  interactive?: boolean;
  stages?: ClearanceStage[];
}

export const ClearanceTimeline: React.FC<ClearanceTimelineProps> = ({
  stagesStatus,
  selectedStage,
  onSelectStage,
  interactive = true,
  stages: customStages,
}) => {
  const { stages: liveStages } = useData();
  const stagesToDisplay = customStages || liveStages;

  const getStatusIcon = (status: StageReviewStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-600 animate-pulse" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-rose-600 fill-rose-100" />;
      default:
        return <CircleDashed className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
      {stagesToDisplay.map((stage, index) => {
        const status = stagesStatus[stage.id] || 'not_started';
        const isSelected = selectedStage === stage.id;

        const borderStyle = isSelected
          ? 'border-blue-600 ring-2 ring-blue-100 bg-blue-50/40'
          : 'border-slate-200 bg-white hover:border-slate-300';

        return (
          <div
            key={stage.id}
            onClick={() => interactive && onSelectStage && onSelectStage(stage.id)}
            className={`rounded-xl p-3.5 border transition-all ${borderStyle} ${
              interactive ? 'cursor-pointer' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Stage {index + 1}
              </span>
              <div className="flex items-center gap-1">
                {getStatusIcon(status)}
                <span className="text-[11px] font-bold capitalize text-slate-700">
                  {status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 leading-tight">
                  {stage.name}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-medium">
                  {stage.description}
                </p>
              </div>
              {interactive && (
                <ChevronRight
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isSelected ? 'text-blue-600 translate-x-0.5' : 'text-slate-300'
                  }`}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
