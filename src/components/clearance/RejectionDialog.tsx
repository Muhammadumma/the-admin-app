import React, { useState } from 'react';
import { XCircle, AlertTriangle } from 'lucide-react';
import { SubmissionRecord } from '../../types';

interface RejectionDialogProps {
  isOpen: boolean;
  submission: SubmissionRecord;
  isLoading?: boolean;
  onConfirm: (reason: string, comment: string) => void;
  onCancel: () => void;
}

const PREDEFINED_REASONS = [
  'Document is blurry',
  'Wrong document',
  'Missing information',
  'Information does not match',
  'Invalid document',
  'Document cannot be opened',
  'Other',
];

export const RejectionDialog: React.FC<RejectionDialogProps> = ({
  isOpen,
  submission,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const [selectedReason, setSelectedReason] = useState(PREDEFINED_REASONS[0]);
  const [comment, setComment] = useState('');
  const [validationError, setValidationError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      setValidationError('Please select a rejection reason.');
      return;
    }
    if (selectedReason === 'Other' && !comment.trim()) {
      setValidationError('Please provide a specific explanation when selecting "Other".');
      return;
    }
    onConfirm(selectedReason, comment.trim() || `Document rejected due to: ${selectedReason}.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Reject Document</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify the reason so the student can re-upload an authentic replacement.
            </p>
          </div>
        </div>

        {/* Student & Document Summary */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Student:</span>
            <span className="font-bold text-slate-900">
              {submission.studentName} ({submission.matricNumber})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Requirement:</span>
            <span className="font-semibold text-slate-900">{submission.requirementName}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Predefined Reasons Radio Group */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Primary Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {PREDEFINED_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                    selectedReason === reason
                      ? 'border-rose-500 bg-rose-50/50 font-bold text-rose-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectionReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => {
                      setSelectedReason(e.target.value);
                      setValidationError('');
                    }}
                    className="text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Specific Comments */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Additional Instructions / Comments for Student
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setValidationError('');
              }}
              placeholder="e.g. Ensure the bursary stamp is clearly visible and receipt date matches current academic semester."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition"
            />
          </div>

          {validationError && (
            <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {validationError}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-lg transition shadow-xs flex items-center gap-2"
            >
              {isLoading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Reject Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
