import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Generate breadcrumbs from path
  const pathnames = location.pathname.split('/').filter((x) => x);

  const getBreadcrumbLabel = (name: string) => {
    return name
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Topbar onToggleSidebar={() => setIsSidebarOpen(true)} />

        {/* Breadcrumbs */}
        <div className="px-6 py-2.5 bg-slate-900/40 border-b border-slate-800/60 flex items-center gap-2 text-xs text-slate-400">
          <Link
            to="/dashboard"
            className="flex items-center gap-1 hover:text-blue-400 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>ERP</span>
          </Link>

          {pathnames.map((value, index) => {
            const to = `/${pathnames.slice(0, index + 1).join('/')}`;
            const isLast = index === pathnames.length - 1;

            return (
              <React.Fragment key={to}>
                <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                {isLast ? (
                  <span className="font-semibold text-slate-200 truncate">
                    {getBreadcrumbLabel(value)}
                  </span>
                ) : (
                  <Link to={to} className="hover:text-blue-400 transition-colors truncate">
                    {getBreadcrumbLabel(value)}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
