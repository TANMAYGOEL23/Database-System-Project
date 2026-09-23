export interface Department {
  departmentId: string;
  departmentName: string;
  managerId: string;
  managerName?: string;
  employeeCount: number;
  location?: string;
}

export type EmployeeGender = 'MALE' | 'FEMALE' | 'OTHER';
export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';

export interface Employee {
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  gender: EmployeeGender;
  phone: string;
  email: string;
  address: string;
  departmentId: string;
  departmentName?: string;
  salary: number;
  joiningDate: string;
  status: EmployeeStatus;
  position?: string;
}

export interface AttendanceDevice {
  deviceId: string;
  deviceName: string;
  location: string;
  deviceType: 'RFID_GATE' | 'BIOMETRIC' | 'FACIAL_SCANNER' | 'VIRTUAL_PUNCH';
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  lastPing?: string;
}

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ABSENT';

export interface AttendanceRecord {
  attendanceId: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  deviceId: string;
  deviceName: string;
  status: AttendanceStatus;
  workHours?: number;
}

export type PayrollStatus = 'PAID' | 'PENDING' | 'PROCESSING';

export interface Payroll {
  payrollId: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  month: string;
  year: number;
  basicSalary: number;
  bonus: number;
  deduction: number;
  netSalary: number;
  status: PayrollStatus;
  paymentDate?: string;
  notes?: string;
}
