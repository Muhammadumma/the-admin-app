import React, { useState } from 'react';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { SubmissionRecord } from '../../types';

interface ApprovalDialogProps {
  isOpen: boolean;
  submission: SubmissionRecord;
  isLoading?: boolean;
  onConfirm: (comment?: string) => void;
  onCancel: () => void;
}

export const ApprovalDialog: React.FC<ApprovalDialogProps> = ({
  isOpen,
  submission,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const [comment, setComment] = useState('Document verified and complies with institutional requirements.');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Approve Document</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Confirm clearance endorsement for this student submission.
            </p>
          </div>
        </div>

        {/* Student & Document Summary */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Student:</span>
            <span className="font-bold text-slate-900">{submission.studentName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Matric Number:</span>
            <span className="font-mono font-bold text-blue-700">{submission.matricNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Departmental Stage:</span>
            <span className="font-bold text-slate-800">{submission.stageName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Requirement:</span>
            <span className="font-semibold text-slate-900">{submission.requirementName}</span>
          </div>
        </div>

        {/* Approval Notes */}
        <div className="mt-4">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Endorsement Note (Optional)
          </label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add reviewer verification note..."
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(comment)}
            disabled={isLoading}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-lg transition shadow-xs flex items-center gap-2"
          >
            {isLoading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Confirm & Approve
          </button>
        </div>
      </div>
    </div>
  );
};
