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
  QrCode,
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

  const isPdf = submission.fileType.toLowerCase() === 'pdf';

  return (
    <div
      className={`bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-[580px] lg:h-[680px]'
      } ${className}`}
    >
      {/* Top Toolbar */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-3 text-slate-300">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-xs font-bold text-white truncate">
            {submission.fileName}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase font-mono font-bold">
            {submission.fileType} • {(submission.fileSize / (1024 * 1024)).toFixed(2)} MB
          </span>
        </div>

        {/* Viewer Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-semibold px-1 text-slate-400 min-w-[40px] text-center">
            {zoom}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-800 mx-1" />
          <button
            onClick={handleRotate}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="Rotate 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Document Canvas Viewport */}
      <div className="flex-1 bg-slate-900/90 overflow-auto p-4 sm:p-8 flex items-center justify-center relative select-none">
        <div
          className="transition-transform duration-200 ease-out origin-center"
          style={{
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
          }}
        >
          {/* Simulated Institutional Official PDF / Document Sheet */}
          <div className="w-[500px] sm:w-[580px] min-h-[700px] bg-white text-slate-900 rounded-sm shadow-2xl p-8 border border-slate-300 relative flex flex-col justify-between overflow-hidden">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
              <span className="text-8xl font-black rotate-[-35deg] uppercase">
                CLEARPASS
              </span>
            </div>

            {/* Document Header */}
            <div>
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-6">
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
                    REF: CP-{submission.id.toUpperCase()}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">
                    Date: {new Date(submission.submittedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Title of Requirement Document */}
              <div className="text-center bg-slate-50 border border-slate-200 rounded-lg p-3 mb-6">
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
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs mb-6">
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
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-3 bg-slate-50 mb-6 flex flex-col items-center justify-center relative group">
                <div className="w-full h-56 rounded-lg overflow-hidden relative shadow-inner bg-slate-200">
                  <img
                    src={submission.fileUrl}
                    alt={submission.fileName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 px-2 py-1 bg-slate-900/80 text-white rounded text-[10px] font-mono flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Verified Digital Upload
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-2">
                  File Attachment: <span className="font-mono font-bold text-slate-700">{submission.fileName}</span>
                </p>
              </div>
            </div>

            {/* Document Footer with Digital Signature & Barcode */}
            <div className="border-t border-slate-200 pt-4 flex items-end justify-between">
              <div className="space-y-1">
                <div className="w-28 h-10 border border-slate-200 bg-slate-50 rounded flex items-center justify-center p-1">
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px] font-mono font-bold tracking-widest">
                    ||||| |||| || |||||
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 font-mono">
                  SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                </p>
              </div>

              {/* Institutional Digital Stamp */}
              <div className="border-2 border-emerald-600/60 rounded-lg p-2 text-center text-emerald-700 bg-emerald-50/50 rotate-[-4deg]">
                <p className="text-[9px] font-black tracking-widest uppercase">CLEARPASS VERIFIED</p>
                <p className="text-[8px] font-mono">ID: {submission.id.toUpperCase()}</p>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                  <span className="text-[8px] font-bold">SYSTEM AUDITED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          <span>Authenticated Institutional Document Stream</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={submission.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-slate-300 hover:text-white transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </a>
        </div>
      </div>
    </div>
  );
};
