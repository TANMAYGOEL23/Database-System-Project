import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { useNotification } from '../../context/NotificationContext';
import { employeeService } from '../../services/employeeService';
import { attendanceService } from '../../services/attendanceService';
import { Employee, AttendanceDevice } from '../../types/hr';
import { Fingerprint, LogIn, LogOut, CheckCircle2 } from 'lucide-react';

export interface SimulateAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SimulateAttendanceModal: React.FC<SimulateAttendanceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [devices, setDevices] = useState<AttendanceDevice[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [punchType, setPunchType] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useNotification();

  useEffect(() => {
    if (isOpen) {
      const loadInitial = async () => {
        const [empList, devList] = await Promise.all([
          employeeService.getAll(),
          attendanceService.getDevices(),
        ]);
        setEmployees(empList);
        setDevices(devList);
        if (empList.length > 0) setSelectedEmployeeId(empList[0].employeeId);
        if (devList.length > 0) setSelectedDeviceId(devList[0].deviceId);
      };
      loadInitial();
    }
  }, [isOpen]);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !selectedDeviceId) return;

    try {
      setIsLoading(true);
      const record = await attendanceService.punchAttendance({
        employeeId: selectedEmployeeId,
        deviceId: selectedDeviceId,
        type: punchType,
      });

      showToast(
        'success',
        `Attendance Punched: ${punchType === 'CHECK_IN' ? 'Check-In' : 'Check-Out'}`,
        `${record.employeeName} marked at ${record.deviceName} (${record.checkIn || record.checkOut})`
      );

      onSuccess?.();
      onClose();
    } catch (err: any) {
      showToast('error', 'Simulation Failed', err.message || 'Could not record attendance');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedEmp = employees.find((e) => e.employeeId === selectedEmployeeId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Simulate Turnstile / Biometric Gate Punch"
      subtitle="Virtual RFID and Biometric Gate Event Simulator"
      maxWidth="md"
      icon={<Fingerprint className="w-5 h-5 text-blue-400" />}
    >
      <form onSubmit={handleSimulate} className="space-y-4">
        <Select
          label="Select Plant Worker / Employee"
          value={selectedEmployeeId}
          onChange={(e) => setSelectedEmployeeId(e.target.value)}
          options={employees.map((emp) => ({
            label: `${emp.fullName || emp.firstName + ' ' + emp.lastName} (${emp.employeeId} - ${emp.departmentName})`,
            value: emp.employeeId,
          }))}
          required
        />

        <Select
          label="Access Gate / Attendance Device"
          value={selectedDeviceId}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
          options={devices.map((dev) => ({
            label: `${dev.deviceName} [${dev.location}]`,
            value: dev.deviceId,
          }))}
          required
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">Punch Event Action</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPunchType('CHECK_IN')}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                punchType === 'CHECK_IN'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-md shadow-blue-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Check-In (Entry)
            </button>
            <button
              type="button"
              onClick={() => setPunchType('CHECK_OUT')}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                punchType === 'CHECK_OUT'
                  ? 'bg-amber-600/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <LogOut className="w-4 h-4" />
              Check-Out (Exit)
            </button>
          </div>
        </div>

        {selectedEmp && (
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1 text-slate-400">
            <div className="flex justify-between">
              <span>Department:</span>
              <span className="font-semibold text-slate-200">{selectedEmp.departmentName}</span>
            </div>
            <div className="flex justify-between">
              <span>Role / Position:</span>
              <span className="font-semibold text-slate-200">{selectedEmp.position || 'Plant Technician'}</span>
            </div>
            <div className="flex justify-between">
              <span>Current Status:</span>
              <span className="text-emerald-400 font-mono font-semibold">{selectedEmp.status}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button variant="secondary" onClick={onClose} type="button" disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isLoading}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Trigger Punch Event
          </Button>
        </div>
      </form>
    </Modal>
  );
};
