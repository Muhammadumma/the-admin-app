import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  GraduationCap,
  ArrowRight,
  UserCheck,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { INITIAL_STAFF } from '../services/seedData';
import { StatusBadge } from '../components/common/StatusBadge';

interface LoginViewProps {
  navigate: (route: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ navigate }) => {
  const { login, switchAccount } = useAuth();
  const { staffList } = useData();
  const [email, setEmail] = useState('admin@clearpass.edu.ng');
  const [password, setPassword] = useState('Admin@Clearpass2026');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const displayStaff = staffList && staffList.length > 0 ? staffList : INITIAL_STAFF;

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your administrative email.');
      return;
    }
    setIsLoading(true);
    setError('');

    const success = await login(email);
    if (success) {
      navigate('/admin/dashboard');
    } else {
      setError('Invalid administrative credentials or unauthorized account.');
    }
    setIsLoading(false);
  };

  const handleQuickDemoLogin = (staffId: string) => {
    switchAccount(staffId);
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Graphic Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-blue-900/30 via-indigo-950/10 to-transparent blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        {/* Brand Header */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/30 mb-4 font-black text-2xl tracking-wider">
          CP
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          CLEARPASS
        </h1>
        <p className="mt-1 text-sm text-slate-400 font-medium">
          Administrative Portal & Clearance Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-8 shadow-2xl rounded-2xl border border-slate-800 space-y-6">
          <form onSubmit={handleStandardLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs font-semibold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Staff / Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@clearpass.edu.ng"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-white text-xs sm:text-sm placeholder:text-slate-600 outline-none transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Password reset instructions sent to institutional email.');
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your administrative password"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-white text-xs sm:text-sm placeholder:text-slate-600 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-1 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Admin Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Selector */}
          <div className="pt-4 border-t border-slate-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 text-center flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Quick One-Click Test Accounts
            </p>
            <div className="grid grid-cols-1 gap-2">
              {displayStaff.slice(0, 3).map((staff) => (
                <button
                  key={staff.id}
                  type="button"
                  onClick={() => handleQuickDemoLogin(staff.id)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 flex items-center justify-between text-left transition group cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-200 group-hover:text-white">
                      {staff.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {staff.departmentName}
                    </p>
                  </div>
                  <StatusBadge status={staff.role} size="sm" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Institutional Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Jigawa State Polytechnic • Powered by CLEARPASS System
        </p>
      </div>
    </div>
  );
};

