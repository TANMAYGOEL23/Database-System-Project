import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  LogOut,
  Radio,
  Activity,
  Bot,
  User,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { alertService } from '../../services/alertService';
import { Alert } from '../../types/iot';
import { SimulateAttendanceModal } from '../simulation/SimulateAttendanceModal';
import { SimulateSensorModal } from '../simulation/SimulateSensorModal';
import { SimulateRobotTaskModal } from '../simulation/SimulateRobotTaskModal';
import { Button } from '../ui/Button';

interface TopbarProps {
  onToggleSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isAlertMenuOpen, setIsAlertMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Simulation Modals
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isSensorModalOpen, setIsSensorModalOpen] = useState(false);
  const [isRobotModalOpen, setIsRobotModalOpen] = useState(false);

  // Global search query
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await alertService.getAll();
      setAlerts(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();

    if (q.includes('emp') || q.includes('staff')) navigate('/hr/employees');
    else if (q.includes('prod') || q.includes('order')) navigate('/production/orders');
    else if (q.includes('mach') || q.includes('cnc')) navigate('/production/machines');
    else if (q.includes('stock') || q.includes('inv')) navigate('/inventory/stock');
    else if (q.includes('rob') || q.includes('agv')) navigate('/warehouse/robots');
    else if (q.includes('sens') || q.includes('temp')) navigate('/iot/sensors');
    else if (q.includes('inv') || q.includes('bill')) navigate('/sales/invoices');
    else if (q.includes('rep') || q.includes('chart')) navigate('/reports');
    else navigate('/dashboard');

    setIsSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 sm:px-6 backdrop-blur-md">
        {/* Left Side: Hamburger & Global Search */}
        <div className="flex items-center gap-3 lg:gap-4 flex-1 max-w-xl">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm hidden md:block">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search ERP modules, orders, products (e.g. 'CNC', 'EMP001')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-950/80 border border-slate-700 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </form>
        </div>

        {/* Center / Right: Quick Simulators, Live Clock, Notifications, User Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Quick Hardware Simulator Triggers (Admin & Operators) */}
          <div className="hidden xl:flex items-center gap-2 pr-3 border-r border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAttendanceModalOpen(true)}
              leftIcon={<Radio className="w-3.5 h-3.5 text-emerald-400" />}
              className="text-xs"
            >
              Simulate Gate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSensorModalOpen(true)}
              leftIcon={<Activity className="w-3.5 h-3.5 text-cyan-400" />}
              className="text-xs"
            >
              Simulate IoT
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRobotModalOpen(true)}
              leftIcon={<Bot className="w-3.5 h-3.5 text-indigo-400" />}
              className="text-xs"
            >
              Dispatch AGV
            </Button>
          </div>

          {/* Live Industrial Clock */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{currentTime.toLocaleTimeString('en-US', { hour12: false })}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">
              {currentTime.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }).toUpperCase()}
            </span>
          </div>

          {/* Notifications / Alerts Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsAlertMenuOpen(!isAlertMenuOpen);
                setIsUserMenuOpen(false);
              }}
              className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Alerts"
            >
              <Bell className="w-5 h-5" />
              {activeAlerts.length > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-slate-900 animate-pulse">
                  {activeAlerts.length}
                </span>
              )}
            </button>

            {isAlertMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden z-50">
                <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-slate-950/80">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Industrial Plant Alerts ({activeAlerts.length})
                    </h4>
                  </div>
                  <button
                    onClick={() => {
                      setIsAlertMenuOpen(false);
                      navigate(isAdmin ? '/iot/alerts' : '/employee/alerts');
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-medium"
                  >
                    View All
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800">
                  {activeAlerts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      <span>All factory systems within nominal thresholds.</span>
                    </div>
                  ) : (
                    activeAlerts.map((alert) => (
                      <div
                        key={alert.alertId}
                        onClick={() => {
                          setIsAlertMenuOpen(false);
                          navigate(isAdmin ? '/iot/alerts' : '/employee/alerts');
                        }}
                        className="p-3.5 hover:bg-slate-800/80 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-semibold text-rose-300 line-clamp-1">
                            {alert.alertType}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">
                            {alert.time.split(' ')[1] || alert.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                          {alert.message}
                        </p>
                        <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                          <span>📍 {alert.location}</span>
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold uppercase">
                            {alert.severity}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Role Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsUserMenuOpen(!isUserMenuOpen);
                setIsAlertMenuOpen(false);
              }}
              className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-blue-500/40">
                {user?.fullName ? user.fullName.charAt(0) : 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-slate-200 leading-none">{user?.fullName}</p>
                <span className="text-[10px] font-mono text-blue-400 font-medium">
                  {user?.role}
                </span>
              </div>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-1.5 z-50">
                <div className="px-4 py-2.5 border-b border-slate-800">
                  <p className="text-xs font-bold text-white">{user?.fullName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300">
                    <Shield className="w-3 h-3" /> {user?.role}
                  </div>
                </div>

                <div className="p-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hardware Simulation Modals */}
      <SimulateAttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        onSuccess={loadAlerts}
      />
      <SimulateSensorModal
        isOpen={isSensorModalOpen}
        onClose={() => setIsSensorModalOpen(false)}
        onSuccess={loadAlerts}
      />
      <SimulateRobotTaskModal
        isOpen={isRobotModalOpen}
        onClose={() => setIsRobotModalOpen(false)}
        onSuccess={loadAlerts}
      />
    </>
  );
};
