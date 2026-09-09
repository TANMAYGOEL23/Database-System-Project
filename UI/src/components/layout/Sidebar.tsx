import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck2,
  Receipt,
  Boxes,
  Warehouse,
  Grid3X3,
  Truck,
  FileSpreadsheet,
  History,
  Cpu,
  Factory,
  ClipboardList,
  Bot,
  Route,
  Activity,
  BellRing,
  UserCheck,
  FileText,
  DollarSign,
  BookOpen,
  PieChart,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Layers,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  adminOnly?: boolean;
}

interface NavGroup {
  groupLabel: string;
  icon?: React.ReactNode;
  adminOnly?: boolean;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  // Navigation structure
  const adminNavGroups: NavGroup[] = [
    {
      groupLabel: 'Core ERP',
      items: [
        { label: 'Admin Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      ],
    },
    {
      groupLabel: 'Human Resources',
      items: [
        { label: 'Employees', path: '/hr/employees', icon: <Users className="w-4 h-4" /> },
        { label: 'Departments', path: '/hr/departments', icon: <Building2 className="w-4 h-4" /> },
        { label: 'Attendance Ledger', path: '/hr/attendance', icon: <CalendarCheck2 className="w-4 h-4" /> },
        { label: 'Payroll Management', path: '/hr/payroll', icon: <Receipt className="w-4 h-4" /> },
      ],
    },
    {
      groupLabel: 'Inventory & Supply',
      items: [
        { label: 'Product Catalog', path: '/inventory/products', icon: <Boxes className="w-4 h-4" /> },
        { label: 'Stock Matrix', path: '/inventory/stock', icon: <Layers className="w-4 h-4" /> },
        { label: 'Warehouses', path: '/inventory/warehouses', icon: <Warehouse className="w-4 h-4" /> },
        { label: 'Shelves & RFID', path: '/inventory/shelves', icon: <Grid3X3 className="w-4 h-4" /> },
        { label: 'Suppliers', path: '/inventory/suppliers', icon: <Truck className="w-4 h-4" /> },
        { label: 'Purchase Orders', path: '/inventory/purchase-orders', icon: <FileSpreadsheet className="w-4 h-4" /> },
        { label: 'Stock Transactions', path: '/inventory/transactions', icon: <History className="w-4 h-4" /> },
      ],
    },
    {
      groupLabel: 'Manufacturing',
      items: [
        { label: 'Machinery & Cells', path: '/production/machines', icon: <Cpu className="w-4 h-4" /> },
        { label: 'Production Orders', path: '/production/orders', icon: <Factory className="w-4 h-4" /> },
        { label: 'Production Logs', path: '/production/logs', icon: <ClipboardList className="w-4 h-4" /> },
      ],
    },
    {
      groupLabel: 'Robotics & Automation',
      items: [
        { label: 'Robot Fleet (AGV/AMR)', path: '/warehouse/robots', icon: <Bot className="w-4 h-4" /> },
        { label: 'Autonomous Tasks', path: '/warehouse/robot-tasks', icon: <Route className="w-4 h-4" /> },
      ],
    },
    {
      groupLabel: 'IoT & Telemetry',
      items: [
        { label: 'Sensor Grid', path: '/iot/sensors', icon: <Activity className="w-4 h-4" /> },
        { label: 'Telemetry Data', path: '/iot/data', icon: <Activity className="w-4 h-4" /> },
        { label: 'Alerts & Incidents', path: '/iot/alerts', icon: <BellRing className="w-4 h-4" /> },
      ],
    },
    {
      groupLabel: 'Sales & Invoicing',
      items: [
        { label: 'Customers', path: '/sales/customers', icon: <UserCheck className="w-4 h-4" /> },
        { label: 'Invoices', path: '/sales/invoices', icon: <FileText className="w-4 h-4" /> },
      ],
    },
    {
      groupLabel: 'Accounting & Finance',
      items: [
        { label: 'Chart of Accounts', path: '/accounting/accounts', icon: <BookOpen className="w-4 h-4" /> },
        { label: 'Journal Entries', path: '/accounting/journal-entries', icon: <DollarSign className="w-4 h-4" /> },
        { label: 'Operational Expenses', path: '/accounting/expenses', icon: <Receipt className="w-4 h-4" /> },
      ],
    },
    {
      groupLabel: 'Executive Analytics',
      items: [
        { label: 'Industrial Reports Hub', path: '/reports', icon: <PieChart className="w-4 h-4" /> },
      ],
    },
  ];

  const employeeNavGroups: NavGroup[] = [
    {
      groupLabel: 'My Workspace',
      items: [
        { label: 'Worker Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: 'My Attendance Clock', path: '/employee/attendance', icon: <CalendarCheck2 className="w-4 h-4" /> },
        { label: 'My Payroll Slips', path: '/employee/payroll', icon: <Receipt className="w-4 h-4" /> },
      ],
    },
    {
      groupLabel: 'Work Assignments',
      items: [
        { label: 'Assigned Production Jobs', path: '/employee/production-tasks', icon: <Factory className="w-4 h-4" /> },
        { label: 'Assigned Robot Missions', path: '/employee/robot-tasks', icon: <Bot className="w-4 h-4" /> },
        { label: 'Plant Safety Alerts', path: '/employee/alerts', icon: <BellRing className="w-4 h-4" /> },
      ],
    },
  ];

  const navGroups = isAdmin ? adminNavGroups : employeeNavGroups;

  // Track collapsed groups
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupLabel: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupLabel]: !prev[groupLabel],
    }));
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-800 bg-slate-950/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-600/20 ring-1 ring-blue-400/40">
              <Factory className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide leading-none">
                SMART INDUSTRIAL
              </h1>
              <span className="text-[10px] font-mono tracking-widest text-blue-400 font-semibold">
                ERP SYSTEM v2.4
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Badge Indicator */}
        <div className="px-4 py-2.5 bg-slate-850/60 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className={cn('w-4 h-4', isAdmin ? 'text-amber-400' : 'text-blue-400')} />
            <span className="text-xs text-slate-300 font-medium">
              Mode: <strong className="text-white font-mono">{user?.role}</strong>
            </span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        {/* Scrollable Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group) => {
            const isCollapsed = collapsedGroups[group.groupLabel];

            return (
              <div key={group.groupLabel} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.groupLabel)}
                  className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <span>{group.groupLabel}</span>
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="space-y-0.5 pt-0.5">
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.path;

                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => {
                            if (window.innerWidth < 1024) onClose();
                          }}
                          className={cn(
                            'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150',
                            isActive
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={cn(isActive ? 'text-white' : 'text-slate-400')}>
                              {item.icon}
                            </span>
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                              {item.badge}
                            </span>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Database Schema Tag */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-[11px] text-slate-400 flex items-center justify-between font-mono">
          <span>PostgreSQL :5432</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> CONNECTED
          </span>
        </div>
      </aside>
    </>
  );
};
