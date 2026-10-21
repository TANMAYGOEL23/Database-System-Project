import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  CalendarCheck,
  Receipt,
  Factory,
  Bot,
  BellRing,
  Clock,
  LogIn,
  LogOut,
  IndianRupee,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { mockStorage } from '../../services/mockStorage';
import { attendanceService } from '../../services/attendanceService';
import { robotService } from '../../services/robotService';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [isPunching, setIsPunching] = useState(false);

  // Punch actions
  const handlePunch = async (type: 'CHECK_IN' | 'CHECK_OUT') => {
    if (!user) return;
    try {
      setIsPunching(true);
      await attendanceService.punchAttendance({
        employeeId: user.employeeId,
        deviceId: 'DEV001',
        type,
      });
      showToast('success', 'Attendance Recorded', `Successfully marked ${type === 'CHECK_IN' ? 'Check-In' : 'Check-Out'}`);
    } catch (e: any) {
      showToast('error', 'Punch Failed', e.message);
    } finally {
      setIsPunching(false);
    }
  };

  const myOrders = mockStorage.productionOrders.filter((o) => o.assignedOperatorId === user?.employeeId || o.assignedOperatorName?.includes(user?.fullName?.split(' ')[0] || ''));
  const myTasks = mockStorage.robotTasks.filter((t) => t.status !== 'COMPLETED');
  const myPayroll = mockStorage.payroll.filter((p) => p.employeeId === user?.employeeId);
  const latestPay = myPayroll[0];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-white via-white to-blue-50/60 border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">
            Plant Floor Operator Workstation
          </span>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight mt-1">
            Welcome back, {user?.fullName}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Department: <strong className="text-slate-100">{user?.departmentName || 'Machining & Assembly'}</strong> • Role: <strong className="text-slate-100">{user?.position || 'Machinist'}</strong>
          </p>
        </div>

        {/* Live Attendance Punch Box */}
        <div className="flex items-center gap-2.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800 shadow-xs">
          <Button
            variant="emerald"
            size="sm"
            onClick={() => handlePunch('CHECK_IN')}
            isLoading={isPunching}
            leftIcon={<LogIn className="w-3.5 h-3.5" />}
          >
            Check In (Shift Start)
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => handlePunch('CHECK_OUT')}
            isLoading={isPunching}
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
          >
            Check Out
          </Button>
        </div>
      </div>

      {/* Employee KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Assigned Work Orders"
          value={`${myOrders.length} Orders`}
          icon={<Factory className="w-5 h-5 text-blue-600" />}
          subtitle="Precision CNC fabrication batch"
          badge="Active Floor"
          badgeColor="blue"
        />

        <StatCard
          title="Latest Net Salary"
          value={latestPay ? formatCurrency(latestPay.netSalary) : formatCurrency(6130)}
          icon={<IndianRupee className="w-5 h-5 text-emerald-600" />}
          subtitle="August 2026 Pay Slip"
          badge="Direct Deposit"
          badgeColor="emerald"
        />

        <StatCard
          title="Assigned Robot Missions"
          value={`${myTasks.length} In Progress`}
          icon={<Bot className="w-5 h-5 text-indigo-600" />}
          subtitle="Material transfer to cell"
          badge="Autonomous"
          badgeColor="blue"
        />
      </div>

      {/* Production Jobs & Robot Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Production Work Orders */}
        <div className="rounded-2xl border border-slate-800 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                My Assigned Manufacturing Orders
              </h3>
              <p className="text-xs text-slate-400">CNC machine cell work allocations</p>
            </div>
          </div>

          <div className="space-y-3">
            {myOrders.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No production orders assigned.</p>
            ) : (
              myOrders.map((ord) => {
                const pct = Math.round((ord.producedQuantity / ord.quantity) * 100);

                return (
                  <div
                    key={ord.productionOrderId}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-xs text-blue-600 font-bold">{ord.productionOrderId}</span>
                        <h4 className="text-sm font-semibold text-slate-100">{ord.productName}</h4>
                      </div>
                      <StatusBadge status={ord.status} />
                    </div>

                    {/* Progress Meter */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-mono text-slate-400">
                        <span>Produced: {ord.producedQuantity} / {ord.quantity} units</span>
                        <span className="text-blue-600 font-bold">{pct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Assigned AMR Robot Tasks */}
        <div className="rounded-2xl border border-slate-800 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Assigned AMR Logistics Missions
              </h3>
              <p className="text-xs text-slate-400">Automated shelf-to-cell component delivery</p>
            </div>
          </div>

          <div className="space-y-3">
            {myTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No active AMR missions in queue.</p>
            ) : (
              myTasks.map((t) => (
                <div
                  key={t.taskId}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs text-indigo-600 font-bold">{t.taskId}</span>
                      <p className="text-xs font-semibold text-slate-100">
                        {t.productName} ({t.quantity} Units)
                      </p>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>

                  <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
                    <span>Route: {t.shelfLocation || t.shelfId} → {t.targetLocation}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
