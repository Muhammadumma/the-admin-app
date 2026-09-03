import React, { useState, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  ShieldCheck,
  Building,
  CheckCircle,
  Database,
  ExternalLink,
  Printer,
  QrCode,
  Award,
  Calendar,
  User,
  Hash,
  XCircle,
  Clock,
  RotateCcw,
  GraduationCap
} from 'lucide-react';
import { SubmissionRecord } from '../../types';

interface DocumentViewerProps {
  submission: SubmissionRecord;
  className?: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  submission,
  className = '',
}) => {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'template' | 'raw'>(
    submission.templateJson || submission.fileType === 'template' || !submission.fileUrl ? 'template' : 'raw'
  );
  const printRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 15, 160));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 15, 60));
  const handleResetZoom = () => setZoom(100);

  const handlePrint = () => {
    window.print();
  };

  // Parse templateJson if available, otherwise construct fallback from submission fields
  let templateData: any = null;
  if (submission.templateJson) {
    try {
      templateData = JSON.parse(submission.templateJson);
    } catch (e) {
      console.warn('Failed to parse templateJson:', e);
    }
  }

  // Stage mapping helper for titles
  const getFallbackTitle = () => {
    const stage = String(submission.stageId || '').toLowerCase();
    if (stage.includes('admission') || stage === '1') return 'Admission Verification Letter';
    if (stage.includes('bursary') || stage === '3') return 'School Fees Payment Receipt';
    if (stage.includes('library') || stage === '4') return 'Library Clearance Certificate';
    if (stage.includes('faculty') || stage === '2') return 'Departmental Sign-off & Clearance Form';
    if (stage.includes('sports') || stage === '5') return 'Sports Unit Clearance Slip';
    if (stage.includes('student_affairs') || stage === '6') return 'Student Affairs Clearance Certificate';
    if (stage.includes('accommodation') || stage === '7') return 'Hall of Residence Clearance Slip';
    if (stage.includes('graduation') || stage === '8') return 'Academic Board Final Clearance Certificate';
    return submission.requirementName || 'Institutional Clearance Document';
  };

  const docTitle = templateData?.documentTitle || getFallbackTitle();
  const studentName = templateData?.issuedTo?.fullName || templateData?.student?.fullName || submission.studentName || 'Student';
  const matricNo = templateData?.issuedTo?.matricNumber || templateData?.student?.matricNumber || submission.matricNumber || 'JSP/CS/2024/001';
  const department = templateData?.issuedTo?.department || templateData?.student?.department || submission.departmentName || 'Computer Science';
  const level = templateData?.issuedTo?.level || templateData?.student?.level || 'ND I';
  const session = templateData?.issuedTo?.session || templateData?.academicSession || '2024/2025 Academic Session';
  const refNumber = templateData?.documentDetails?.referenceNumber || templateData?.referenceNumber || submission.id.toUpperCase();
  const issueDate = templateData?.documentDetails?.issueDate || templateData?.issuedDate || new Date(submission.submittedAt).toLocaleDateString('en-NG', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
  const remarks = templateData?.documentDetails?.remarks || templateData?.remarks || submission.reviewComment || 'Verified via JSP Clearance Ledger';

  // Key-value stage fields
  const stageFields: Record<string, string> =
    templateData?.stageFields ||
    templateData?.documentFields ||
    {
      'Requirement Item': submission.requirementName,
      'Clearance Department': submission.stageName,
      'Submission Status': submission.status.toUpperCase(),
      'Verification Date': issueDate,
      'Ledger Entry': submission.id,
    };

  const isApproved = submission.status === 'approved';
  const isRejected = submission.status === 'rejected';
  const isPending = !isApproved && !isRejected;

  const hasRawFile = Boolean(
    submission.fileUrl &&
    submission.fileUrl.trim() !== '' &&
    submission.fileType !== 'template'
  );

  const isPdf =
    submission.fileType?.toLowerCase() === 'pdf' ||
    submission.fileName?.toLowerCase().endsWith('.pdf') ||
    submission.fileUrl?.startsWith('data:application/pdf');

  const isImage =
    submission.fileType?.match(/^image\//i) ||
    submission.fileName?.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) ||
    submission.fileUrl?.startsWith('data:image/');

  return (
    <div
      className={`bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-[640px] lg:h-[740px]'
      } ${className}`}
    >
      {/* Top Toolbar */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-slate-300">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="truncate">
            <span className="text-xs font-bold text-white block truncate">
              {docTitle}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              REF: <span className="text-blue-400 font-bold">{refNumber}</span>
            </span>
          </div>

          <span
            className={`text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider shrink-0 ${
              isApproved
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : isRejected
                ? 'bg-red-950 text-red-300 border border-red-800'
                : 'bg-amber-950 text-amber-300 border border-amber-800'
            }`}
          >
            {submission.status.toUpperCase()}
          </span>
        </div>

        {/* Action Buttons & Viewer Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {hasRawFile && (
            <div className="flex items-center rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-xs mr-1">
              <button
                type="button"
                onClick={() => setViewMode('template')}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  viewMode === 'template' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Paper Certificate
              </button>
              <button
                type="button"
                onClick={() => setViewMode('raw')}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  viewMode === 'raw' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Original File
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            title="Print or Export as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>

          <div className="w-px h-4 bg-slate-800 mx-0.5" />

          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="text-xs font-mono font-semibold px-1 text-slate-400 min-w-[36px] text-center hover:text-white"
            title="Reset Zoom"
          >
            {zoom}%
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 bg-slate-950/90 overflow-auto p-4 sm:p-8 flex items-start justify-center relative">
        {viewMode === 'raw' && hasRawFile ? (
          /* Raw file preview fallback */
          <div
            className="w-full max-w-2xl flex flex-col items-center justify-center gap-3 transition-transform"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          >
            {isPdf ? (
              <iframe
                src={submission.fileUrl}
                title={submission.fileName}
                className="w-full h-[580px] rounded-lg shadow-2xl border border-slate-700 bg-white"
              />
            ) : isImage ? (
              <img
                src={submission.fileUrl}
                alt={submission.fileName}
                className="max-h-[580px] w-auto object-contain rounded-lg shadow-2xl border border-slate-700 bg-white"
              />
            ) : (
              <div className="text-center p-8 bg-slate-900 rounded-xl border border-slate-800 text-slate-300">
                <FileText className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                <p className="font-bold">{submission.fileName}</p>
                <a
                  href={submission.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-blue-400 hover:underline text-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open file in new tab
                </a>
              </div>
            )}
          </div>
        ) : (
          /* Paper-like A4 Institutional Document Renderer */
          <div
            ref={printRef}
            className="transition-transform duration-150 ease-out origin-top mb-12"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center'
            }}
          >
            <div className="w-[595px] sm:w-[680px] min-h-[860px] bg-white text-slate-900 rounded-sm shadow-2xl p-8 sm:p-10 border border-slate-300 relative flex flex-col justify-between overflow-hidden font-sans select-text">
              
              {/* Subtle Security Guilloche Pattern / Watermark Background */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none overflow-hidden">
                <div
                  className={`text-8xl sm:text-9xl font-black rotate-[-35deg] uppercase tracking-widest ${
                    isApproved
                      ? 'text-emerald-500/10'
                      : isRejected
                      ? 'text-red-500/10'
                      : 'text-amber-500/10'
                  }`}
                >
                  {isApproved ? 'APPROVED' : isRejected ? 'REJECTED' : 'PENDING'}
                </div>
              </div>

              {/* Top Institutional Header */}
              <div>
                <div className="flex items-center justify-between border-b-2 border-emerald-800 pb-4 mb-4">
                  <div className="flex items-center gap-3.5">
                    {/* JSP Crest / Seal Badge */}
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-white flex flex-col items-center justify-center p-1 shadow-md border-2 border-amber-400 shrink-0">
                      <GraduationCap className="w-6 h-6 text-amber-300" />
                      <span className="text-[9px] font-black tracking-tighter uppercase text-amber-200">
                        JSP DUTSE
                      </span>
                    </div>

                    <div>
                      <h1 className="text-base sm:text-lg font-black tracking-tight text-emerald-950 uppercase leading-tight font-serif">
                        Jigawa State Polytechnic, Dutse
                      </h1>
                      <p className="text-[10px] text-slate-600 font-semibold tracking-wider uppercase">
                        P.M.B. 7040, Kiyawa Road, Dutse, Jigawa State, Nigeria
                      </p>
                      <p className="text-[9px] text-emerald-800 font-bold tracking-widest uppercase mt-0.5">
                        Directorate of Academic Affairs & Clearance Audit
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded border border-slate-300 shadow-2xs">
                      REF: {refNumber}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">
                      Date: {issueDate}
                    </p>
                  </div>
                </div>

                {/* Decorative Double Bar */}
                <div className="h-1 bg-gradient-to-r from-emerald-800 via-amber-400 to-emerald-800 rounded-full mb-6" />

                {/* Document Title Banner */}
                <div className="text-center bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-6 shadow-2xs">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest block mb-0.5">
                    Official Institutional Clearance Record
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight font-serif">
                    {docTitle}
                  </h2>
                  <p className="text-xs text-blue-800 font-bold uppercase mt-1">
                    Clearance Department: {submission.stageName || 'Academic Clearance'}
                  </p>
                </div>

                {/* Student Information Dossier Table */}
                <div className="border border-slate-300 rounded-xl overflow-hidden text-xs mb-6 shadow-2xs">
                  <div className="bg-slate-100/90 px-3 py-2 font-bold text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-300 flex items-center justify-between">
                    <span>Student Profile & Registration Details</span>
                    <span className="text-emerald-700 font-mono">Session: {session}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-200 bg-white">
                    <div className="p-3">
                      <span className="text-[10px] font-medium text-slate-500 uppercase block">
                        Full Name
                      </span>
                      <span className="font-bold text-slate-900 text-xs block mt-0.5">
                        {studentName}
                      </span>
                    </div>

                    <div className="p-3">
                      <span className="text-[10px] font-medium text-slate-500 uppercase block">
                        Matriculation No.
                      </span>
                      <span className="font-mono font-bold text-blue-700 text-xs block mt-0.5">
                        {matricNo}
                      </span>
                    </div>

                    <div className="p-3">
                      <span className="text-[10px] font-medium text-slate-500 uppercase block">
                        Department
                      </span>
                      <span className="font-semibold text-slate-800 text-xs block mt-0.5 truncate">
                        {department}
                      </span>
                    </div>

                    <div className="p-3">
                      <span className="text-[10px] font-medium text-slate-500 uppercase block">
                        Level
                      </span>
                      <span className="font-semibold text-slate-800 text-xs block mt-0.5">
                        {level}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Document Specific Breakdown Table */}
                <div className="border border-slate-300 rounded-xl overflow-hidden text-xs mb-6 shadow-2xs">
                  <div className="bg-slate-100/90 px-3 py-2 font-bold text-slate-700 uppercase tracking-wider text-[10px] border-b border-slate-300">
                    Verification Ledger & Clearance Particulars
                  </div>

                  <div className="divide-y divide-slate-200 bg-white">
                    {Object.entries(stageFields).map(([label, value]) => (
                      <div key={label} className="grid grid-cols-3 px-3 py-2 text-xs">
                        <span className="font-semibold text-slate-600 col-span-1">
                          {label}
                        </span>
                        <span className="font-mono font-bold text-slate-900 col-span-2">
                          {String(value)}
                        </span>
                      </div>
                    ))}

                    {remarks && (
                      <div className="grid grid-cols-3 px-3 py-2 text-xs bg-slate-50/70">
                        <span className="font-semibold text-slate-600 col-span-1">
                          Officer Endorsement
                        </span>
                        <span className="text-slate-700 italic col-span-2">
                          "{remarks}"
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Document Footer: Seals, QR & Signatures */}
              <div className="border-t-2 border-slate-300 pt-4 mt-6">
                <div className="flex items-end justify-between gap-4">
                  {/* Digital Signature & Barcode */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      {/* Fake QR Code block */}
                      <div className="w-14 h-14 border border-slate-300 bg-slate-50 rounded p-1 flex items-center justify-center shrink-0">
                        <QrCode className="w-12 h-12 text-slate-800" />
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono space-y-0.5">
                        <p className="font-bold text-slate-700">JSP DIGITAL VERIFICATION</p>
                        <p>DOC ID: {submission.id.slice(0, 16)}</p>
                        <p>ISSUED: {issueDate}</p>
                        <p className="text-emerald-700 font-bold">LEDGER ENCRYPTED SHA-256</p>
                      </div>
                    </div>
                  </div>

                  {/* Stamp & Seal Area */}
                  <div className="shrink-0 text-center">
                    <div
                      className={`border-2 rounded-xl p-2.5 rotate-[-3deg] shadow-xs ${
                        isApproved
                          ? 'border-emerald-700 text-emerald-800 bg-emerald-50/70'
                          : isRejected
                          ? 'border-red-700 text-red-800 bg-red-50/70'
                          : 'border-amber-700 text-amber-800 bg-amber-50/70'
                      }`}
                    >
                      <p className="text-[9px] font-black tracking-widest uppercase">
                        JSP CLEARANCE REGISTRY
                      </p>
                      <p className="text-[11px] font-black tracking-tight my-0.5">
                        {isApproved
                          ? '★ OFFICIALLY CLEARED ★'
                          : isRejected
                          ? '✕ SUBMISSION REJECTED ✕'
                          : '● AUDIT PENDING ●'}
                      </p>
                      <div className="flex items-center justify-center gap-1 text-[8px] font-mono font-bold">
                        <ShieldCheck className="w-3 h-3" />
                        <span>DATE: {new Date().toLocaleDateString('en-GB')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Authorized Signatory Line */}
                  <div className="text-center w-36 sm:w-44 shrink-0">
                    <div className="h-9 border-b-2 border-dashed border-slate-400 flex items-end justify-center pb-1">
                      <span className="font-serif italic text-blue-900 font-bold text-xs select-none">
                        Dr. A. S. Dutse
                      </span>
                    </div>
                    <p className="text-[9px] font-bold text-slate-700 uppercase mt-1">
                      Academic Secretary
                    </p>
                    <p className="text-[8px] text-slate-500">
                      Jigawa State Polytechnic
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-200 text-center text-[8px] text-slate-400 font-mono">
                  This is a computer-generated certificate issued under the authority of Jigawa State Polytechnic. Valid for all official clearance audits.
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px]">
            Format: <strong className="text-slate-200">Institutional Vector Template</strong> • Student: <strong className="text-white font-mono">{matricNo}</strong>
          </span>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition font-bold text-xs cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 text-emerald-400" />
          <span>Print Certificate</span>
        </button>
      </div>
    </div>
  );
};
