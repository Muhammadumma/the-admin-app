import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  Sparkles,
  ChevronDown,
  UserCheck,
  CheckCheck,
  GraduationCap,
  ExternalLink,
  Shield,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { INITIAL_STAFF } from '../../services/seedData';
import { StatusBadge } from '../common/StatusBadge';

interface TopNavbarProps {
  onToggleSidebar: () => void;
  onOpenAssistant: () => void;
  navigate: (route: string) => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onToggleSidebar,
  onOpenAssistant,
  navigate,
}) => {
  const { currentUser, switchAccount } = useAuth();
  const { notifications, markNotificationRead, students } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setIsRoleMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter students by search
  const filteredStudents = searchQuery.trim()
    ? students.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.matricNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.departmentName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 h-20 bg-white/50 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between gap-4 transition-all">
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-full bg-white/70 border border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900 transition"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Student Search (Frosted Glass Pill) */}
        <div ref={searchRef} className="relative w-full max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search student, matric no, department..."
              className="w-full pl-10 pr-4 py-2 bg-white/60 backdrop-blur-sm border border-slate-200/80 rounded-full text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Search Dropdown */}
          {isSearchOpen && searchQuery.trim().length > 0 && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 py-2 z-50 max-h-80 overflow-y-auto">
              <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                Matching Student Records ({filteredStudents.length})
              </div>
              {filteredStudents.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No students found matching "{searchQuery}"
                </div>
              ) : (
                filteredStudents.map((std) => (
                  <div
                    key={std.id}
                    onClick={() => {
                      navigate(`/admin/students/${std.id}`);
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="px-4 py-2.5 hover:bg-blue-50/50 cursor-pointer flex items-center justify-between gap-3 border-b border-slate-100/50 last:border-0 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-blue-500/15 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-500/20">
                        {std.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 truncate">{std.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {std.matricNumber} • {std.departmentName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <StatusBadge status={std.clearanceStatus} size="sm" />
                      <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">
                        {std.progressPercent}% Completed
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Quick Reviewer Persona Switcher for easy testing */}
        <div ref={roleRef} className="relative hidden md:block">
          <button
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200/80 bg-white/70 backdrop-blur-sm hover:bg-white text-xs font-semibold text-slate-700 transition cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span className="max-w-[130px] truncate">
              {currentUser?.name?.split(' ')[0] || 'User'} ({currentUser?.role === 'STAFF' ? currentUser.assignedStage : currentUser?.role})
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isRoleMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 py-2 z-50">
              <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                Switch Reviewer Persona (Demo Testing)
              </div>
              <div className="max-h-64 overflow-y-auto">
                {INITIAL_STAFF.map((staff) => {
                  const isSelected = currentUser?.email === staff.email;
                  return (
                    <button
                      key={staff.id}
                      onClick={() => {
                        switchAccount(staff.id);
                        setIsRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-blue-50/50 transition cursor-pointer ${
                        isSelected ? 'bg-blue-50/80 font-bold text-blue-900' : 'text-slate-700'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <p className="font-semibold text-slate-900 truncate">{staff.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {staff.role} • {staff.departmentName}
                        </p>
                      </div>
                      <StatusBadge status={staff.role} size="sm" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Ask CLEARPASS AI Button */}
        <button
          onClick={onOpenAssistant}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-900/90 backdrop-blur-md hover:bg-slate-900 text-white text-xs font-bold transition shadow-sm border border-white/10 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span className="hidden sm:inline">CLEARPASS AI</span>
        </button>

        {/* Notifications Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 bg-white/80 hover:bg-white rounded-full border border-slate-200/80 text-slate-600 transition cursor-pointer shadow-xs"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 py-3 z-50">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Notifications
                  </h4>
                  <p className="text-[11px] text-slate-500">{unreadCount} unread system events</p>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No recent notifications.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationRead(notif.id)}
                      className={`p-3.5 hover:bg-blue-50/40 cursor-pointer transition ${
                        !notif.read ? 'bg-blue-50/60' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900">{notif.title}</p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(notif.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Current User Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200/80">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-600 font-bold text-xs flex items-center justify-center shadow-xs">
            {currentUser?.name?.charAt(0) || 'A'}
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">
              {currentUser?.name || 'Administrator'}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">
              {currentUser?.email}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
