import React, { useState } from 'react';
import {
  ArrowLeft,
  GraduationCap,
  Mail,
  Phone,
  Building,
  Calendar,
  Layers,
  FileCheck,
  Clock,
  XCircle,
  CheckCircle2,
  FileText,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { ClearanceStageKey, StageReviewStatus } from '../types';
import { INITIAL_STAGES } from '../services/seedData';
import { StatusBadge } from '../components/common/StatusBadge';
import { ProgressBar } from '../components/common/ProgressBar';
import { ClearanceTimeline } from '../components/clearance/ClearanceTimeline';

interface StudentProfileViewProps {
  studentId: string;
  navigate: (route: string) => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  studentId,
  navigate,
}) => {
  const { students, submissions, requirements } = useData();

  const student = students.find((s) => s.id === studentId);

  // Default to student's current stage or first stage
  const [selectedStageId, setSelectedStageId] = useState<ClearanceStageKey>(
    student?.currentStage || 'admission'
  );

  if (!student) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-12 text-center border border-white/60 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Student Record Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          The requested student clearance profile does not exist or has been archived.
        </p>
        <button
          onClick={() => navigate('/admin/students')}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
        >
          Back to Students
        </button>
      </div>
    );
  }

  // Count approved stages
  const approvedStagesCount = Object.values(student.stagesStatus).filter(
    (st) => st === 'approved'
  ).length;

  const selectedStage = INITIAL_STAGES.find((st) => st.id === selectedStageId);
  const stageRequirements = requirements.filter((r) => r.stageId === selectedStageId);
  const studentSubmissionsForStage = submissions.filter(
    (s) => s.studentId === student.id && s.stageId === selectedStageId
  );
  const stageStatus = student.stagesStatus[selectedStageId] || 'not_started';

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <button
          onClick={() => navigate('/admin/students')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Students List</span>
        </button>
      </div>

      {/* Student Dossier Header Card - Frosted Glass */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Identity Info */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-900 to-blue-900 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-slate-900/10 shrink-0 border border-white/20">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {student.name}
                </h1>
                <StatusBadge status={student.clearanceStatus} size="md" />
              </div>
              <p className="text-xs font-mono font-bold text-blue-700 mt-0.5">
                MATRIC NO: {student.matricNumber}
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-500 mt-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {student.departmentName}
                </span>
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  {student.level}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Session: {student.session}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {student.email}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Gauge Block */}
          <div className="lg:w-72 bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white/80 shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Clearance Progress
              </span>
              <span className="text-sm font-extrabold font-mono text-slate-900">
                {student.progressPercent}%
              </span>
            </div>
            <ProgressBar progress={student.progressPercent} size="md" className="mb-2" />
            <p className="text-xs text-slate-600 font-semibold flex items-center justify-between">
              <span>Completed Stages</span>
              <span className="font-bold text-slate-900">
                {approvedStagesCount} / 8 stages
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Interactive 8-Stage Timeline */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              8 Clearance Stages Status
            </h2>
            <p className="text-xs text-slate-500">
              Click any stage below to inspect submitted documents, reviewer signatures, or rejection notes.
            </p>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200/60">
            Current: {student.currentStage.toUpperCase()}
          </span>
        </div>

        <ClearanceTimeline
          stagesStatus={student.stagesStatus}
          selectedStage={selectedStageId}
          onSelectStage={(stId) => setSelectedStageId(stId)}
          interactive={true}
        />
      </div>

      {/* Selected Stage Drill-Down Details Panel */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-slate-900">
                Stage {selectedStage?.order}: {selectedStage?.name} Clearance
              </h3>
              <StatusBadge status={stageStatus} size="sm" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedStage?.description}
            </p>
          </div>
        </div>

        {/* Requirements & Submissions for this Stage */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Mandatory Documents & Review History
          </h4>

          {stageRequirements.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No specific document requirements configured for this stage.</p>
          ) : (
            <div className="space-y-3">
              {stageRequirements.map((req) => {
                const sub = studentSubmissionsForStage.find((s) => s.requirementId === req.id);

                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl border border-white/80 bg-white/60 backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <h5 className="text-xs font-bold text-slate-900">{req.name}</h5>
                        {req.required && (
                          <span className="text-[10px] text-rose-600 font-bold bg-rose-50/80 px-1.5 py-0.2 rounded">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">{req.description}</p>
                    </div>

                    {/* Submission / Review State */}
                    <div className="flex items-center gap-3 shrink-0">
                      {sub ? (
                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <StatusBadge status={sub.status} size="sm" />
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {new Date(sub.submittedAt).toLocaleDateString()}
                            </p>
                          </div>

                          <button
                            onClick={() => navigate(`/admin/clearance/${sub.id}`)}
                            className="text-blue-600 font-bold text-xs hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg border border-blue-600/20 transition-all uppercase flex items-center gap-1 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>{sub.status === 'pending' ? 'Review Document' : 'View File'}</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium italic">
                          Document not yet uploaded by student
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Existing Submissions Review Log for this Stage */}
        {studentSubmissionsForStage.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Departmental Audit & Reviewer Endorsements
            </h4>
            {studentSubmissionsForStage.map((sub) => (
              <div
                key={sub.id}
                className={`p-4 rounded-xl border text-xs space-y-2 backdrop-blur-xs ${
                  sub.status === 'approved'
                    ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-950'
                    : sub.status === 'rejected'
                    ? 'bg-rose-50/60 border-rose-200/80 text-rose-950'
                    : 'bg-amber-50/60 border-amber-200/80 text-amber-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider">
                    {sub.requirementName}
                  </span>
                  <StatusBadge status={sub.status} size="sm" />
                </div>

                {sub.reviewedBy && (
                  <p className="text-slate-700">
                    <span className="font-semibold">Reviewer:</span> {sub.reviewerName || sub.reviewedBy} •{' '}
                    <span className="font-mono text-slate-500">
                      {sub.reviewedAt ? new Date(sub.reviewedAt).toLocaleString() : ''}
                    </span>
                  </p>
                )}

                {sub.rejectionReason && (
                  <div className="p-2.5 rounded-lg bg-white/90 border border-rose-200 text-rose-800">
                    <p className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Rejection Reason: {sub.rejectionReason}
                    </p>
                    {sub.reviewComment && (
                      <p className="text-slate-600 mt-1">{sub.reviewComment}</p>
                    )}
                  </div>
                )}

                {sub.status === 'approved' && sub.reviewComment && (
                  <p className="text-slate-600 font-medium">
                    <span className="font-semibold">Verification Note:</span> {sub.reviewComment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
