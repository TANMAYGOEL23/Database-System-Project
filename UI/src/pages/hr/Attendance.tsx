import React, { useState, useEffect } from 'react';
import { Fingerprint, Clock, Calendar, CheckCircle2, User, RefreshCw } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SimulateAttendanceModal } from '../../components/simulation/SimulateAttendanceModal';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { attendanceService } from '../../services/attendanceService';
import { departmentService } from '../../services/departmentService';
import { AttendanceRecord, Department } from '../../types/hr';
import { formatDate } from '../../utils/formatters';

export const Attendance: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);

  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [attList, deptList] = await Promise.all([
        attendanceService.getAll(),
        departmentService.getAll(),
      ]);
      setRecords(attList);
      setDepartments(deptList);
    } catch (e: any) {
      showToast('error', 'Error Loading Attendance', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns: Column<AttendanceRecord>[] = [
    {
      key: 'attendanceId',
      header: 'Audit ID',
      sortable: true,
      render: (a) => <span className="font-mono font-semibold text-blue-400">{a.attendanceId}</span>,
    },
    {
      key: 'employeeName',
      header: 'Employee Staff',
      sortable: true,
      render: (a) => (
        <div>
          <div className="font-semibold text-slate-100">{a.employeeName}</div>
          <div className="text-[11px] font-mono text-slate-400">{a.employeeId} • {a.departmentName}</div>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Shift Date',
      sortable: true,
      render: (a) => <span className="font-mono text-xs text-slate-300">{formatDate(a.date)}</span>,
    },
    {
      key: 'checkIn',
      header: 'Gate Check-In',
      sortable: true,
      render: (a) => (
        <span className="font-mono text-xs font-semibold text-emerald-400">
          {a.checkIn}
        </span>
      ),
    },
    {
      key: 'checkOut',
      header: 'Gate Check-Out',
      render: (a) => (
        <span className="font-mono text-xs text-slate-400">
          {a.checkOut || 'Active on Floor'}
        </span>
      ),
    },
    {
      key: 'deviceName',
      header: 'Access Hardware',
      render: (a) => <span className="text-xs text-slate-400">{a.deviceName}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (a) => <StatusBadge status={a.status} />,
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Attendance Status',
      options: [
        { label: 'Present On-Time', value: 'PRESENT' },
        { label: 'Late Gate Entry', value: 'LATE' },
        { label: 'Half Day Shift', value: 'HALF_DAY' },
        { label: 'Absent', value: 'ABSENT' },
      ],
    },
    {
      key: 'departmentName',
      label: 'Department',
      options: departments.map((d) => ({ label: d.departmentName, value: d.departmentName })),
    },
  ];

  const displayedRecords = isAdmin
    ? records
    : records.filter((a) => a.employeeId === user?.employeeId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isAdmin ? 'Gate Turnstile & Biometric Attendance' : 'My Gate Attendance Punch Records'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isAdmin
              ? 'Real-time optical and RFID turnstile punch ledger stored inside PostgreSQL ATTENDANCE table.'
              : 'Personal biometric turnstile and RFID entry punch audit log.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={loadData}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>

          {isAdmin && (
            <Button
              variant="primary"
              onClick={() => setIsSimulateOpen(true)}
              leftIcon={<Fingerprint className="w-4 h-4" />}
            >
              Simulate Gate Punch
            </Button>
          )}
        </div>
      </div>

      <DataTable
        data={displayedRecords}
        columns={columns}
        rowKey={(a) => a.attendanceId}
        searchKey={(a) => `${a.attendanceId} ${a.employeeName} ${a.employeeId} ${a.departmentName}`}
        searchPlaceholder={isAdmin ? 'Search attendance by employee, ID, department...' : 'Search your attendance records...'}
        filters={filters}
        isLoading={isLoading}
      />

      {isAdmin && (
        <SimulateAttendanceModal
          isOpen={isSimulateOpen}
          onClose={() => setIsSimulateOpen(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
};
