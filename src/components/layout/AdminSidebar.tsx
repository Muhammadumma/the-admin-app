import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileCheck2,
  UserCheck,
  Settings,
  ListChecks,
  History,
  LogOut,
  Building2,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/StatusBadge';

interface AdminSidebarProps {
  currentRoute: string;
  navigate: (route: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentRoute,
  navigate,
  isOpen,
  onClose,
}) => {
  const { currentUser, isSuperAdmin, logout } = useAuth();

  const navItems = [
    {
      id: '/admin/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: '/admin/students',
      label: 'Students',
      icon: Users,
    },
    {
      id: '/admin/clearance',
      label: 'Clearance',
      icon: FileCheck2,
    },
    {
      id: '/admin/staff',
      label: 'Staff',
      icon: UserCheck,
    },
    ...(isSuperAdmin
      ? [
          {
            id: '/admin/requirements',
            label: 'Requirements',
            icon: ListChecks,
          },
          {
            id: '/admin/audit-logs',
            label: 'Audit Logs',
            icon: History,
          },
        ]
      : []),
    {
      id: '/admin/settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  const handleNavClick = (route: string) => {
    navigate(route);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-900/95 backdrop-blur-xl border-r border-white/10 text-slate-400 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="overflow-y-auto">
          {/* Brand Header */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-white/10">
            <div
              onClick={() => handleNavClick('/admin/dashboard')}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold tracking-tighter italic shadow-sm shadow-blue-500/30">
                CP
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-lg tracking-tight flex items-center gap-1.5">
                  CLEARPASS
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
                    ADMIN
                  </span>
                </span>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                  Student Digital Clearance
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Department / Stage Banner if Staff */}
          {currentUser?.role === 'STAFF' && currentUser.assignedStage && (
            <div className="mx-4 mt-4 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 flex items-center gap-2.5 backdrop-blur-sm">
              <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="truncate">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Assigned Desk</p>
                <p className="font-semibold text-white truncate capitalize">
                  {currentUser.assignedStage.replace('_', ' ')} Department
                </p>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="px-4 py-5 space-y-1.5">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              System Management
            </p>
            {navItems.map((item) => {
              const isActive =
                currentRoute === item.id ||
                (item.id !== '/admin/dashboard' && currentRoute.startsWith(item.id));
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-white/10 bg-slate-950/40">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold shrink-0">
                {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'SA'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">
                  {currentUser?.name || 'Super Admin'}
                </p>
                <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                navigate('/admin/login');
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-950/40 rounded-lg transition border border-rose-900/30 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
