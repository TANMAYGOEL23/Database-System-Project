import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  Menu,
  Bell,
  Clock,
  Zap,
  Fingerprint,
  Bot,
  Activity,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  Database,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { mockStorage } from '../../services/mockStorage';
import { isSupabaseConfigured } from '../../services/supabase';
import { Alert } from '../../types/iot';
import { SimulateAttendanceModal } from '../simulation/SimulateAttendanceModal';
import { SimulateSensorModal } from '../simulation/SimulateSensorModal';
import { SimulateRobotTaskModal } from '../simulation/SimulateRobotTaskModal';

export const Topbar: React.FC<{
  onMobileMenuToggle: () => void;
}> = ({ onMobileMenuToggle }) => {
  const { user, isAdmin, logout } = useAuth();
  const [time, setTime] = useState<string>('');
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Simulation Modals State
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isSensorModalOpen, setIsSensorModalOpen] = useState(false);
  const [isRobotModalOpen, setIsRobotModalOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setAlerts(mockStorage.alerts);
  }, [isAlertsOpen]);

  const activeAlertsCount = alerts.filter((a) => a.status === 'ACTIVE').length;

  return (
    <header className="h-16 border-b border-slate-800 bg-white/90 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between gap-4 select-none shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Left Section: Mobile Menu & Live Clock */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Real-Time Plant Floor Master Clock */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 shadow-xs">
          <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          <span className="text-slate-400">PLANT UTC+0:</span>
          <span className="font-bold text-slate-100">{time || '08:00:00 AM'}</span>
        </div>

        {/* Active Shift Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-mono text-emerald-700 font-medium shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          SHIFT A (DAY RUN)
        </div>

        {/* Live Supabase Connection Badge */}
        {isSupabaseConfigured() ? (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-mono text-blue-700 font-medium shadow-xs" title="Live PostgreSQL Queries to Supabase">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>SUPABASE LIVE</span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-mono text-amber-800 font-medium shadow-xs" title="Fallback Mock Relational Engine Active">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>MOCK DB</span>
          </div>
        )}
      </div>

      {/* Right Section: Hardware Simulation Triggers & Notifications */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Simulation Shortcut Buttons (Prominent in topbar) */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl shadow-xs">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAttendanceModalOpen(true)}
            leftIcon={<Fingerprint className="w-3.5 h-3.5 text-blue-600" />}
            className="text-xs px-2.5 py-1 text-slate-400 hover:text-slate-100 hover:bg-white"
            title="Simulate Employee Turnstile / RFID Punch"
          >
            <span className="hidden md:inline">Simulate Attendance</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSensorModalOpen(true)}
            leftIcon={<Activity className="w-3.5 h-3.5 text-cyan-600" />}
            className="text-xs px-2.5 py-1 text-slate-400 hover:text-slate-100 hover:bg-white"
            title="Inject Sensor Reading Packet"
          >
            <span className="hidden md:inline">Simulate Sensor</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsRobotModalOpen(true)}
            leftIcon={<Bot className="w-3.5 h-3.5 text-indigo-600" />}
            className="text-xs px-2.5 py-1 text-slate-400 hover:text-slate-100 hover:bg-white"
            title="Dispatch AMR / AGV Warehouse Mission"
          >
            <span className="hidden md:inline">Dispatch AGV</span>
          </Button>
        </div>

        {/* Notifications & Active Incident Alerts Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsAlertsOpen(!isAlertsOpen)}
            className="relative p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-700 shadow-xs transition-colors"
          >
            <Bell className="w-4 h-4" />
            {activeAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-mono font-bold text-white shadow-lg shadow-rose-500/50 animate-bounce">
                {activeAlertsCount}
              </span>
            )}
          </button>

          {isAlertsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsAlertsOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden animate-scale-in">
                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                      Plant Incident Feed ({activeAlertsCount} Active)
                    </h4>
                  </div>
                  <button
                    onClick={() => setIsAlertsOpen(false)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 p-1">
                  {alerts.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">All systems nominal.</p>
                  ) : (
                    alerts.slice(0, 5).map((alert) => (
                      <div
                        key={alert.alertId}
                        className={`p-3 text-xs space-y-1 transition-colors ${
                          alert.status === 'ACTIVE'
                            ? 'bg-rose-950/20 hover:bg-rose-950/30'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[10px] text-rose-400">
                            {alert.alertId} • {alert.severity}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">{alert.time.split(' ')[1] || alert.time}</span>
                        </div>
                        <p className="font-medium text-slate-200">{alert.alertType}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-2">{alert.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-slate-800 bg-slate-950 text-center">
                  <a
                    href="/iot/alerts"
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
                  >
                    View All Safety Incidents <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Simulation Dialogs Mounted Globally */}
      <SimulateAttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
      />
      <SimulateSensorModal
        isOpen={isSensorModalOpen}
        onClose={() => setIsSensorModalOpen(false)}
      />
      <SimulateRobotTaskModal
        isOpen={isRobotModalOpen}
        onClose={() => setIsRobotModalOpen(false)}
      />
    </header>
  );
};
