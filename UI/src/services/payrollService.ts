import { apiClient, simulateLatency } from './api';
import { Payroll } from '../types/hr';
import { mockDb } from './mockStorage';

export const payrollService = {
  async getAll(): Promise<Payroll[]> {
    try {
      const response = await apiClient.get<Payroll[]>('/payroll');
      return response.data;
    } catch {
      await simulateLatency(200);
      return mockDb.getPayrolls();
    }
  },

  async getByEmployeeId(employeeId: string): Promise<Payroll[]> {
    try {
      const response = await apiClient.get<Payroll[]>(`/payroll/employee/${employeeId}`);
      return response.data;
    } catch {
      await simulateLatency(150);
      const payrolls = mockDb.getPayrolls();
      return payrolls.filter((p) => p.employeeId === employeeId);
    }
  },

  async create(payroll: Omit<Payroll, 'payrollId' | 'netSalary'>): Promise<Payroll> {
    try {
      const response = await apiClient.post<Payroll>('/payroll', payroll);
      return response.data;
    } catch {
      await simulateLatency(250);
      const payrolls = mockDb.getPayrolls();
      const newId = `PAY${String(payrolls.length + 1).padStart(3, '0')}`;
      const netSalary = Number(payroll.basicSalary) + Number(payroll.bonus || 0) - Number(payroll.deduction || 0);

      const newPayroll: Payroll = {
        ...payroll,
        payrollId: newId,
        netSalary: Math.max(0, netSalary),
      };
      mockDb.setPayrolls([newPayroll, ...payrolls]);
      return newPayroll;
    }
  },

  async update(id: string, updates: Partial<Payroll>): Promise<Payroll> {
    try {
      const response = await apiClient.put<Payroll>(`/payroll/${id}`, updates);
      return response.data;
    } catch {
      await simulateLatency(200);
      const payrolls = mockDb.getPayrolls();
      const index = payrolls.findIndex((p) => p.payrollId === id);
      if (index === -1) throw new Error(`Payroll ${id} not found`);

      const current = payrolls[index];
      const basic = updates.basicSalary !== undefined ? updates.basicSalary : current.basicSalary;
      const bonus = updates.bonus !== undefined ? updates.bonus : current.bonus;
      const deduction = updates.deduction !== undefined ? updates.deduction : current.deduction;
      const netSalary = Number(basic) + Number(bonus) - Number(deduction);

      const updated: Payroll = {
        ...current,
        ...updates,
        netSalary: Math.max(0, netSalary),
      };
      payrolls[index] = updated;
      mockDb.setPayrolls(payrolls);
      return updated;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/payroll/${id}`);
    } catch {
      await simulateLatency(200);
      const payrolls = mockDb.getPayrolls();
      mockDb.setPayrolls(payrolls.filter((p) => p.payrollId !== id));
    }
  },
};
