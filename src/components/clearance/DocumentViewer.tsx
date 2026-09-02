import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  FileText,
  ShieldCheck,
  Download,
  Building,
  CheckCircle,
  Database,
  ExternalLink,
  Layers,
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
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(100);
    setRotation(0);
  };

  const isPdf =
    submission.fileType?.toLowerCase() === 'pdf' ||
    submission.fileName?.toLowerCase().endsWith('.pdf') ||
    submission.fileUrl?.startsWith('data:application/pdf');

  const isImage =
    submission.fileType?.match(/^image\//i) ||
    submission.fileName?.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) ||
    submission.fileUrl?.startsWith('data:image/');

  const hasFile = !!submission.fileUrl;
  const fileSizeKb = Math.round(submission.fileSize > 1000 ? submission.fileSize / 1024 : submission.fileSize);
  const isUnder1MB = submission.fileSize <= 1048576; // <= 1 MB

  return (
    <div
      className={`bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-[620px] lg:h-[720px]'
      } ${className}`}
    >
      {/* Top Database & File Identification Toolbar */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-slate-300">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-blue-400 shrink-0" />
          <div className="truncate">
            <span className="text-xs font-bold text-white block truncate">
              {submission.fileName || `${submission.requirementName}.pdf`}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              DB ID: <span className="text-blue-400 font-bold">{submission.id}</span>
            </span>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded uppercase font-mono font-bold shrink-0 ${
              isUnder1MB
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-amber-950 text-amber-300 border border-amber-800'
            }`}
          >
            {submission.fileType?.toUpperCase() || (isPdf ? 'PDF' : isImage ? 'IMAGE' : 'FILE')} • {fileSizeKb} KB
          </span>
        </div>

        {/* Viewer Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-semibold px-1 text-slate-400 min-w-[40px] text-center">
            {zoom}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-800 mx-1" />
          <button
            onClick={handleRotate}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Rotate 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Document Canvas Viewport */}
      <div className="flex-1 bg-slate-900/95 overflow-auto p-2 sm:p-4 flex items-center justify-center relative select-none">
        {hasFile && isPdf ? (
          /* ── PDF Preview ── Google Docs viewer handles GitHub X-Frame-Options */
          <div
            className="w-full h-full min-h-[500px] flex flex-col items-center justify-center gap-3"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
            }}
          >
            <iframe
              src={
                submission.fileUrl!.startsWith('data:')
                  ? submission.fileUrl!
                  : `https://docs.google.com/viewer?url=${encodeURIComponent(submission.fileUrl!)}&embedded=true`
              }
              title={submission.fileName}
              className="w-full h-full min-h-[520px] rounded-lg shadow-2xl border border-slate-700 bg-white"
            />
            {/* Always-visible open / download buttons below the frame */}
            <div className="flex items-center gap-3">
              <a
                href={submission.fileUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold text-white inline-flex items-center gap-2 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open in Browser
              </a>
              <a
                href={submission.fileUrl!}
                download={submission.fileName || 'submission.pdf'}
                className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold text-white inline-flex items-center gap-2 transition"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </a>
            </div>
          </div>
        ) : hasFile && isImage ? (
          /* ── Image Preview ── jpg / png / gif / webp etc. */
          <div
            className="transition-transform duration-200 ease-out origin-center max-w-full"
            style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)` }}
          >
            <div className="bg-white rounded-lg shadow-2xl p-2 border border-slate-700 max-w-2xl">
              <img
                src={submission.fileUrl!}
                alt={submission.fileName}
                referrerPolicy="no-referrer"
                className="max-h-[520px] w-auto object-contain rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="mt-2 text-center text-xs text-slate-600 font-mono py-1 border-t border-slate-200">
                {submission.fileName} • {fileSizeKb} KB
              </div>
            </div>
          </div>
        ) : hasFile ? (
          /* ── Unknown file type — show open / download actions ── */
          <div className="text-center text-white flex flex-col items-center gap-4">
            <FileText className="w-16 h-16 text-blue-400" />
            <p className="text-sm font-bold">{submission.fileName}</p>
            <p className="text-xs text-slate-400">{fileSizeKb} KB</p>
            <a
              href={submission.fileUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition"
            >
              <ExternalLink className="w-4 h-4" /> Open File
            </a>
          </div>
        ) : (
          /* Institutional Dossier Preview Sheet */
          <div
            className="transition-transform duration-200 ease-out origin-center"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            }}
          >
            <div className="w-[500px] sm:w-[580px] min-h-[640px] bg-white text-slate-900 rounded-sm shadow-2xl p-8 border border-slate-300 relative flex flex-col justify-between overflow-hidden">
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
                <span className="text-8xl font-black rotate-[-35deg] uppercase">
                  CLEARPASS
                </span>
              </div>

              {/* Document Header */}
              <div>
                <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                        JSP
                      </div>
                      <div>
                        <h2 className="text-sm font-extrabold tracking-tight text-slate-900 uppercase">
                          Jigawa State Polytechnic, Dutse
                        </h2>
                        <p className="text-[10px] text-slate-600 font-semibold tracking-wide">
                          DIRECTORATE OF ACADEMIC AFFAIRS & CLEARANCE
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-300">
                      REF: {submission.id.toUpperCase()}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">
                      Date: {new Date(submission.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Title of Requirement Document */}
                <div className="text-center bg-slate-50 border border-slate-200 rounded-lg p-3 mb-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    OFFICIAL SUBMISSION EVIDENCE
                  </p>
                  <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
                    {submission.requirementName}
                  </h3>
                  <p className="text-xs text-blue-700 font-bold uppercase mt-0.5">
                    Stage: {submission.stageName} Departmental Clearance
                  </p>
                </div>

                {/* Student Metadata Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden text-xs mb-5">
                  <div className="grid grid-cols-3 bg-slate-100/70 p-2 font-bold text-slate-600 border-b border-slate-200">
                    <span>Student Name</span>
                    <span>Matric Number</span>
                    <span>Department</span>
                  </div>
                  <div className="grid grid-cols-3 p-2.5 font-semibold text-slate-900 bg-white">
                    <span>{submission.studentName}</span>
                    <span className="font-mono text-blue-700">{submission.matricNumber}</span>
                    <span>{submission.departmentName}</span>
                  </div>
                </div>

                {/* Document Image & Evidence Preview Container */}
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-3 bg-slate-50 mb-5 flex flex-col items-center justify-center relative group">
                  <div className="w-full h-56 rounded-lg overflow-hidden relative shadow-inner bg-slate-200">
                    {submission.fileUrl ? (
                      submission.fileType?.toLowerCase() === 'pdf' || submission.fileName?.toLowerCase().endsWith('.pdf') ? (
                        <iframe
                          src={submission.fileUrl}
                          title={submission.fileName}
                          className="w-full h-full border-none rounded"
                        />
                      ) : (
                        <img
                          src={submission.fileUrl}
                          alt={submission.fileName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain bg-slate-900/5 group-hover:scale-105 transition-transform duration-300"
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <FileText className="w-10 h-10 mb-1" />
                        <span className="text-xs font-semibold">No file attached</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 px-2 py-1 bg-slate-900/80 text-white rounded text-[10px] font-mono flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      Digitally Verified Document
                    </div>
                  </div>
                  <div className="w-full flex items-center justify-between text-[11px] text-slate-500 font-medium mt-2">
                    <span>File: <strong className="font-mono text-slate-700">{submission.fileName}</strong></span>
                    {submission.fileUrl && (
                      <a
                        href={submission.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        Open Full File ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Document Footer with Digital Signature & Barcode */}
              <div className="border-t border-slate-200 pt-3 flex items-end justify-between">
                <div className="space-y-1">
                  <div className="w-28 h-8 border border-slate-200 bg-slate-50 rounded flex items-center justify-center p-1">
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px] font-mono font-bold tracking-widest">
                      ||||| |||| || |||||
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 font-mono">
                    REG-DOC: {submission.id}
                  </p>
                </div>

                {/* Institutional Digital Stamp */}
                <div className="border-2 border-emerald-600/60 rounded-lg p-2 text-center text-emerald-700 bg-emerald-50/50 rotate-[-4deg]">
                  <p className="text-[9px] font-black tracking-widest uppercase">INSTITUTIONAL REGISTRY VERIFIED</p>
                  <p className="text-[8px] font-mono">STATUS: {submission.status.toUpperCase()}</p>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                    <span className="text-[8px] font-bold">CLEARANCE VALIDATED</span>
                  </div>
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
            Official Institutional Record • Size: <span className="text-white font-bold">{fileSizeKb} KB</span> (Standard Encrypted Format)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={submission.fileUrl}
            download={submission.fileName || `submission_${submission.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition font-bold text-xs"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Download Original</span>
          </a>
        </div>
      </div>
    </div>
  );
};
