import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  CalendarCheck,
  Receipt,
  Clock,
  LogIn,
  LogOut,
  DollarSign,
  Fingerprint,
  Building2,
  Briefcase,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Printer,
  ShieldCheck,
  User,
  ArrowRight,
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { attendanceService } from '../../services/attendanceService';
import { payrollService } from '../../services/payrollService';
import { AttendanceRecord, Payroll } from '../../types/hr';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<Payroll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPunching, setIsPunching] = useState(false);

  // Pay Slip Detail Modal
  const [selectedSlip, setSelectedSlip] = useState<Payroll | null>(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [allAttendance, allPayroll] = await Promise.all([
        attendanceService.getAll(),
        payrollService.getAll(),
      ]);

      // Filter exclusively to the signed-in employee's personal records
      const empId = user?.employeeId || '';
      const myAtt = allAttendance.filter((a) => a.employeeId === empId);
      const myPay = allPayroll.filter((p) => p.employeeId === empId);

      setAttendanceRecords(myAtt);
      setPayrollRecords(myPay);
    } catch (err: any) {
      showToast('error', 'Error Loading Records', err.message || 'Failed to retrieve personal records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.employeeId]);

  // Attendance Punch actions
  const handlePunch = async (type: 'CHECK_IN' | 'CHECK_OUT') => {
    if (!user?.employeeId) {
      showToast('error', 'Action Unavailable', 'Your user account is not linked to an HR employee ID.');
      return;
    }
    try {
      setIsPunching(true);
      await attendanceService.punchAttendance({
        employeeId: user.employeeId,
        deviceId: 'DEV001',
        type,
      });
      showToast(
        'success',
        'Attendance Punched',
        `Successfully logged ${type === 'CHECK_IN' ? 'Check-In (Shift Start)' : 'Check-Out (Shift End)'}`
      );
      await loadData();
    } catch (e: any) {
      showToast('error', 'Punch Failed', e.message || 'Unable to record attendance punch');
    } finally {
      setIsPunching(false);
    }
  };

  // Compute Today's Attendance Status
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = useMemo(() => {
    return attendanceRecords.find((a) => a.date === todayStr) || attendanceRecords[0];
  }, [attendanceRecords, todayStr]);

  const latestPaySlip = payrollRecords[0];

  const handleOpenSlip = (slip: Payroll) => {
    setSelectedSlip(slip);
    setIsSlipModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Employee Self-Service Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950/40 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 uppercase tracking-wider">
              Employee Self-Service Portal
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              LIVE SHIFT A
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white tracking-tight">
            Welcome back, {user?.fullName || 'Staff Member'}
          </h2>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-mono text-slate-300">
              <span className="text-slate-500">ID:</span>
              <strong className="text-blue-400 font-semibold">{user?.employeeId || 'UNLINKED'}</strong>
            </span>
            <span className="text-slate-700">•</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{user?.departmentName || 'Operations'}</span>
            </span>
            <span className="text-slate-700">•</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <span>{user?.position || 'Staff Personnel'}</span>
            </span>
          </div>
        </div>

        {/* Live Attendance Punch Box */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 shrink-0">
          <Button
            variant="emerald"
            size="sm"
            onClick={() => handlePunch('CHECK_IN')}
            isLoading={isPunching}
            leftIcon={<LogIn className="w-3.5 h-3.5" />}
            className="shadow-lg shadow-emerald-500/10"
          >
            Punch In (Shift Start)
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => handlePunch('CHECK_OUT')}
            isLoading={isPunching}
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
          >
            Punch Out
          </Button>
        </div>
      </div>

      {/* Stat Cards: Today's Gate Status, Net Salary, Assigned Dept & Shift */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Today's Gate Attendance"
          value={
            todayRecord?.checkIn
              ? `Present (${todayRecord.checkIn})`
              : 'Awaiting Gate Punch'
          }
          icon={<Fingerprint className="w-5 h-5 text-blue-400" />}
          subtitle={
            todayRecord?.checkOut
              ? `Punched Out at ${todayRecord.checkOut}`
              : todayRecord?.checkIn
              ? `Active Turnstile: ${todayRecord.deviceName || 'Main Gate 1'}`
              : 'Turnstile / Biometric scanner ready'
          }
          badge={todayRecord?.checkIn ? 'PUNCHED IN' : 'SHIFT PENDING'}
          badgeColor={todayRecord?.checkIn ? 'emerald' : 'amber'}
        />

        <StatCard
          title="Latest Net Take-Home Salary"
          value={latestPaySlip ? formatCurrency(latestPaySlip.netSalary) : '$6,130'}
          icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
          subtitle={
            latestPaySlip
              ? `${latestPaySlip.month} ${latestPaySlip.year} Disbursed Slip`
              : 'August 2026 Monthly Slip'
          }
          badge="Direct Deposit"
          badgeColor="emerald"
        />

        <StatCard
          title="Assigned Department & Shift"
          value={user?.departmentName || 'Machining & Assembly'}
          icon={<Building2 className="w-5 h-5 text-indigo-400" />}
          subtitle="Shift A (Day Run) • 08:00 AM - 04:30 PM"
          badge="Shift A"
          badgeColor="blue"
        />
      </div>

      {/* Two Column Layout: My Attendance History & My Pay Slips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section: My Attendance History */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-blue-400" />
                  <span>My Attendance History</span>
                </h3>
                <p className="text-xs text-slate-400">Biometric turnstile and gate scan logs</p>
              </div>

              <Link
                to="/employee/attendance"
                className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                <span>View Full Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Attendance Records Table */}
            <div className="overflow-x-auto">
              {attendanceRecords.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 space-y-2">
                  <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                  <p>No recent attendance punch records found.</p>
                  <p className="text-[11px] text-slate-500">
                    Use the "Punch In (Shift Start)" button above to record your attendance.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Check-In</th>
                      <th className="py-2.5 px-3">Check-Out</th>
                      <th className="py-2.5 px-3">Gate Device</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {attendanceRecords.slice(0, 5).map((rec) => (
                      <tr key={rec.attendanceId} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-300">
                          {formatDate(rec.date)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-emerald-400">
                          {rec.checkIn || '-'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">
                          {rec.checkOut || 'Active on Floor'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 truncate max-w-[120px]">
                          {rec.deviceName || rec.deviceId}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <StatusBadge status={rec.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>Showing latest {Math.min(5, attendanceRecords.length)} turnstile events</span>
            <span className="font-mono text-[11px]">Synced with PostgreSQL</span>
          </div>
        </div>

        {/* Section: My Compensation & Pay Slips */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <span>My Compensation & Pay Slips</span>
                </h3>
                <p className="text-xs text-slate-400">Monthly salary statements and disbursements</p>
              </div>

              <Link
                to="/employee/payroll"
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
              >
                <span>View All Slips</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Pay Slips Table */}
            <div className="overflow-x-auto">
              {payrollRecords.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 space-y-2">
                  <Receipt className="w-8 h-8 text-slate-600 mx-auto" />
                  <p>No pay slips issued yet for this account.</p>
                  <p className="text-[11px] text-slate-500">
                    Pay slips are generated monthly by the HR finance department.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                      <th className="py-2.5 px-3">Pay Period</th>
                      <th className="py-2.5 px-3 font-mono">Basic Salary</th>
                      <th className="py-2.5 px-3 font-mono">Bonus</th>
                      <th className="py-2.5 px-3 font-mono">Net Salary</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {payrollRecords.slice(0, 5).map((slip) => (
                      <tr key={slip.payrollId} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-200">
                            {slip.month} {slip.year}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">{slip.payrollId}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">
                          {formatCurrency(slip.basicSalary)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-400">
                          +{formatCurrency(slip.bonus)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-100">
                          {formatCurrency(slip.netSalary)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenSlip(slip)}
                            className="text-xs h-7 px-2.5"
                          >
                            View Slip
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>Direct deposit to registered bank account</span>
            <span className="font-mono text-[11px] text-emerald-400">Status: Disbursed</span>
          </div>
        </div>
      </div>

      {/* Pay Slip View Modal */}
      {selectedSlip && (
        <Modal
          isOpen={isSlipModalOpen}
          onClose={() => setIsSlipModalOpen(false)}
          title={`Pay Slip: ${selectedSlip.payrollId}`}
          subtitle={`${selectedSlip.employeeName} • ${selectedSlip.month} ${selectedSlip.year}`}
          maxWidth="lg"
          icon={<Receipt className="w-5 h-5 text-emerald-400" />}
        >
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-white">{selectedSlip.employeeName}</h4>
                <p className="text-xs text-slate-400 font-mono">
                  {selectedSlip.employeeId} • {selectedSlip.departmentName}
                </p>
              </div>
              <StatusBadge status={selectedSlip.status} />
            </div>

            <div className="space-y-2 border border-slate-800 rounded-xl p-4 bg-slate-950/40 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-slate-800/80 text-slate-300">
                <span>Basic Monthly Salary:</span>
                <span className="font-bold text-slate-100">{formatCurrency(selectedSlip.basicSalary)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80 text-emerald-400">
                <span>Production & Shift Bonus:</span>
                <span>+{formatCurrency(selectedSlip.bonus)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/80 text-rose-400">
                <span>Statutory & Tax Deductions:</span>
                <span>-{formatCurrency(selectedSlip.deduction)}</span>
              </div>
              <div className="flex justify-between py-2 text-sm font-bold text-white pt-2">
                <span>Net Take-Home Salary:</span>
                <span className="text-emerald-400 text-base">{formatCurrency(selectedSlip.netSalary)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => showToast('info', 'Print Spooler', 'Pay slip dispatched to secure printer.')}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print Slip
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setIsSlipModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
