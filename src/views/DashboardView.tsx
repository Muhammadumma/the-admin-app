import React from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck2,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { ProgressBar } from '../components/common/ProgressBar';
import { ClearanceStageKey } from '../types';

interface DashboardViewProps {
  navigate: (route: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ navigate }) => {
  const { currentUser, isStaff, assignedStage } = useAuth();
  const { stats, stages, submissions, students } = useData();

  // Get recent 5 submissions
  const recentSubmissions = submissions.slice(0, 6);

  const handleStageClick = (stageId: ClearanceStageKey) => {
    navigate(`/admin/clearance?stage=${stageId}`);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Dashboard Top Header - Frosted Glass Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Good morning, {currentUser?.name?.split(' ')[0] || 'Admin'}
            </h1>
            <StatusBadge status={currentUser?.role || 'ADMIN'} size="sm" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Here is an overview of student clearance activity and departmental review queues.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/clearance')}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-bold transition shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Open Review Queue</span>
            <span className="px-1.5 py-0.5 rounded-full bg-blue-500 text-[10px] font-bold">
              {stats.awaitingReview}
            </span>
          </button>
        </div>
      </div>

      {/* 4 Main Stat Cards - Frosted Glass Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          accentColor="navy"
          subtitle="+12 this week"
          onClick={() => navigate('/admin/students')}
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          accentColor="emerald"
          subtitle={`${Math.round((stats.completed / (stats.totalStudents || 1)) * 100)}% success rate`}
          badge="Graduated"
          onClick={() => navigate('/admin/students?status=completed')}
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={Clock}
          accentColor="blue"
          subtitle="Active submissions"
          onClick={() => navigate('/admin/students?status=in_progress')}
        />
        <StatCard
          title="Awaiting Review"
          value={stats.awaitingReview}
          icon={AlertCircle}
          accentColor="amber"
          subtitle="Review now →"
          badge="Action Required"
          onClick={() => navigate('/admin/clearance?tab=pending')}
        />
      </div>

      {/* Clearance Overview (The 8 Stages) + System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stages Progress Grid (2 Columns on large screens) */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Clearance Progress by Department
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any stage to filter pending student document dossiers.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              8 Stages Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100/70 p-2">
            {stages.map((stage, idx) => {
              const st = stats.stageStats[stage.id] || {
                total: stats.totalStudents,
                completed: 0,
                pending: 0,
                rejected: 0,
                completionRate: 0,
              };

              const isStaffStage = isStaff && assignedStage === stage.id;

              return (
                <div
                  key={stage.id}
                  onClick={() => handleStageClick(stage.id)}
                  className={`p-4 rounded-xl transition cursor-pointer hover:bg-blue-50/30 relative group ${
                    isStaffStage ? 'bg-blue-50/50 border border-blue-200/60' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition">
                        {stage.name}
                      </h3>
                    </div>
                    <span className="text-sm font-extrabold font-mono text-slate-900">
                      {st.completionRate}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <ProgressBar progress={st.completionRate} size="sm" className="mb-3" />

                  {/* Stage Breakdown Numbers */}
                  <div className="grid grid-cols-3 gap-1 text-[11px] pt-1.5 border-t border-slate-100/70">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Approved</span>
                      <span className="font-bold text-emerald-700">{st.completed}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Pending</span>
                      <span className="font-bold text-amber-700">{st.pending}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Rejected</span>
                      <span className="font-bold text-rose-700">{st.rejected}</span>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition">
                    <span>Inspect Queue</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Clearance Snapshot Widget */}
        <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl shadow-sm p-6 overflow-hidden flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-slate-800 uppercase tracking-tighter mb-4">Clearance Health</h2>
            <div className="space-y-4 pr-1">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span className="text-slate-600">Admission</span>
                  <span className="text-slate-400">96%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[96%] rounded-full"></div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span className="text-slate-600">Library</span>
                  <span className="text-slate-400">89%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[89%] rounded-full"></div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span className="text-slate-600">Faculty</span>
                  <span className="text-slate-400">76%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[76%] rounded-full"></div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span className="text-slate-600">Bursary</span>
                  <span className="text-slate-400">68%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[68%] rounded-full"></div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span className="text-slate-600">Graduation</span>
                  <span className="text-slate-400">29%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-300 w-[29%] rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="bg-blue-600 p-4 rounded-xl text-white shadow-sm shadow-blue-600/20">
              <p className="text-[10px] font-bold uppercase opacity-80">System Status</p>
              <h4 className="text-sm font-bold">Session 2025/2026</h4>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                <span className="text-xs font-medium italic">Clearance System Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Submissions Queue - Frosted Glass Table */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100/80 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-800 uppercase tracking-tighter">
              Recent Submissions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live submission queue from students across all departments.
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/clearance')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition uppercase"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Submissions Table / Empty State */}
        {recentSubmissions.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Student Submissions in Queue</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Mock test data has been wiped. When students upload clearance documents (&lt;1MB), their submissions will appear here in real-time.
            </p>
            <button
              onClick={() => navigate('/admin/clearance')}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>Go to Clearance Review Queue</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-bold tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Matric Number</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4 text-center">Stage</th>
                  <th className="px-6 py-4">Requirement</th>
                  <th className="px-6 py-4">Submitted</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 font-medium text-slate-700">
                {recentSubmissions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/clearance/${sub.id}`)}
                  >
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900">{sub.studentName}</span>
                      <p className="text-xs text-slate-400 uppercase">{sub.matricNumber}</p>
                    </td>
                    <td className="px-6 py-4 font-mono text-blue-700 font-semibold">
                      {sub.matricNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {sub.departmentName}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-bold bg-slate-100/80 px-2.5 py-1 rounded-md uppercase text-slate-800">
                        {sub.stageName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 truncate max-w-[180px]">
                      {sub.requirementName}
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(sub.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={sub.status} size="sm" />
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
      </div>
    </div>
  );
};
