import React, { useState, useEffect } from 'react';
import {
  Clock,
  UserCheck,
  Receipt,
  Factory,
  Bot,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  ArrowRight,
  TrendingUp,
  MapPin,
  Play,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { attendanceService } from '../../services/attendanceService';
import { payrollService } from '../../services/payrollService';
import { productionService } from '../../services/productionService';
import { robotService } from '../../services/robotService';
import { alertService } from '../../services/alertService';
import { AttendanceRecord, Payroll } from '../../types/hr';
import { ProductionOrder } from '../../types/production';
import { RobotTask } from '../../types/warehouse';
import { Alert } from '../../types/iot';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [isLoading, setIsLoading] = useState(true);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [latestPayroll, setLatestPayroll] = useState<Payroll | null>(null);
  const [assignedProduction, setAssignedProduction] = useState<ProductionOrder[]>([]);
  const [assignedRobotTasks, setAssignedRobotTasks] = useState<RobotTask[]>([]);
  const [safetyAlerts, setSafetyAlerts] = useState<Alert[]>([]);
  const [isPunching, setIsPunching] = useState(false);

  const empId = user?.employeeId || 'EMP002';

  const loadEmployeeData = async () => {
    try {
      setIsLoading(true);
      const [atts, pays, prods, tasks, alerts] = await Promise.all([
        attendanceService.getByEmployeeId(empId),
        payrollService.getByEmployeeId(empId),
        productionService.getOrders(),
        robotService.getTasks(),
        alertService.getAll(),
      ]);

      const todayStr = new Date().toISOString().split('T')[0];
      const today = atts.find((a) => a.date === todayStr);
      setTodayRecord(today || null);

      if (pays.length > 0) {
        setLatestPayroll(pays[0]);
      }

      // Filter tasks assigned to this employee or general floor tasks
      const myProds = prods.filter((p) => p.assignedOperatorId === empId || p.status === 'IN_PROGRESS');
      setAssignedProduction(myProds);

      const myTasks = tasks.filter((t) => t.assignedEmployeeId === empId || t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED');
      setAssignedRobotTasks(myTasks);

      setSafetyAlerts(alerts.slice(0, 3));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployeeData();
  }, [empId]);

  const handlePunch = async (action: 'CHECK_IN' | 'CHECK_OUT') => {
    try {
      setIsPunching(true);
      const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const record = await attendanceService.simulateAttendancePunch({
        employeeId: empId,
        deviceId: 'DEV004', // CNC Kiosk
        action,
        time: nowStr,
      });

      setTodayRecord(record);
      showToast(
        'success',
        action === 'CHECK_IN' ? 'Checked In Successfully' : 'Checked Out Successfully',
        `Punched at ${nowStr} via Terminal-04 CNC Heavy Machining`
      );
    } catch (err: any) {
      showToast('error', 'Attendance Punch Failed', err.message || 'Error communicating with attendance service');
    } finally {
      setIsPunching(false);
    }
  };

  const handleAdvanceRobotTask = async (taskId: string) => {
    try {
      const updated = await robotService.advanceTaskStatus(taskId);
      showToast('success', 'Task Updated', `Mission ${taskId} status advanced to ${updated.status}`);
      loadEmployeeData();
    } catch (err: any) {
      showToast('error', 'Failed to advance task', err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner message="Loading your personalized worker dashboard..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Personalized Welcome Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-blue-950/50 via-slate-900 to-slate-900 p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl ring-2 ring-blue-400/40 shadow-lg shadow-blue-600/30">
            {user?.fullName ? user.fullName.charAt(0) : 'E'}
          </div>
          <div>
            <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-blue-400">
              Logged in as Worker • {user?.departmentName || 'Precision Manufacturing'}
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Welcome, {user?.fullName}!
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Workstation: Terminal-04 CNC Hangar 1 • Employee ID: <strong className="text-slate-200 font-mono">{user?.employeeId}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 px-4 py-2.5 rounded-xl">
          <Calendar className="w-4 h-4 text-blue-400" />
          <div className="text-xs">
            <p className="text-slate-400">Shift Schedule</p>
            <p className="font-semibold text-slate-200">08:00 AM — 04:30 PM (Morning Shift)</p>
          </div>
        </div>
      </div>

      {/* Row 1: Attendance Punch Card & Current Payroll Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Attendance Clock Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Today's Attendance Clock
                </h3>
              </div>
              <StatusBadge status={todayRecord ? todayRecord.status : 'NOT PUNCHED'} />
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 mb-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Date:</span>
                <span className="font-mono text-slate-200 font-semibold">{formatDate(new Date().toISOString())}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Check In Time:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {todayRecord?.checkIn || '—'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Check Out Time:</span>
                <span className="font-mono text-blue-400 font-bold">
                  {todayRecord?.checkOut || '—'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Registered Access Device:</span>
                <span className="text-slate-300 font-medium">{todayRecord?.deviceName || 'Terminal-04 CNC Heavy Machining'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="emerald"
              size="md"
              className="flex-1"
              disabled={!!todayRecord?.checkIn || isPunching}
              isLoading={isPunching}
              onClick={() => handlePunch('CHECK_IN')}
              leftIcon={<UserCheck className="w-4 h-4" />}
            >
              {todayRecord?.checkIn ? 'Checked In' : 'Punch Check-In'}
            </Button>
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              disabled={!todayRecord?.checkIn || !!todayRecord?.checkOut || isPunching}
              isLoading={isPunching}
              onClick={() => handlePunch('CHECK_OUT')}
              leftIcon={<Clock className="w-4 h-4" />}
            >
              {todayRecord?.checkOut ? 'Checked Out' : 'Punch Check-Out'}
            </Button>
          </div>
        </div>

        {/* Current Payroll Slip Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Current Month Payroll Slip
                </h3>
              </div>
              <StatusBadge status={latestPayroll ? latestPayroll.status : 'PENDING'} />
            </div>

            {latestPayroll ? (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5 mb-4 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Payroll Period:</span>
                  <span className="font-mono text-slate-200 font-semibold">{latestPayroll.month}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Basic Base Salary:</span>
                  <span className="font-mono text-slate-200">{formatCurrency(latestPayroll.basicSalary)}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-400">
                  <span>Shift & Performance Bonus:</span>
                  <span className="font-mono">+{formatCurrency(latestPayroll.bonus)}</span>
                </div>
                <div className="flex justify-between items-center text-rose-400">
                  <span>Tax & Insurance Deductions:</span>
                  <span className="font-mono">-{formatCurrency(latestPayroll.deduction)}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold">
                  <span className="text-white">Net Take-Home Salary:</span>
                  <span className="font-mono text-emerald-400 text-base">{formatCurrency(latestPayroll.netSalary)}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No payroll record found for current month.</p>
            )}
          </div>

          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Direct Deposit Status: Active</span>
            <span className="text-blue-400 font-mono">Disbursed on 25th</span>
          </div>
        </div>
      </div>

      {/* Row 2: Assigned Production Tasks & Assigned Robot Missions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Tasks */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Factory className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Assigned Production Jobs ({assignedProduction.length})
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            {assignedProduction.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No production orders currently assigned.</p>
            ) : (
              assignedProduction.map((order) => {
                const progressPct = Math.round((order.producedQuantity / order.quantity) * 100);

                return (
                  <div
                    key={order.productionOrderId}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-[11px] text-blue-400 font-semibold">{order.productionOrderId}</span>
                        <h4 className="text-xs font-bold text-slate-100 mt-0.5">{order.productName}</h4>
                        <p className="text-[11px] text-slate-400">Machine: {order.machineName}</p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1">
                        <span>Progress: {order.producedQuantity} / {order.quantity} units</span>
                        <span className="font-bold text-cyan-400">{progressPct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, progressPct)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Assigned Warehouse Robot Tasks */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Assigned AGV/AMR Missions ({assignedRobotTasks.length})
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            {assignedRobotTasks.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No robot missions assigned to your zone.</p>
            ) : (
              assignedRobotTasks.map((task) => (
                <div
                  key={task.taskId}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[11px] text-indigo-400 font-semibold">{task.taskId}</span>
                      <h4 className="text-xs font-bold text-slate-100 mt-0.5">{task.productName} ({task.quantity} units)</h4>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" /> From {task.shelfLocation || task.shelfId} → To {task.targetLocation}
                      </p>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <span className="text-slate-400 font-mono">Assigned AGV: {task.robotName || task.robotId}</span>
                    {task.status !== 'COMPLETED' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAdvanceRobotTask(task.taskId)}
                        leftIcon={<Play className="w-3 h-3 text-indigo-400" />}
                      >
                        Advance Mission Step
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Plant Safety Notices & Floor Alerts */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Plant Safety Notices & Recent Floor Alerts
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {safetyAlerts.map((alert) => (
            <div
              key={alert.alertId}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/90 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 uppercase">
                  {alert.severity} PRIORITY
                </span>
                <span className="font-mono text-[10px] text-slate-400">{alert.time.split(' ')[1]}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-200">{alert.alertType}</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">{alert.message}</p>
              <p className="text-[10px] text-blue-400 font-mono pt-1">📍 {alert.location}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
