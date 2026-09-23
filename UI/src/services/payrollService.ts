import { delay } from './api';
import { supabase, isSupabaseConfigured } from './supabase';
import { mockStorage } from './mockStorage';
import { Payroll } from '../types/hr';

function mapPayrollFromDb(row: any): Payroll {
  return {
    payrollId: row.payroll_id || row.payrollId,
    employeeId: row.employee_id || row.employeeId,
    employeeName: row.employee_name || row.employeeName,
    departmentName: row.department_name || row.departmentName,
    month: row.month,
    year: row.year,
    basicSalary: parseFloat(row.basic_salary || row.basicSalary || 0),
    bonus: parseFloat(row.bonus || 0),
    deduction: parseFloat(row.deduction || 0),
    netSalary: parseFloat(row.net_salary || row.netSalary || 0),
    status: row.status,
    paymentDate: row.payment_date || row.paymentDate,
    notes: row.notes,
  };
}

export const payrollService = {
  async getAll(): Promise<Payroll[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('payroll').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map(mapPayrollFromDb);
    }

    await delay(200);
    return mockStorage.payroll;
  },

  async generatePayroll(employeeId: string, month: string, year: number, bonus: number = 0, deduction: number = 0): Promise<Payroll> {
    if (isSupabaseConfigured()) {
      const { data: emp } = await supabase.from('employees').select('*').eq('employee_id', employeeId).single();
      const basic = (parseFloat(emp?.salary || 60000)) / 12;
      const net = basic + bonus - deduction;

      const payload = {
        employee_id: employeeId,
        employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Staff Member',
        department_name: emp?.department_name || 'Plant Operations',
        month,
        year,
        basic_salary: parseFloat(basic.toFixed(2)),
        bonus,
        deduction,
        net_salary: parseFloat(net.toFixed(2)),
        status: 'PAID',
        payment_date: new Date().toISOString().split('T')[0],
      };

      const { data, error } = await supabase.from('payroll').insert([payload]).select().single();
      if (error) throw new Error(error.message);
      return mapPayrollFromDb(data);
    }

    await delay(300);
    const emp = mockStorage.employees.find((e) => e.employeeId === employeeId);
    const basic = (emp?.salary || 60000) / 12;
    const net = basic + bonus - deduction;

    const newPay: Payroll = {
      payrollId: `PAY${year}${month.substring(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`,
      employeeId,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Worker',
      departmentName: emp?.departmentName || 'Operations',
      month,
      year,
      basicSalary: parseFloat(basic.toFixed(2)),
      bonus,
      deduction,
      netSalary: parseFloat(net.toFixed(2)),
      status: 'PAID',
      paymentDate: new Date().toISOString().split('T')[0],
    };

    mockStorage.payroll = [newPay, ...mockStorage.payroll];
    return newPay;
  },
};
