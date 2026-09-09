import React, { useState, useEffect } from 'react';
import { Radio, UserCheck, Clock, MapPin } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { attendanceService } from '../../services/attendanceService';
import { employeeService } from '../../services/employeeService';
import { useNotification } from '../../context/NotificationContext';
import { Employee, AttendanceDevice } from '../../types/hr';

interface SimulateAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SimulateAttendanceModal: React.FC<SimulateAttendanceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [devices, setDevices] = useState<AttendanceDevice[]>([]);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [selectedDevice, setSelectedDevice] = useState('');
  const [action, setAction] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');
  const [simulatedTime, setSimulatedTime] = useState(
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  );
  const [isLoading, setIsLoading] = useState(false);

  const { showToast } = useNotification();

  useEffect(() => {
    if (isOpen) {
      const load = async () => {
        const emps = await employeeService.getAll();
        const devs = await attendanceService.getDevices();
        setEmployees(emps);
        setDevices(devs);
        if (emps.length > 0) setSelectedEmp(emps[0].employeeId);
        if (devs.length > 0) setSelectedDevice(devs[0].deviceId);
      };
      load();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !selectedDevice) return;

    try {
      setIsLoading(true);
      const record = await attendanceService.simulateAttendancePunch({
        employeeId: selectedEmp,
        deviceId: selectedDevice,
        action,
        time: simulatedTime,
      });

      showToast(
        'success',
        'Simulated Attendance Punch Processed',
        `${record.employeeName} - ${action === 'CHECK_IN' ? 'Checked In' : 'Checked Out'} via ${record.deviceName} at ${record.checkIn || record.checkOut}`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast('error', 'Attendance Simulation Error', err.message || 'Failed to simulate attendance');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Simulate Factory Attendance Punch"
      subtitle="Software simulation of RFID Turnstile & Biometric Gate operations"
      icon={<Radio className="w-5 h-5 text-blue-400" />}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-lg text-xs text-blue-300 flex items-start gap-2">
          <Radio className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
          <span>
            <strong>Simulation Note:</strong> This emulates the physical hardware RFID card tap or biometric scanner sending an event packet to the backend attendance API.
          </span>
        </div>

        <Select
          label="Select Employee"
          value={selectedEmp}
          onChange={(e) => setSelectedEmp(e.target.value)}
          options={employees.map((emp) => ({
            value: emp.employeeId,
            label: `${emp.employeeId} - ${emp.fullName || emp.firstName + ' ' + emp.lastName} (${emp.departmentName})`,
          }))}
          required
        />

        <Select
          label="Access Terminal / Gate"
          value={selectedDevice}
          onChange={(e) => setSelectedDevice(e.target.value)}
          options={devices.map((d) => ({
            value: d.deviceId,
            label: `${d.deviceName} [${d.location}]`,
          }))}
          required
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Action Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAction('CHECK_IN')}
              className={`p-3 rounded-lg border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                action === 'CHECK_IN'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-4 h-4" /> Check In
            </button>
            <button
              type="button"
              onClick={() => setAction('CHECK_OUT')}
              className={`p-3 rounded-lg border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                action === 'CHECK_OUT'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300 ring-1 ring-blue-500'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" /> Check Out
            </button>
          </div>
        </div>

        <Input
          label="Timestamp (Simulated)"
          value={simulatedTime}
          onChange={(e) => setSimulatedTime(e.target.value)}
          leftIcon={<Clock className="w-4 h-4 text-slate-400" />}
          required
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading} leftIcon={<Radio className="w-4 h-4" />}>
            Transmit Simulated Punch
          </Button>
        </div>
      </form>
    </Modal>
  );
};
