import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  Receipt,
  Package,
  Layers,
  Warehouse,
  Grid,
  Truck,
  FileSpreadsheet,
  History,
  Cpu,
  Factory,
  ClipboardList,
  Bot,
  Route,
  Activity,
  LineChart,
  BellRing,
  UserCheck,
  FileText,
  BookOpen,
  Scale,
  DollarSign,
  PieChart,
  LogOut,
  ChevronDown,
  ChevronRight,
  Shield,
  HardHat,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  adminOnly?: boolean;
  items: NavItem[];
}

export const Sidebar: React.FC<{
  isOpen: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}> = ({ isOpen, onToggle, isMobileOpen, onMobileClose }) => {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const navSections: NavSection[] = isAdmin
    ? [
        {
          title: 'Core System',
          items: [
            { label: 'Executive Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
          ],
        },
        {
          title: 'Human Resources (HR)',
          adminOnly: true,
          items: [
            { label: 'Users', path: '/hr/users', icon: <UserCheck className="w-4 h-4 text-blue-400" /> },
            { label: 'Employees', path: '/hr/employees', icon: <Users className="w-4 h-4" /> },
            { label: 'Departments', path: '/hr/departments', icon: <Building2 className="w-4 h-4" /> },
            { label: 'Attendance Ledger', path: '/hr/attendance', icon: <CalendarCheck className="w-4 h-4" /> },
            { label: 'Payroll Ledger', path: '/hr/payroll', icon: <Receipt className="w-4 h-4" /> },
          ],
        },
        {
          title: 'Inventory & Supply Chain',
          adminOnly: true,
          items: [
            { label: 'Product Catalog', path: '/inventory/products', icon: <Package className="w-4 h-4" /> },
            { label: 'Stock Levels Matrix', path: '/inventory/stock', icon: <Layers className="w-4 h-4" /> },
            { label: 'Warehouses', path: '/inventory/warehouses', icon: <Warehouse className="w-4 h-4" /> },
            { label: 'Shelves (2D & RFID)', path: '/inventory/shelves', icon: <Grid className="w-4 h-4" /> },
            { label: 'Suppliers', path: '/inventory/suppliers', icon: <Truck className="w-4 h-4" /> },
            { label: 'Purchase Orders', path: '/inventory/purchase-orders', icon: <FileSpreadsheet className="w-4 h-4" /> },
            { label: 'Stock Transactions', path: '/inventory/transactions', icon: <History className="w-4 h-4" /> },
          ],
        },
        {
          title: 'Manufacturing & Plant',
          adminOnly: true,
          items: [
            { label: 'Machinery & Equipment', path: '/production/machines', icon: <Cpu className="w-4 h-4" /> },
            { label: 'Production Work Orders', path: '/production/orders', icon: <Factory className="w-4 h-4" /> },
            { label: 'Production Logs', path: '/production/logs', icon: <ClipboardList className="w-4 h-4" /> },
          ],
        },
        {
          title: 'Robotics & Automation',
          adminOnly: true,
          items: [
            { label: 'AMR Robot Fleet', path: '/warehouse/robots', icon: <Bot className="w-4 h-4" /> },
            { label: 'Robot Mission Tasks', path: '/warehouse/robot-tasks', icon: <Route className="w-4 h-4" /> },
          ],
        },
        {
          title: 'IoT & Telemetry Monitoring',
          adminOnly: true,
          items: [
            { label: 'Environmental Sensors', path: '/iot/sensors', icon: <Activity className="w-4 h-4" /> },
            { label: 'Telemetry Stream Data', path: '/iot/data', icon: <LineChart className="w-4 h-4" /> },
            { label: 'Plant Safety Alerts', path: '/iot/alerts', icon: <BellRing className="w-4 h-4" /> },
          ],
        },
        {
          title: 'Sales & Invoicing',
          adminOnly: true,
          items: [
            { label: 'Customers', path: '/sales/customers', icon: <UserCheck className="w-4 h-4" /> },
            { label: 'Commercial Invoices', path: '/sales/invoices', icon: <FileText className="w-4 h-4" /> },
          ],
        },
        {
          title: 'Finance & General Ledger',
          adminOnly: true,
          items: [
            { label: 'Chart of Accounts', path: '/accounting/accounts', icon: <BookOpen className="w-4 h-4" /> },
            { label: 'Journal Entries (Double-Entry)', path: '/accounting/journal-entries', icon: <Scale className="w-4 h-4" /> },
            { label: 'Operational Expenses', path: '/accounting/expenses', icon: <DollarSign className="w-4 h-4" /> },
          ],
        },
        {
          title: 'Executive Analytics',
          adminOnly: true,
          items: [
            { label: '10-Report Analytics Hub', path: '/reports', icon: <PieChart className="w-4 h-4" /> },
          ],
        },
      ]
    : [
        {
          title: 'Employee Portal',
          items: [
            { label: 'My Personal Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
            { label: 'My Attendance Punch', path: '/employee/attendance', icon: <CalendarCheck className="w-4 h-4" /> },
            { label: 'My Payroll Slips', path: '/employee/payroll', icon: <Receipt className="w-4 h-4" /> },
          ],
        },
      ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800 text-slate-300 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
            <Factory className="w-5 h-5" />
          </div>
          {isOpen && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm tracking-tight text-white truncate">
                MEGAFACTORY <span className="text-blue-400">ERP</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">
                Smart Industrial OS
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onToggle}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          <ChevronLeft className={cn('w-4 h-4 transition-transform duration-200', !isOpen && 'rotate-180')} />
        </button>
      </div>

      {/* Navigation Links (Scrollable) */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-none">
        {navSections.map((section) => {
          const isCollapsed = collapsedSections[section.title];

          return (
            <div key={section.title} className="space-y-1">
              {isOpen ? (
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <span>{section.title}</span>
                  {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              ) : (
                <div className="h-px bg-slate-800 my-2" />
              )}

              {!isCollapsed && (
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.path;

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onMobileClose}
                        title={!isOpen ? item.label : undefined}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group',
                          isActive
                            ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900',
                          !isOpen && 'justify-center px-2'
                        )}
                      >
                        <span className={cn('shrink-0 transition-transform group-hover:scale-110', isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400')}>
                          {item.icon}
                        </span>

                        {isOpen && <span className="truncate">{item.label}</span>}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/60 shrink-0">
        <div className={cn('flex items-center justify-between', !isOpen && 'justify-center')}>
          <div className="flex items-center gap-2.5 min-w-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-700 shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-blue-900/60 text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
            )}

            {isOpen && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-100 truncate">{user?.fullName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={cn('inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase', isAdmin ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400')}>
                    {isAdmin ? <Shield className="w-2.5 h-2.5 mr-1" /> : <HardHat className="w-2.5 h-2.5 mr-1" />}
                    {user?.role}
                  </span>
                </div>
              </div>
            )}
          </div>

          {isOpen && (
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className={cn('hidden lg:block h-screen transition-all duration-300 sticky top-0 shrink-0 z-30', isOpen ? 'w-64' : 'w-16')}>
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onMobileClose} />
          <div className="relative w-64 max-w-[80vw] h-full z-10 shadow-2xl animate-slide-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
