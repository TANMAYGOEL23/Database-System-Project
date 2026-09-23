import { delay } from './api';
import { supabase, isSupabaseConfigured } from './supabase';
import { mockStorage } from './mockStorage';
import { AttendanceRecord, AttendanceDevice } from '../types/hr';

function mapAttendanceFromDb(row: any): AttendanceRecord {
  return {
    attendanceId: row.attendance_id || row.attendanceId,
    employeeId: row.employee_id || row.employeeId,
    employeeName: row.employee_name || row.employeeName,
    departmentName: row.department_name || row.departmentName,
    date: row.date,
    checkIn: row.check_in || row.checkIn,
    checkOut: row.check_out || row.checkOut,
    deviceId: row.device_id || row.deviceId,
    deviceName: row.device_name || row.deviceName,
    status: row.status,
    workHours: parseFloat(row.work_hours || row.workHours || 8.0),
  };
}

function mapDeviceFromDb(row: any): AttendanceDevice {
  return {
    deviceId: row.device_id || row.deviceId,
    deviceName: row.device_name || row.deviceName,
    location: row.location,
    deviceType: row.device_type || row.deviceType,
    status: row.status,
    lastPing: row.last_ping || row.lastPing || 'Online',
  };
}

export const attendanceService = {
  async getAll(): Promise<AttendanceRecord[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('attendance').select('*').order('date', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map(mapAttendanceFromDb);
    }

    await delay(200);
    return mockStorage.attendance;
  },

  async getDevices(): Promise<AttendanceDevice[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('attendance_devices').select('*');
      if (error) throw new Error(error.message);
      return (data || []).map(mapDeviceFromDb);
    }

    await delay(150);
    return mockStorage.attendanceDevices;
  },

  async punchAttendance(payload: {
    employeeId: string;
    deviceId: string;
    type: 'CHECK_IN' | 'CHECK_OUT';
    timestamp?: string;
  }): Promise<AttendanceRecord> {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isSupabaseConfigured()) {
      // Fetch employee & device info
      const { data: emp } = await supabase.from('employees').select('*').eq('employee_id', payload.employeeId).single();
      const { data: dev } = await supabase.from('attendance_devices').select('*').eq('device_id', payload.deviceId).single();

      if (payload.type === 'CHECK_OUT') {
        const { data: existing } = await supabase.from('attendance').select('*').eq('employee_id', payload.employeeId).eq('date', today).single();
        if (existing) {
          const { data: updated, error } = await supabase
            .from('attendance')
            .update({ check_out: nowTime, work_hours: 8.5 })
            .eq('attendance_id', existing.attendance_id)
            .select()
            .single();
          if (error) throw new Error(error.message);
          return mapAttendanceFromDb(updated);
        }
      }

      const insertPayload = {
        employee_id: payload.employeeId,
        employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Staff Member',
        department_name: emp?.department_name || 'Plant Operations',
        date: today,
        check_in: nowTime,
        device_id: payload.deviceId,
        device_name: dev?.device_name || 'Gate Scanner',
        status: 'PRESENT',
        work_hours: 8.0,
      };

      const { data: created, error } = await supabase.from('attendance').insert([insertPayload]).select().single();
      if (error) throw new Error(error.message);
      return mapAttendanceFromDb(created);
    }

    await delay(300);
    const employee = mockStorage.employees.find((e) => e.employeeId === payload.employeeId);
    const device = mockStorage.attendanceDevices.find((d) => d.deviceId === payload.deviceId);

    const records = mockStorage.attendance;
    const existingIdx = records.findIndex(
      (r) => r.employeeId === payload.employeeId && r.date === today
    );

    if (payload.type === 'CHECK_OUT' && existingIdx !== -1) {
      records[existingIdx].checkOut = nowTime;
      records[existingIdx].workHours = 8.5;
      mockStorage.attendance = records;
      return records[existingIdx];
    }

    const newRecord: AttendanceRecord = {
      attendanceId: `ATT${Math.floor(1000 + Math.random() * 9000)}`,
      employeeId: payload.employeeId,
      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : 'Plant Worker',
      departmentName: employee?.departmentName || 'Operations',
      date: today,
      checkIn: nowTime,
      deviceId: payload.deviceId,
      deviceName: device ? device.deviceName : 'Gate Turnstile',
      status: 'PRESENT',
      workHours: 8.0,
    };

    mockStorage.attendance = [newRecord, ...records];
    return newRecord;
  },
};
