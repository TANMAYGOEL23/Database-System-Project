import React, { useState, useEffect } from 'react';
import { Radio, CalendarCheck2, Clock, UserCheck, Filter, Download, User } from 'lucide-react';
import { DataTable, Column, FilterConfig } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SimulateAttendanceModal } from '../../components/simulation/SimulateAttendanceModal';
import { attendanceService } from '../../services/attendanceService';
import { employeeService } from '../../services/employeeService';
import { departmentService } from '../../services/departmentService';
import { useAuth } from '../../context/AuthContext';
import { AttendanceRecord, Department, Employee } from '../../types/hr';
import { formatDate } from '../../utils/formatters';

export const Attendance: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [recs, emps, depts] = await Promise.all([
        isAdmin
          ? attendanceService.getAllRecords()
          : attendanceService.getByEmployeeId(user?.employeeId || 'EMP002'),
        employeeService.getAll(),
        departmentService.getAll(),
      ]);
      setRecords(recs);
      setEmployees(emps);
      setDepartments(depts);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin, user]);

  const columns: Column<AttendanceRecord>[] = [
    {
      key: 'employeeName',
      header: 'Employee',
      sortable: true,
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-100">{r.employeeName}</div>
          <div className="text-[11px] font-mono text-blue-400">{r.employeeId}</div>
        </div>
      ),
    },
    {
      key: 'departmentName',
      header: 'Department',
      sortable: true,
      render: (r) => <span className="text-slate-300">{r.departmentName}</span>,
    },
    {
      key: 'date',
      header: 'Shift Date',
      sortable: true,
      render: (r) => <span className="font-mono text-xs text-slate-300">{formatDate(r.date)}</span>,
    },
    {
      key: 'checkIn',
      header: 'Check In',
      sortable: true,
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-emerald-400">
          {r.checkIn || '—'}
        </span>
      ),
    },
    {
      key: 'checkOut',
      header: 'Check Out',
      sortable: true,
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-blue-400">
          {r.checkOut || 'Active On-Shift'}
        </span>
      ),
    },
    {
      key: 'deviceName',
      header: 'Access Gate / Device',
      render: (r) => (
        <span className="text-xs text-slate-400 font-mono">
          {r.deviceName}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (r) => <StatusBadge status={r.status} />,
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'departmentName',
      label: 'Departments',
      options: departments.map((d) => ({ label: d.departmentName, value: d.departmentName })),
    },
    {
      key: 'status',
      label: 'Attendance Status',
      options: [
        { label: 'Present', value: 'PRESENT' },
        { label: 'Late', value: 'LATE' },
        { label: 'Half Day', value: 'HALF_DAY' },
        { label: 'Absent', value: 'ABSENT' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isAdmin ? 'Workforce Attendance & Turnstile Ledger' : 'My Attendance History'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isAdmin
              ? 'Real-time logging from simulated RFID turnstiles, biometric scanners, and plant kiosks.'
              : 'View your recorded clock-ins, punch device history, and shift hours.'}
          </p>
        </div>

        <Button
          variant="emerald"
          onClick={() => setIsSimulateOpen(true)}
          leftIcon={<Radio className="w-4 h-4" />}
        >
          Simulate Attendance Punch
        </Button>
      </div>

      {/* Table */}
      <DataTable
        data={records}
        columns={columns}
        rowKey={(r) => r.attendanceId}
        searchKey={(r) => `${r.employeeName} ${r.employeeId} ${r.departmentName} ${r.deviceName} ${r.date}`}
        searchPlaceholder="Search punches by employee, ID, gate..."
        filters={filters}
        isLoading={isLoading}
      />

      {/* Simulator Modal */}
      <SimulateAttendanceModal
        isOpen={isSimulateOpen}
        onClose={() => setIsSimulateOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
