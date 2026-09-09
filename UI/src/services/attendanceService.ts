import { apiClient, simulateLatency } from './api';
import { AttendanceRecord, AttendanceDevice } from '../types/hr';
import { mockDb } from './mockStorage';

export const attendanceService = {
  async getAllRecords(): Promise<AttendanceRecord[]> {
    try {
      const response = await apiClient.get<AttendanceRecord[]>('/attendance');
      return response.data;
    } catch {
      await simulateLatency(200);
      return mockDb.getAttendanceRecords();
    }
  },

  async getDevices(): Promise<AttendanceDevice[]> {
    try {
      const response = await apiClient.get<AttendanceDevice[]>('/attendance/devices');
      return response.data;
    } catch {
      await simulateLatency(150);
      return mockDb.getAttendanceDevices();
    }
  },

  async getByEmployeeId(employeeId: string): Promise<AttendanceRecord[]> {
    try {
      const response = await apiClient.get<AttendanceRecord[]>(`/attendance/employee/${employeeId}`);
      return response.data;
    } catch {
      await simulateLatency(150);
      const records = mockDb.getAttendanceRecords();
      return records.filter((r) => r.employeeId === employeeId);
    }
  },

  async simulateAttendancePunch(data: {
    employeeId: string;
    deviceId: string;
    action: 'CHECK_IN' | 'CHECK_OUT';
    time?: string;
    date?: string;
  }): Promise<AttendanceRecord> {
    try {
      const response = await apiClient.post<AttendanceRecord>('/attendance/simulate', data);
      return response.data;
    } catch {
      await simulateLatency(300);
      const employees = mockDb.getEmployees();
      const devices = mockDb.getAttendanceDevices();
      const records = mockDb.getAttendanceRecords();

      const emp = employees.find((e) => e.employeeId === data.employeeId);
      const dev = devices.find((d) => d.deviceId === data.deviceId);

      if (!emp) throw new Error('Employee not found');
      const timeStr = data.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const dateStr = data.date || new Date().toISOString().split('T')[0];

      // Check if record exists for today
      const existingIdx = records.findIndex(
        (r) => r.employeeId === data.employeeId && r.date === dateStr
      );

      if (existingIdx !== -1 && data.action === 'CHECK_OUT') {
        const updated: AttendanceRecord = {
          ...records[existingIdx],
          checkOut: timeStr,
          deviceId: data.deviceId,
          deviceName: dev ? dev.deviceName : 'Simulated Gate',
          workHours: 8.0,
        };
        records[existingIdx] = updated;
        mockDb.setAttendanceRecords(records);
        return updated;
      } else {
        const newRecord: AttendanceRecord = {
          attendanceId: `ATT${String(records.length + 1).padStart(3, '0')}`,
          employeeId: emp.employeeId,
          employeeName: emp.fullName || `${emp.firstName} ${emp.lastName}`,
          departmentName: emp.departmentName || 'Operations',
          date: dateStr,
          checkIn: timeStr,
          deviceId: data.deviceId,
          deviceName: dev ? dev.deviceName : 'Simulated RFID Gate',
          status: 'PRESENT',
          workHours: 1.0,
        };
        mockDb.setAttendanceRecords([newRecord, ...records]);
        return newRecord;
      }
    }
  },
};
