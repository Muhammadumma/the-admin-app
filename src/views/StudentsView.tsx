import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Users,
  Eye,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { ProgressBar } from '../components/common/ProgressBar';
import { EmptyState } from '../components/common/EmptyState';
import { INITIAL_STAGES } from '../services/seedData';

interface StudentsViewProps {
  navigate: (route: string) => void;
  initialStatusFilter?: string;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  navigate,
  initialStatusFilter = 'ALL',
}) => {
  const { students } = useData();

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [stageFilter, setStageFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Extract unique departments & levels
  const departments = useMemo(() => {
    const set = new Set(students.map((s) => s.departmentName));
    return Array.from(set);
  }, [students]);

  const levels = useMemo(() => {
    const set = new Set(students.map((s) => s.level));
    return Array.from(set);
  }, [students]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.matricNumber.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase());

      const matchesDept = deptFilter === 'ALL' || s.departmentName === deptFilter;
      const matchesLevel = levelFilter === 'ALL' || s.level === levelFilter;
      const matchesStatus =
        statusFilter === 'ALL' || s.clearanceStatus === statusFilter.toLowerCase();
      const matchesStage = stageFilter === 'ALL' || s.currentStage === stageFilter;

      return matchesSearch && matchesDept && matchesLevel && matchesStatus && matchesStage;
    });
  }, [students, search, deptFilter, levelFilter, statusFilter, stageFilter]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header - Frosted Glass Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-600" />
            Enrolled Students Clearance Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search, inspect individual student dossiers, and track progress across all 8 clearance stages.
          </p>
        </div>
        <div className="text-right text-xs font-bold text-slate-500 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/80">
          Total: <span className="font-mono text-slate-900 font-extrabold">{students.length}</span> students
        </div>
      </div>

      {/* Search and Filters Bar - Frosted Glass Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, matric no, or email..."
              className="w-full pl-9.5 pr-4 py-2 text-xs bg-white/60 backdrop-blur-sm border border-slate-200/80 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-slate-800"
            />
          </div>

          {/* Department Filter */}
          <div className="md:col-span-2">
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

          {/* Level Filter */}
          <div className="md:col-span-2">
            <select
              value={levelFilter}
              onChange={(e) => {
                setLevelFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-white/60 backdrop-blur-sm border border-slate-200/80 rounded-xl focus:bg-white text-slate-700 outline-none transition font-medium"
            >
              <option value="ALL">All Levels</option>
              {levels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-white/60 backdrop-blur-sm border border-slate-200/80 rounded-xl focus:bg-white text-slate-700 outline-none transition font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Stage Filter */}
          <div className="md:col-span-2">
            <select
              value={stageFilter}
              onChange={(e) => {
                setStageFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-white/60 backdrop-blur-sm border border-slate-200/80 rounded-xl focus:bg-white text-slate-700 outline-none transition font-medium capitalize"
            >
              <option value="ALL">All Current Stages</option>
              {INITIAL_STAGES.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Student Records Table - Frosted Glass */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden">
        {filteredStudents.length === 0 ? (
          <EmptyState
            title="No students found"
            description="No student clearance records matched your filter criteria. Try adjusting your search query."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-bold tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Matric Number</th>
                  <th className="px-6 py-4">Department & Level</th>
                  <th className="px-6 py-4">Clearance Progress</th>
                  <th className="px-6 py-4 text-center">Current Stage</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 font-medium text-slate-700">
                {paginatedStudents.map((std) => (
                  <tr
                    key={std.id}
                    className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/students/${std.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-500/15 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-500/20">
                          {std.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{std.name}</p>
                          <p className="text-[11px] text-slate-400">{std.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-blue-700">
                      {std.matricNumber}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{std.departmentName}</p>
                      <p className="text-[11px] text-slate-500">{std.level} • {std.session}</p>
                    </td>
                    <td className="px-6 py-4 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <ProgressBar progress={std.progressPercent} size="sm" className="flex-1" />
                        <span className="font-mono font-bold text-[11px] text-slate-800">
                          {std.progressPercent}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100/80 text-slate-800 font-semibold capitalize text-xs">
                        {std.currentStage.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={std.clearanceStatus} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/students/${std.id}`);
                        }}
                        className="text-blue-600 font-bold text-xs hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg border border-blue-600/20 transition-all uppercase flex items-center gap-1.5 ml-auto cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Profile</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {filteredStudents.length > itemsPerPage && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of{' '}
              {filteredStudents.length} students
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
