import React, { useState, useMemo } from 'react';
import {
  FileCheck2,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  UploadCloud,
  FileUp,
  FileText,
  AlertCircle,
  Database,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { ClearanceStageKey, SubmissionStatus } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';

interface ClearanceViewProps {
  navigate: (route: string) => void;
  initialStageFilter?: string;
  initialTab?: string;
}

export const ClearanceView: React.FC<ClearanceViewProps> = ({
  navigate,
  initialStageFilter = 'ALL',
  initialTab = 'ALL',
}) => {
  const { currentUser, isStaff, assignedStage, isAdmin, isSuperAdmin } = useAuth();
  const { submissions, stages, students, requirements, submitDocument } = useData();

  // If staff member is assigned to a stage, default to that stage
  const effectiveInitialStage = isStaff && assignedStage ? assignedStage : initialStageFilter;

  const [activeTab, setActiveTab] = useState<string>(initialTab.toUpperCase());
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>(effectiveInitialStage);
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Document Upload Modal State (< 1MB enforced)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadStudentId, setUploadStudentId] = useState('');
  const [uploadStageId, setUploadStageId] = useState<ClearanceStageKey>(
    isStaff && assignedStage ? assignedStage : 'admission'
  );
  const [uploadReqId, setUploadReqId] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileBase64, setUploadFileBase64] = useState<string>('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Available requirements for selected upload stage
  const uploadStageReqs = useMemo(() => {
    return requirements.filter((r) => r.stageId === uploadStageId && r.active);
  }, [requirements, uploadStageId]);

  // Handle file selection with strict 1MB check
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);

    // 1 MB = 1,048,576 bytes
    if (file.size > 1048576) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setFileError(
        `File size (${sizeMb} MB) exceeds the 1 MB limit for the free tier database. Please compress or select a file under 1MB.`
      );
      setUploadFile(null);
      setUploadFileBase64('');
      return;
    }

    setUploadFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setUploadFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadStudentId || !uploadReqId || !uploadFile || !uploadFileBase64) {
      setFileError('Please complete all fields and attach a valid file under 1MB.');
      return;
    }

    const student = students.find((s) => s.id === uploadStudentId);
    const req = requirements.find((r) => r.id === uploadReqId);
    const stage = stages.find((s) => s.id === uploadStageId);

    if (!student || !req || !stage) return;

    setIsUploading(true);
    try {
      const ext = uploadFile.name.split('.').pop()?.toLowerCase() || 'pdf';
      const success = await submitDocument({
        studentId: student.id,
        studentName: student.name,
        matricNumber: student.matricNumber,
        departmentName: student.departmentName,
        requirementId: req.id,
        requirementName: req.name,
        stageId: stage.id,
        stageName: stage.name,
        fileUrl: uploadFileBase64,
        fileName: uploadFile.name,
        fileType: ext,
        fileSize: uploadFile.size,
        status: 'pending',
      });

      if (success) {
        setIsUploadModalOpen(false);
        setUploadFile(null);
        setUploadFileBase64('');
        setUploadReqId('');
        setFileError(null);
      }
    } catch (err: any) {
      setFileError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Extract unique departments from submissions
  const departments = useMemo(() => {
    const set = new Set(submissions.map((s) => s.departmentName));
    return Array.from(set);
  }, [submissions]);

  // Base submissions matching stage and department filters
  const stageScopedSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      if (stageFilter !== 'ALL' && sub.stageId !== stageFilter) return false;
      if (deptFilter !== 'ALL' && sub.departmentName !== deptFilter) return false;
      return true;
    });
  }, [submissions, stageFilter, deptFilter]);

  // Tab counts based on active stage/dept scope
  const allCount = stageScopedSubmissions.length;
  const pendingCount = stageScopedSubmissions.filter((s) => s.status === 'pending').length;
  const approvedCount = stageScopedSubmissions.filter((s) => s.status === 'approved').length;
  const rejectedCount = stageScopedSubmissions.filter((s) => s.status === 'rejected').length;

  // Filter submissions by tab and search
  const filteredSubmissions = useMemo(() => {
    return stageScopedSubmissions.filter((sub) => {
      // Tab filter
      if (activeTab === 'PENDING' && sub.status !== 'pending') return false;
      if (activeTab === 'APPROVED' && sub.status !== 'approved') return false;
      if (activeTab === 'REJECTED' && sub.status !== 'rejected') return false;

      // Search
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = sub.studentName.toLowerCase().includes(query);
        const matchesMatric = sub.matricNumber.toLowerCase().includes(query);
        const matchesReq = sub.requirementName.toLowerCase().includes(query);
        const matchesDept = sub.departmentName.toLowerCase().includes(query);
        if (!matchesName && !matchesMatric && !matchesReq && !matchesDept) return false;
      }

      return true;
    });
  }, [stageScopedSubmissions, activeTab, search]);

  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage) || 1;
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header - Frosted Glass Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileCheck2 className="w-6 h-6 text-blue-600" />
              Clearance Review Queue
            </h1>
            {isStaff && (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-800 font-bold text-xs border border-blue-500/30">
                {assignedStage?.toUpperCase()} DESK
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Audit submitted certificates, tellers, and receipts (&lt;1MB) synced live with Institutional Registry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Upload Document Modal Trigger */}
          <button
            onClick={() => {
              if (students.length > 0 && !uploadStudentId) {
                setUploadStudentId(students[0].id);
              }
              setIsUploadModalOpen(true);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer shrink-0"
          >
            <FileUp className="w-4 h-4" />
            <span>Upload Student Doc (&lt;1MB)</span>
          </button>

          {/* Pending Queue Count Pill */}
          <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 px-3.5 py-2.5 rounded-xl text-amber-900 font-bold text-xs backdrop-blur-xs shrink-0">
            <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
            <span>{pendingCount} Pending</span>
          </div>
        </div>
      </div>

      {/* Tabs Bar & Filters - Frosted Container */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden space-y-4 p-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Submissions', count: allCount },
            { id: 'PENDING', label: 'Pending Review', count: pendingCount, color: 'text-amber-700 bg-amber-100/80' },
            { id: 'APPROVED', label: 'Approved', count: approvedCount, color: 'text-emerald-700 bg-emerald-100/80' },
            { id: 'REJECTED', label: 'Rejected', count: rejectedCount, color: 'text-rose-700 bg-rose-100/80' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-600 border border-blue-500/20 font-extrabold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    tab.color || (isActive ? 'bg-blue-500/20 text-blue-800' : 'bg-slate-100/80 text-slate-600')
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
          {/* Search Box */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by student name, matric number, or requirement..."
              className="w-full pl-9.5 pr-4 py-2 text-xs bg-white/60 backdrop-blur-sm border border-slate-200/80 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-slate-800"
            />
          </div>

          {/* Stage Filter */}
          <div className="md:col-span-3">
            <select
              value={stageFilter}
              onChange={(e) => {
                setStageFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-white/60 backdrop-blur-sm border border-slate-200/80 rounded-xl focus:bg-white text-slate-700 outline-none transition font-medium capitalize"
            >
              <option value="ALL">All Clearance Stages</option>
              {stages.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} {isStaff && assignedStage === st.id ? '(Your Desk)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="md:col-span-3">
            <select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-white/60 backdrop-blur-sm border border-slate-200/80 rounded-xl focus:bg-white text-slate-700 outline-none transition font-medium"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Submissions Table - Frosted Glass */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden">
        {filteredSubmissions.length === 0 ? (
          <EmptyState
            title="No submissions found in this queue"
            description="There are currently no document submissions matching the selected filters or review criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-bold tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Matric Number</th>
                  <th className="px-6 py-4 text-center">Clearance Stage</th>
                  <th className="px-6 py-4">Requirement</th>
                  <th className="px-6 py-4">DB File Size</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Submitted</th>
                  <th className="px-6 py-4">Reviewer</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 font-medium text-slate-700">
                {paginatedSubmissions.map((sub) => {
                  const fileSizeKb = Math.round(
                    sub.fileSize > 1000 ? sub.fileSize / 1024 : sub.fileSize
                  );
                  const isUnder1MB = sub.fileSize <= 1048576;

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/clearance/${sub.id}`)}
                    >
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-900">{sub.studentName}</span>
                        <p className="text-xs text-slate-400">{sub.departmentName}</p>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-blue-700">
                        {sub.matricNumber}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100/80 text-slate-800 font-bold capitalize text-xs">
                          {sub.stageName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 truncate max-w-[180px]">
                        <span className="font-semibold block truncate">{sub.requirementName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {sub.id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {sub.fileType || 'PDF'}
                          </span>
                          <span className="font-mono text-xs font-semibold text-slate-700">
                            {fileSizeKb} KB
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-emerald-600 block mt-0.5">
                          ✓ &lt;1MB Free DB
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={sub.status} size="sm" />
                      </td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {new Date(sub.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {sub.reviewerName || sub.reviewedBy || '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/clearance/${sub.id}`);
                          }}
                          className="text-blue-600 font-bold text-xs hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg border border-blue-600/20 transition-all uppercase cursor-pointer"
                        >
                          {sub.status === 'pending' ? 'Review' : 'View'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {filteredSubmissions.length > itemsPerPage && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredSubmissions.length)} of{' '}
              {filteredSubmissions.length} submissions
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="p-1.5 rounded-lg border border-slate-200/80 bg-white/70 hover:bg-white disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 font-semibold text-slate-900">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="p-1.5 rounded-lg border border-slate-200/80 bg-white/70 hover:bg-white disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Document Modal (<1MB Firestore Enforced) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-white/60">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              Upload Student Clearance Document
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit clearance evidence directly into Institutional Registry (Max size: <strong className="text-slate-900">1 MB</strong> per document).
            </p>

            {fileError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{fileError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-3.5 text-xs">
              {/* Select Student */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select Student
                </label>
                <select
                  required
                  value={uploadStudentId}
                  onChange={(e) => setUploadStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-800 outline-none transition"
                >
                  <option value="">-- Select an Enrolled Student --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.matricNumber}) — {st.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Stage */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Clearance Stage
                  </label>
                  <select
                    disabled={isStaff && !!assignedStage}
                    value={uploadStageId}
                    onChange={(e) => {
                      setUploadStageId(e.target.value as ClearanceStageKey);
                      setUploadReqId('');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-800 outline-none transition capitalize font-semibold disabled:opacity-60"
                  >
                    {stages.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Document Requirement
                  </label>
                  <select
                    required
                    value={uploadReqId}
                    onChange={(e) => setUploadReqId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-800 outline-none transition"
                  >
                    <option value="">-- Select Requirement --</option>
                    {uploadStageReqs.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* File Attachment with <1MB constraint */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Attach File (PDF, JPG, PNG &bull; Strict &le; 1MB Limit)
                </label>
                <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/70 rounded-xl p-4 text-center cursor-pointer transition">
                  <input
                    type="file"
                    required
                    accept=".pdf,.png,.jpg,.jpeg,image/*,application/pdf"
                    onChange={handleFileChange}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                  />
                  {uploadFile && (
                    <div className="mt-2 text-xs font-semibold flex items-center justify-center gap-2 text-slate-800">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>{uploadFile.name}</span>
                      <span className="font-mono text-emerald-600 font-bold">
                        ({Math.round(uploadFile.size / 1024)} KB / 1024 KB max)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Institutional Vault Notice */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center gap-2 text-blue-900 text-[11px]">
                <Database className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Stored in Institutional Digital Vault. File is encoded and available for instantaneous admin inspection.
                </span>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100/70 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Uploading to DB...' : 'Submit Document'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
