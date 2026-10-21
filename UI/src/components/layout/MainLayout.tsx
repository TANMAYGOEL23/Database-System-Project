import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ChevronRight, Home } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    if (paths.length === 0 || paths[0] === 'dashboard') {
      return [{ label: 'Executive Dashboard', path: '/dashboard' }];
    }

    return paths.map((segment, index) => {
      const path = `/${paths.slice(0, index + 1).join('/')}`;
      const label = segment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
      return { label, path };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 antialiased font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden bg-slate-950">
        <Topbar onMobileMenuToggle={() => setIsMobileOpen(true)} />

        {/* Global Breadcrumb Navigation Bar */}
        <div className="bg-white/80 backdrop-blur-xs border-b border-slate-800 px-4 sm:px-6 py-2.5 flex items-center gap-1.5 text-xs text-slate-400 select-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <Link to="/dashboard" className="flex items-center hover:text-slate-100 transition-colors">
            <Home className="w-3.5 h-3.5 mr-1 text-slate-400" />
            <span>Root</span>
          </Link>

          {breadcrumbs.map((bc, idx) => (
            <React.Fragment key={bc.path}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              {idx === breadcrumbs.length - 1 ? (
                <span className="font-semibold text-slate-100">{bc.label}</span>
              ) : (
                <Link to={bc.path} className="hover:text-slate-100 transition-colors">
                  {bc.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Page Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
