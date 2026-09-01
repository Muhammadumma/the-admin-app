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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { ClearanceStageKey, SubmissionStatus } from '../types';
import { INITIAL_STAGES } from '../services/seedData';
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
  const { currentUser, isStaff, assignedStage } = useAuth();
  const { submissions } = useData();

  // If staff member is assigned to a stage, default to that stage
  const effectiveInitialStage = isStaff && assignedStage ? assignedStage : initialStageFilter;

  const [activeTab, setActiveTab] = useState<string>(initialTab.toUpperCase());
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>(effectiveInitialStage);
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Extract unique departments from submissions
  const departments = useMemo(() => {
    const set = new Set(submissions.map((s) => s.departmentName));
    return Array.from(set);
  }, [submissions]);

  // Tab counts
  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const approvedCount = submissions.filter((s) => s.status === 'approved').length;
  const rejectedCount = submissions.filter((s) => s.status === 'rejected').length;

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // Role-based staff restriction: Staff can only access their assigned stage
      if (isStaff && assignedStage && sub.stageId !== assignedStage) {
        return false;
      }

      // Tab filter
      if (activeTab === 'PENDING' && sub.status !== 'pending') return false;
      if (activeTab === 'APPROVED' && sub.status !== 'approved') return false;
      if (activeTab === 'REJECTED' && sub.status !== 'rejected') return false;

      // Stage filter
      if (stageFilter !== 'ALL' && sub.stageId !== stageFilter) return false;

      // Department filter
      if (deptFilter !== 'ALL' && sub.departmentName !== deptFilter) return false;

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
  }, [submissions, activeTab, stageFilter, deptFilter, search, isStaff, assignedStage]);

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
            Audit submitted certificates, tellers, and receipts for institutional clearance sign-off.
          </p>
        </div>

        {/* Pending Queue Count Pill */}
        <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 px-4 py-2 rounded-xl text-amber-900 font-bold text-xs backdrop-blur-xs">
          <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
          <span>{pendingCount} submissions awaiting review</span>
        </div>
      </div>

      {/* Tabs Bar & Filters - Frosted Container */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden space-y-4 p-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Submissions', count: submissions.length },
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

          {/* Stage Filter (Locked if staff) */}
          <div className="md:col-span-3">
            <select
              value={stageFilter}
              disabled={isStaff && !!assignedStage}
              onChange={(e) => {
                setStageFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-white/60 backdrop-blur-sm border border-slate-200/80 rounded-xl focus:bg-white text-slate-700 outline-none transition font-medium capitalize disabled:opacity-60 disabled:bg-slate-100"
            >
              <option value="ALL">All Clearance Stages</option>
              {INITIAL_STAGES.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
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
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Submitted</th>
                  <th className="px-6 py-4">Reviewer</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 font-medium text-slate-700">
                {paginatedSubmissions.map((sub) => (
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
                      {sub.requirementName}
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
                ))}
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
    </div>
  );
};
