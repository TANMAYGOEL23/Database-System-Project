import { apiClient, simulateLatency } from './api';
import { Employee } from '../types/hr';
import { mockDb } from './mockStorage';

export const employeeService = {
  async getAll(): Promise<Employee[]> {
    try {
      const response = await apiClient.get<Employee[]>('/employees');
      return response.data;
    } catch {
      await simulateLatency(200);
      return mockDb.getEmployees();
    }
  },

  async getById(id: string): Promise<Employee> {
    try {
      const response = await apiClient.get<Employee>(`/employees/${id}`);
      return response.data;
    } catch {
      await simulateLatency(150);
      const employees = mockDb.getEmployees();
      const emp = employees.find((e) => e.employeeId === id);
      if (!emp) throw new Error(`Employee ${id} not found`);
      return emp;
    }
  },

  async create(employee: Omit<Employee, 'employeeId'>): Promise<Employee> {
    try {
      const response = await apiClient.post<Employee>('/employees', employee);
      return response.data;
    } catch {
      await simulateLatency(300);
      const employees = mockDb.getEmployees();
      const newId = `EMP${String(employees.length + 1).padStart(3, '0')}`;
      const newEmp: Employee = {
        ...employee,
        employeeId: newId,
        fullName: `${employee.firstName} ${employee.lastName}`,
      };
      mockDb.setEmployees([newEmp, ...employees]);
      return newEmp;
    }
  },

  async update(id: string, updates: Partial<Employee>): Promise<Employee> {
    try {
      const response = await apiClient.put<Employee>(`/employees/${id}`, updates);
      return response.data;
    } catch {
      await simulateLatency(250);
      const employees = mockDb.getEmployees();
      const index = employees.findIndex((e) => e.employeeId === id);
      if (index === -1) throw new Error(`Employee ${id} not found`);
      const updated: Employee = {
        ...employees[index],
        ...updates,
        fullName: updates.firstName || updates.lastName 
          ? `${updates.firstName || employees[index].firstName} ${updates.lastName || employees[index].lastName}`
          : employees[index].fullName,
      };
      employees[index] = updated;
      mockDb.setEmployees(employees);
      return updated;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/employees/${id}`);
    } catch {
      await simulateLatency(250);
      const employees = mockDb.getEmployees();
      mockDb.setEmployees(employees.filter((e) => e.employeeId !== id));
    }
  },
};
