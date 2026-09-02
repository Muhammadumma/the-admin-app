import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Building,
  User,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { DocumentViewer } from '../components/clearance/DocumentViewer';
import { ApprovalDialog } from '../components/clearance/ApprovalDialog';
import { RejectionDialog } from '../components/clearance/RejectionDialog';
import { StatusBadge } from '../components/common/StatusBadge';

interface DocumentReviewViewProps {
  submissionId: string;
  navigate: (route: string) => void;
}

export const DocumentReviewView: React.FC<DocumentReviewViewProps> = ({
  submissionId,
  navigate,
}) => {
  const { currentUser, isStaff, assignedStage } = useAuth();
  const { submissions, students, requirements, approveSubmission, rejectSubmission } = useData();

  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const submission = submissions.find((s) => s.id === submissionId);
  const student = submission ? students.find((s) => s.id === submission.studentId) : null;
  const requirement = submission
    ? requirements.find((r) => r.id === submission.requirementId)
    : null;

  if (!submission) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-12 text-center border border-white/60 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Submission Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          The requested document submission ID could not be located in the clearance queue.
        </p>
        <button
          onClick={() => navigate('/admin/clearance')}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
        >
          Back to Clearance Queue
        </button>
      </div>
    );
  }

  // Check if current user is allowed to review this stage
  const canReview = !isStaff || assignedStage === submission.stageId;

  const handleApprove = async (comment?: string) => {
    if (!currentUser) return;
    setIsActionLoading(true);
    try {
      const reviewerId = currentUser.uid || (currentUser as any).id || 'ADMIN';
      await approveSubmission(submission.id, reviewerId, currentUser.name, comment);
      setIsApproveOpen(false);
      setActionSuccessMsg('Document successfully approved and student clearance updated in database!');
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async (reason: string, comment: string) => {
    if (!currentUser) return;
    setIsActionLoading(true);
    try {
      const reviewerId = currentUser.uid || (currentUser as any).id || 'ADMIN';
      await rejectSubmission(submission.id, reviewerId, currentUser.name, reason, comment);
      setIsRejectOpen(false);
      setActionSuccessMsg('Document marked as rejected and feedback sent to student in database.');
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb / Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/clearance')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Clearance Review Queue</span>
        </button>

        <div className="flex items-center gap-2">
          <StatusBadge status={submission.status} size="md" />
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50/90 backdrop-blur-sm border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Review Workplace (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: High-Fidelity Document Viewer (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <DocumentViewer submission={submission} />
        </div>

        {/* Right Column: Student Dossier & Review Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Student Info Card - Frosted Glass */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Student Record
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {submission.studentName}
                </h3>
                <p className="text-xs font-mono font-bold text-blue-700">
                  {submission.matricNumber}
                </p>
              </div>

              {student && (
                <button
                  onClick={() => navigate(`/admin/students/${student.id}`)}
                  className="p-2 rounded-lg bg-white/60 hover:bg-white border border-slate-200/80 text-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  title="View Full Student Dossier"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Profile</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Department
                </span>
                <span className="font-bold text-slate-800">{submission.departmentName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Clearance Stage
                </span>
                <span className="font-bold text-slate-800">{submission.stageName} Desk</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Submitted On
                </span>
                <span className="font-semibold text-slate-700">
                  {new Date(submission.submittedAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Submission ID
                </span>
                <span className="font-mono text-slate-700">{submission.id}</span>
              </div>
            </div>
          </div>

          {/* Requirement Verification Guidelines Card - Frosted Glass */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Requirement Audit Criteria
            </h4>
            <div className="p-3.5 bg-white/60 rounded-xl border border-white/80 space-y-1.5">
              <p className="text-sm font-bold text-slate-900">{submission.requirementName}</p>
              <p className="text-xs text-slate-600">
                {requirement?.description ||
                  'Ensure document authenticity, legible institutional stamps, and verified student credentials.'}
              </p>
            </div>

            <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 pt-2">
              <li>Confirm student name and matric number match official institutional records.</li>
              <li>Verify date of issuance or bank teller transaction stamp is authentic.</li>
              <li>Ensure the attached file is completely legible without distortion.</li>
            </ul>
          </div>

          {/* Review Audit History if already reviewed */}
          {submission.status !== 'pending' && (
            <div
              className={`p-5 rounded-2xl border text-xs space-y-2 backdrop-blur-xs ${
                submission.status === 'approved'
                  ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
                  : 'bg-rose-50/70 border-rose-200/80 text-rose-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider">
                  Review Status: {submission.status.toUpperCase()}
                </span>
                <StatusBadge status={submission.status} size="sm" />
              </div>
              <p className="font-medium text-slate-700">
                Endorsed by: <span className="font-bold">{submission.reviewerName || submission.reviewedBy}</span>{' '}
                {submission.reviewedAt && `on ${new Date(submission.reviewedAt).toLocaleString()}`}
              </p>
              {submission.rejectionReason && (
                <div className="mt-2 p-3 bg-white/90 rounded-xl border border-rose-200 text-rose-900">
                  <p className="font-bold">Rejection Reason: {submission.rejectionReason}</p>
                  {submission.reviewComment && (
                    <p className="mt-1 text-slate-600">{submission.reviewComment}</p>
                  )}
                </div>
              )}
              {submission.status === 'approved' && submission.reviewComment && (
                <p className="text-slate-600 font-medium">
                  <span className="font-bold">Note:</span> {submission.reviewComment}
                </p>
              )}
            </div>
          )}

          {/* Review Action Buttons */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-sm space-y-3">
            {submission.status === 'approved' ? (
              <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-200 text-emerald-950 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm text-emerald-900">Clearance Finalized &amp; Endorsed</p>
                  <p className="text-emerald-700 mt-0.5">
                    This document has been verified and approved by {submission.reviewerName || 'the Clearance Officer'}. No further actions can be taken on this finalized submission.
                  </p>
                </div>
              </div>
            ) : submission.status === 'rejected' ? (
              <div className="p-4 bg-rose-50/80 rounded-xl border border-rose-200 text-rose-950 text-xs flex items-center gap-3">
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm text-rose-900">Document Rejected &amp; Returned</p>
                  <p className="text-rose-700 mt-0.5">
                    This submission was returned to the student for correction. The student must re-upload before this requirement can be audited again.
                  </p>
                </div>
              </div>
            ) : !canReview ? (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-900 text-xs flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  You are assigned to the <strong className="uppercase">{assignedStage}</strong> desk. Only authorized officers for <strong className="uppercase">{submission.stageId}</strong> or Super Admins can endorse this document.
                </span>
              </div>
            ) : (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Authorized Clearance Actions
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsRejectOpen(true)}
                    className="py-3 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 border border-rose-500/30 text-rose-700 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Document</span>
                  </button>

                  <button
                    onClick={() => setIsApproveOpen(true)}
                    className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Document</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      <ApprovalDialog
        isOpen={isApproveOpen}
        submission={submission}
        isLoading={isActionLoading}
        onConfirm={handleApprove}
        onCancel={() => setIsApproveOpen(false)}
      />

      {/* Rejection Modal */}
      <RejectionDialog
        isOpen={isRejectOpen}
        submission={submission}
        isLoading={isActionLoading}
        onConfirm={handleReject}
        onCancel={() => setIsRejectOpen(false)}
      />
    </div>
  );
};
