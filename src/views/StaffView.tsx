import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Shield,
  Building,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { StaffRecord, UserRole, ClearanceStageKey } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';

interface StaffViewProps {
  navigate: (route: string) => void;
}

export const StaffView: React.FC<StaffViewProps> = () => {
  const { currentUser, isSuperAdmin } = useAuth();
  const { staffList, stages, addStaffUser, toggleStaffStatus } = useData();

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state for new staff
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('STAFF');
  const [assignedStage, setAssignedStage] = useState<ClearanceStageKey>('bursary');
  const [departmentName, setDepartmentName] = useState('Bursary Directorate');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const filteredStaff = staffList.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.departmentName.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Please provide full name and valid email address.');
      return;
    }
    setIsSubmitting(true);
    setError('');

    try {
      await addStaffUser(
        {
          name,
          email,
          role,
          assignedStage: role === 'STAFF' ? assignedStage : ('admission' as ClearanceStageKey),
          departmentId: 'DEPT_' + departmentName.replace(/\s+/g, '_').toUpperCase(),
          departmentName,
          active: true,
        },
        currentUser?.uid || 'ADMIN',
        currentUser?.name || 'Administrator',
        currentUser?.role || 'SUPER_ADMIN'
      );
      setIsAddModalOpen(false);
      setName('');
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to add staff member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - Frosted Glass Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-blue-600" />
            Staff & Reviewer Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage authorized clearance reviewing officers, departmental stage assignments, and role access.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-bold transition shadow-sm flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Reviewing Officer</span>
          </button>
        )}
      </div>

      {/* Search Bar - Frosted Glass */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff by name, email, or department..."
            className="w-full pl-9.5 pr-4 py-2 text-xs bg-white/60 backdrop-blur-sm border border-slate-200/80 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-slate-800"
          />
        </div>
      </div>

      {/* Staff Table - Frosted Glass */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-bold tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Staff Member</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-center">Assigned Clearance Stage</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Status</th>
                {isSuperAdmin && <th className="px-6 py-4 text-right">Access Control</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 font-medium text-slate-700">
              {filteredStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-500/15 border border-blue-500/20 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0">
                        {staff.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{staff.name}</p>
                        <p className="text-[11px] text-slate-500">{staff.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={staff.role} size="sm" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    {staff.assignedStage ? (
                      <span className="px-2.5 py-1 rounded-md bg-slate-100/80 text-slate-800 font-bold capitalize text-xs">
                        {staff.assignedStage.replace('_', ' ')}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">All Stages (Admin)</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {staff.departmentName}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        staff.active
                          ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {staff.active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  {isSuperAdmin && (
                    <td className="px-6 py-4 text-right">
                      {staff.role !== 'SUPER_ADMIN' && (
                        <button
                          onClick={() => toggleStaffStatus(staff.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            staff.active
                              ? 'text-rose-600 hover:bg-rose-500/15 border border-rose-500/30'
                              : 'text-emerald-600 hover:bg-emerald-500/15 border border-emerald-500/30'
                          }`}
                        >
                          {staff.active ? 'Suspend Access' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal - Frosted Glass Glassmorphism */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-white/60">
            <h3 className="text-lg font-bold text-slate-900">Add New Reviewing Officer</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Provision administrative access and departmental stage review permissions.
            </p>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50/90 text-rose-700 text-xs font-semibold border border-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleAddStaff} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Amina Yusuf"
                  className="w-full px-3 py-2 bg-white/70 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Institutional Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="amina.yusuf@clearpass.edu.ng"
                  className="w-full px-3 py-2 bg-white/70 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    System Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-white/70 border border-slate-200 rounded-xl text-slate-900 focus:bg-white outline-none font-semibold"
                  >
                    <option value="STAFF">Department Staff</option>
                    <option value="ADMIN">System Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Assigned Clearance Stage
                  </label>
                  <select
                    disabled={role !== 'STAFF'}
                    value={assignedStage}
                    onChange={(e) => setAssignedStage(e.target.value as ClearanceStageKey)}
                    className="w-full px-3 py-2 bg-white/70 border border-slate-200 rounded-xl text-slate-900 focus:bg-white outline-none capitalize disabled:opacity-50"
                  >
                    {stages.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Department / Unit Name
                </label>
                <input
                  type="text"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  placeholder="e.g. Bursary Directorate"
                  className="w-full px-3 py-2 bg-white/70 border border-slate-200 rounded-xl text-slate-900 focus:bg-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100/70 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Add Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
