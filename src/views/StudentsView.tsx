import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Users,
  Eye,
  Plus,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { ProgressBar } from '../components/common/ProgressBar';
import { EmptyState } from '../components/common/EmptyState';
import { ClearanceStageKey } from '../types';

interface StudentsViewProps {
  navigate: (route: string) => void;
  initialStatusFilter?: string;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  navigate,
  initialStatusFilter = 'ALL',
}) => {
  const { currentUser, isSuperAdmin, isAdmin } = useAuth();
  const { students, stages, addStudent } = useData();

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [stageFilter, setStageFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // New Student Enrollment Modal State
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMatric, setNewMatric] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDept, setNewDept] = useState('Computer Science');
  const [newLevel, setNewLevel] = useState('HND II (Final Year)');
  const [newSession, setNewSession] = useState('2025/2026');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract unique departments & levels
  const departments = useMemo(() => {
    const set = new Set(students.map((s) => s.departmentName));
    return Array.from(set);
  }, [students]);

  const levels = useMemo(() => {
    const set = new Set(students.map((s) => s.level));
    return Array.from(set);
  }, [students]);

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newMatric.trim()) return;

    setIsSubmitting(true);
    try {
      const initialStagesStatus: Record<ClearanceStageKey, any> = {
        admission: 'not_started',
        library: 'not_started',
        faculty: 'not_started',
        bursary: 'not_started',
        sports: 'not_started',
        accommodation: 'not_started',
        student_affairs: 'not_started',
        graduation: 'not_started',
      };

      await addStudent(
        {
          name: newName.trim(),
          matricNumber: newMatric.trim().toUpperCase(),
          email: newEmail.trim() || `${newMatric.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}@clearpass.edu.ng`,
          departmentId: 'DEPT_' + newDept.replace(/\s+/g, '_').toUpperCase(),
          departmentName: newDept,
          level: newLevel,
          session: newSession,
          clearanceStatus: 'in_progress',
          currentStage: 'admission',
          progressPercent: 0,
          stagesStatus: initialStagesStatus,
          active: true,
        },
        currentUser?.uid || 'ADMIN',
        currentUser?.name || 'Administrator',
        currentUser?.role || 'ADMIN'
      );

      setIsEnrollModalOpen(false);
      setNewName('');
      setNewMatric('');
      setNewEmail('');
    } catch (err) {
      console.error('Failed to enroll student:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div className="flex items-center gap-3">
          <div className="text-right text-xs font-bold text-slate-500 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/80">
            Total: <span className="font-mono text-slate-900 font-extrabold">{students.length}</span> students
          </div>
          {(isAdmin || isSuperAdmin) && (
            <button
              onClick={() => setIsEnrollModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Enroll Student</span>
            </button>
          )}
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
              {stages.map((st) => (
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

      {/* Enroll Student Modal */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl max-w-md w-full p-6 shadow-2xl border border-white/60">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              Enroll New Student
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Register a student dossier directly into the Firebase clearance database.
            </p>

            <form onSubmit={handleEnrollStudent} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Student Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Fatima Kabir Usman"
                  className="w-full px-3 py-2 bg-white/70 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Matric Number
                  </label>
                  <input
                    type="text"
                    required
                    value={newMatric}
                    onChange={(e) => setNewMatric(e.target.value)}
                    placeholder="e.g. JSP/CS/22/019"
                    className="w-full px-3 py-2 bg-white/70 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-blue-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Academic Level
                  </label>
                  <input
                    type="text"
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value)}
                    placeholder="HND II (Final Year)"
                    className="w-full px-3 py-2 bg-white/70 border border-slate-200 rounded-xl text-slate-900 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Department
                </label>
                <input
                  type="text"
                  required
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full px-3 py-2 bg-white/70 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Institutional Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="student@clearpass.edu.ng"
                    className="w-full px-3 py-2 bg-white/70 border border-slate-200 rounded-xl text-slate-900 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Academic Session
                  </label>
                  <input
                    type="text"
                    value={newSession}
                    onChange={(e) => setNewSession(e.target.value)}
                    placeholder="2025/2026"
                    className="w-full px-3 py-2 bg-white/70 border border-slate-200 rounded-xl text-slate-900 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100/70 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Registering...' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
