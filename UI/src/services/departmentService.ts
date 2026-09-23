import { delay } from './api';
import { supabase, isSupabaseConfigured } from './supabase';
import { mockStorage } from './mockStorage';
import { Department } from '../types/hr';

function mapDeptFromDb(row: any): Department {
  return {
    departmentId: row.department_id || row.departmentId,
    departmentName: row.department_name || row.departmentName,
    managerId: row.manager_id || row.managerId,
    managerName: row.manager_name || row.managerName,
    employeeCount: row.employee_count || row.employeeCount || 0,
    location: row.location,
  };
}

export const departmentService = {
  async getAll(): Promise<Department[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('departments').select('*').order('department_name');
      if (error) throw new Error(error.message);
      return (data || []).map(mapDeptFromDb);
    }

    await delay(200);
    return mockStorage.departments;
  },

  async create(dept: Omit<Department, 'departmentId' | 'employeeCount'>): Promise<Department> {
    if (isSupabaseConfigured()) {
      const payload = {
        department_name: dept.departmentName,
        manager_id: dept.managerId,
        manager_name: dept.managerName,
        location: dept.location,
      };
      const { data, error } = await supabase.from('departments').insert([payload]).select().single();
      if (error) throw new Error(error.message);
      return mapDeptFromDb(data);
    }

    await delay(300);
    const list = mockStorage.departments;
    const newDept: Department = {
      ...dept,
      departmentId: `DEP${String(list.length + 1).padStart(3, '0')}`,
      employeeCount: 0,
    };
    mockStorage.departments = [...list, newDept];
    return newDept;
  },

  async update(id: string, dept: Partial<Department>): Promise<Department> {
    if (isSupabaseConfigured()) {
      const payload: any = {};
      if (dept.departmentName) payload.department_name = dept.departmentName;
      if (dept.managerId) payload.manager_id = dept.managerId;
      if (dept.managerName) payload.manager_name = dept.managerName;
      if (dept.location) payload.location = dept.location;

      const { data, error } = await supabase.from('departments').update(payload).eq('department_id', id).select().single();
      if (error) throw new Error(error.message);
      return mapDeptFromDb(data);
    }

    await delay(250);
    const list = mockStorage.departments;
    const idx = list.findIndex((d) => d.departmentId === id);
    if (idx === -1) throw new Error(`Department ${id} not found`);
    list[idx] = { ...list[idx], ...dept };
    mockStorage.departments = list;
    return list[idx];
  },

  async delete(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('departments').delete().eq('department_id', id);
      if (error) throw new Error(error.message);
      return;
    }

    await delay(250);
    mockStorage.departments = mockStorage.departments.filter((d) => d.departmentId !== id);
  },
};
