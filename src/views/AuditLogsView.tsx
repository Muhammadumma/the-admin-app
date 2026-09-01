import React, { useState } from 'react';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  FileText,
  UserCheck,
  Calendar,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { StatusBadge } from '../components/common/StatusBadge';

export const AuditLogsView: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const { auditLogs } = useData();

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.actorName.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.targetId.toLowerCase().includes(search.toLowerCase());

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    if (action.includes('APPROVE')) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 font-bold font-mono text-[10px] border border-emerald-500/30">
          {action}
        </span>
      );
    }
    if (action.includes('REJECT')) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-800 font-bold font-mono text-[10px] border border-rose-500/30">
          {action}
        </span>
      );
    }
    if (action.includes('STAFF')) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-800 font-bold font-mono text-[10px] border border-blue-500/30">
          {action}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full bg-slate-100/90 text-slate-800 font-bold font-mono text-[10px] border border-slate-200/60">
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header - Frosted Glass Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <History className="w-6 h-6 text-blue-600" />
              Immutable Clearance Audit Trail
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-800 text-xs font-bold border border-blue-500/30">
              SUPER ADMIN ONLY
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tamper-evident institutional record tracking every approval, rejection, and administrative access change.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-sm text-white px-3.5 py-2 rounded-xl text-xs font-mono font-bold shrink-0 border border-white/10 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{auditLogs.length} Events Recorded</span>
        </div>
      </div>

      {/* Filters - Frosted Glass */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit trail by actor, action type, or target ID..."
              className="w-full pl-9.5 pr-4 py-2 text-xs bg-white/60 backdrop-blur-sm border border-slate-200/80 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-slate-800"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white/60 backdrop-blur-sm border border-slate-200/80 rounded-xl focus:bg-white text-slate-700 outline-none transition font-medium"
            >
              <option value="ALL">All Event Types</option>
              <option value="APPROVE_DOCUMENT">APPROVE_DOCUMENT</option>
              <option value="REJECT_DOCUMENT">REJECT_DOCUMENT</option>
              <option value="ADD_STAFF">ADD_STAFF</option>
              <option value="TOGGLE_STAFF_STATUS">TOGGLE_STAFF_STATUS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table - Frosted Glass */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-bold tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Target Type</th>
                <th className="px-6 py-4">Target Ref</th>
                <th className="px-6 py-4">Metadata / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 font-medium text-slate-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {log.actorName}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={log.actorRole} size="sm" />
                  </td>
                  <td className="px-6 py-4">
                    {getActionBadge(log.action)}
                  </td>
                  <td className="px-6 py-4 uppercase font-mono text-[11px] text-slate-600">
                    {log.targetType}
                  </td>
                  <td className="px-6 py-4 font-mono text-blue-700 font-bold text-[11px]">
                    {log.targetId}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-[11px] max-w-[260px] truncate">
                    {JSON.stringify(log.metadata || {})}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
