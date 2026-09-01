import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { AdminLayout } from './components/layout/AdminLayout';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { StudentsView } from './views/StudentsView';
import { StudentProfileView } from './views/StudentProfileView';
import { ClearanceView } from './views/ClearanceView';
import { DocumentReviewView } from './views/DocumentReviewView';
import { StaffView } from './views/StaffView';
import { RequirementsView } from './views/RequirementsView';
import { AuditLogsView } from './views/AuditLogsView';
import { SettingsView } from './views/SettingsView';

const AppContent: React.FC = () => {
  const { currentUser, isSuperAdmin } = useAuth();

  // Internal route state initialized from window location hash or path
  const [route, setRoute] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && hash.startsWith('/admin')) return hash;
    const path = window.location.pathname;
    if (path && path.startsWith('/admin')) return path + window.location.search;
    return '/admin/dashboard';
  });

  const navigate = (newRoute: string) => {
    window.location.hash = newRoute;
    setRoute(newRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setRoute(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Parse path and query parameters
  const [pathOnly, queryPart] = route.split('?');
  const searchParams = new URLSearchParams(queryPart || '');

  // If unauthenticated or accessing /admin/login
  if (!currentUser || pathOnly === '/admin/login') {
    return <LoginView navigate={navigate} />;
  }

  // Render view depending on route
  const renderCurrentView = () => {
    // 1. Student detail: /admin/students/:studentId
    if (pathOnly.startsWith('/admin/students/') && pathOnly.length > '/admin/students/'.length) {
      const studentId = pathOnly.replace('/admin/students/', '');
      return <StudentProfileView studentId={studentId} navigate={navigate} />;
    }

    // 2. Submission detail: /admin/clearance/:submissionId
    if (pathOnly.startsWith('/admin/clearance/') && pathOnly.length > '/admin/clearance/'.length) {
      const submissionId = pathOnly.replace('/admin/clearance/', '');
      return <DocumentReviewView submissionId={submissionId} navigate={navigate} />;
    }

    // 3. Students list
    if (pathOnly === '/admin/students') {
      const initialStatus = searchParams.get('status') || 'ALL';
      return <StudentsView navigate={navigate} initialStatusFilter={initialStatus} />;
    }

    // 4. Clearance queue
    if (pathOnly === '/admin/clearance') {
      const stageParam = searchParams.get('stage') || 'ALL';
      const tabParam = searchParams.get('tab') || 'ALL';
      return (
        <ClearanceView
          navigate={navigate}
          initialStageFilter={stageParam}
          initialTab={tabParam}
        />
      );
    }

    // 5. Staff directory
    if (pathOnly === '/admin/staff') {
      return <StaffView navigate={navigate} />;
    }

    // 6. Requirements policy (Super Admin only)
    if (pathOnly === '/admin/requirements') {
      return isSuperAdmin ? <RequirementsView /> : <DashboardView navigate={navigate} />;
    }

    // 7. Audit logs (Super Admin only)
    if (pathOnly === '/admin/audit-logs') {
      return isSuperAdmin ? <AuditLogsView /> : <DashboardView navigate={navigate} />;
    }

    // 8. Settings
    if (pathOnly === '/admin/settings') {
      return <SettingsView />;
    }

    // Default Dashboard
    return <DashboardView navigate={navigate} />;
  };

  return (
    <AdminLayout currentRoute={pathOnly} navigate={navigate}>
      {renderCurrentView()}
    </AdminLayout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}
