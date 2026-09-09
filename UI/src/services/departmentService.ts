import { apiClient, simulateLatency } from './api';
import { Department } from '../types/hr';
import { mockDb } from './mockStorage';

export const departmentService = {
  async getAll(): Promise<Department[]> {
    try {
      const response = await apiClient.get<Department[]>('/departments');
      return response.data;
    } catch {
      await simulateLatency(200);
      return mockDb.getDepartments();
    }
  },

  async create(dept: Omit<Department, 'departmentId' | 'employeeCount'>): Promise<Department> {
    try {
      const response = await apiClient.post<Department>('/departments', dept);
      return response.data;
    } catch {
      await simulateLatency(250);
      const depts = mockDb.getDepartments();
      const newId = `DEP${String(depts.length + 1).padStart(3, '0')}`;
      const newDept: Department = {
        ...dept,
        departmentId: newId,
        employeeCount: 0,
      };
      mockDb.setDepartments([...depts, newDept]);
      return newDept;
    }
  },

  async update(id: string, updates: Partial<Department>): Promise<Department> {
    try {
      const response = await apiClient.put<Department>(`/departments/${id}`, updates);
      return response.data;
    } catch {
      await simulateLatency(200);
      const depts = mockDb.getDepartments();
      const index = depts.findIndex((d) => d.departmentId === id);
      if (index === -1) throw new Error(`Department ${id} not found`);
      depts[index] = { ...depts[index], ...updates };
      mockDb.setDepartments(depts);
      return depts[index];
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/departments/${id}`);
    } catch {
      await simulateLatency(200);
      const depts = mockDb.getDepartments();
      mockDb.setDepartments(depts.filter((d) => d.departmentId !== id));
    }
  },
};
