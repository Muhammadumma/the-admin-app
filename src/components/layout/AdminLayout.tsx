import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { TopNavbar } from './TopNavbar';
import { GeminiAssistantModal } from '../assistant/GeminiAssistantModal';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentRoute: string;
  navigate: (route: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  currentRoute,
  navigate,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  return (
    <div className="min-h-screen flex text-slate-800 relative" style={{
      background: 'radial-gradient(circle at 0% 0%, #0f172a 0%, #1e293b 35%, #f8fafc 35%, #f1f5f9 100%)',
      backgroundAttachment: 'fixed',
    }}>
      {/* Decorative glass glow orbs */}
      <div className="fixed top-12 left-72 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-10 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Sidebar Navigation */}
      <AdminSidebar
        currentRoute={currentRoute}
        navigate={navigate}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Administrative Workplace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar with frosted glass blur */}
        <TopNavbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenAssistant={() => setIsAssistantOpen(true)}
          navigate={navigate}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* CLEARPASS Gemini Assistant Modal */}
      <GeminiAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />
    </div>
  );
};
