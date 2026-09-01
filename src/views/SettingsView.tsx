import React, { useState } from 'react';
import {
  Settings,
  Building,
  Calendar,
  Shield,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Database,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export const SettingsView: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const { resetToSeedData } = useData();

  const [institutionName, setInstitutionName] = useState('Jigawa State Polytechnic, Dutse');
  const [session, setSession] = useState('2025/2026 Academic Session');
  const [clearanceActive, setClearanceActive] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo clearance data to initial state? Current approvals and submissions will be refreshed.')) {
      setIsResetting(true);
      resetToSeedData();
      setTimeout(() => {
        setIsResetting(false);
        alert('Clearance data reset to fresh demonstration seed state.');
      }, 500);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header - Frosted Glass Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          Clearance System Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure institutional metadata, clearance portal window status, and local data persistence.
        </p>
      </div>

      {isSaved && (
        <div className="p-4 rounded-xl bg-emerald-50/90 backdrop-blur-sm border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>System configuration updated successfully.</span>
        </div>
      )}

      {/* Main Settings Form - Frosted Glass Card */}
      <form onSubmit={handleSave} className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Institutional Parameters
        </h2>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Institution Name
            </label>
            <input
              type="text"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white/60 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:border-blue-500 outline-none transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Current Academic Session
              </label>
              <input
                type="text"
                value={session}
                onChange={(e) => setSession(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/60 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:border-blue-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Clearance Portal Status
              </label>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setClearanceActive(!clearanceActive)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    clearanceActive ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      clearanceActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="font-bold text-slate-900">
                  {clearanceActive ? 'Active (Submissions Open)' : 'Paused (Submissions Locked)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            Save Configuration
          </button>
        </div>
      </form>

      {/* Demo State Reset Utility */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-600" />
              Demo Data Reset Utility
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Restore the original test dataset containing student records across all 8 stages, pending submissions, and audit logs.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetData}
            disabled={isResetting}
            className="px-4 py-2 bg-white/70 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition flex items-center gap-2 cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
