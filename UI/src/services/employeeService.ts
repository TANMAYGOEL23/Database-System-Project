import { delay } from './api';
import { supabase, isSupabaseConfigured } from './supabase';
import { mockStorage } from './mockStorage';
import { Employee } from '../types/hr';

function mapEmployeeFromDb(row: any): Employee {
  return {
    employeeId: row.employee_id || row.employeeId,
    firstName: row.first_name || row.firstName,
    lastName: row.last_name || row.lastName,
    fullName: row.full_name || row.fullName || `${row.first_name || ''} ${row.last_name || ''}`.trim(),
    gender: row.gender,
    phone: row.phone,
    email: row.email,
    address: row.address,
    departmentId: row.department_id || row.departmentId,
    departmentName: row.department_name || row.departmentName,
    salary: parseFloat(row.salary || 0),
    joiningDate: row.joining_date || row.joiningDate,
    status: row.status,
    position: row.position,
  };
}

export const employeeService = {
  async getAll(): Promise<Employee[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map(mapEmployeeFromDb);
    }

    await delay(200);
    return mockStorage.employees;
  },

  async getById(id: string): Promise<Employee> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('employees').select('*').eq('employee_id', id).single();
      if (error) throw new Error(error.message);
      return mapEmployeeFromDb(data);
    }

    await delay(150);
    const emp = mockStorage.employees.find((e) => e.employeeId === id);
    if (!emp) throw new Error(`Employee ${id} not found`);
    return emp;
  },

  async create(employee: Omit<Employee, 'employeeId'>): Promise<Employee> {
    if (isSupabaseConfigured()) {
      const payload = {
        first_name: employee.firstName,
        last_name: employee.lastName,
        gender: employee.gender,
        phone: employee.phone,
        email: employee.email,
        address: employee.address,
        department_id: employee.departmentId,
        department_name: employee.departmentName,
        salary: employee.salary,
        joining_date: employee.joiningDate,
        status: employee.status,
        position: employee.position,
      };

      const { data, error } = await supabase.from('employees').insert([payload]).select().single();
      if (error) throw new Error(error.message);
      return mapEmployeeFromDb(data);
    }

    await delay(300);
    const employees = mockStorage.employees;
    const nextId = `EMP${String(employees.length + 1).padStart(3, '0')}`;
    const newEmp: Employee = {
      ...employee,
      employeeId: nextId,
      fullName: `${employee.firstName} ${employee.lastName}`,
    };
    mockStorage.employees = [newEmp, ...employees];
    return newEmp;
  },

  async update(id: string, employee: Partial<Employee>): Promise<Employee> {
    if (isSupabaseConfigured()) {
      const payload: any = {};
      if (employee.firstName) payload.first_name = employee.firstName;
      if (employee.lastName) payload.last_name = employee.lastName;
      if (employee.gender) payload.gender = employee.gender;
      if (employee.phone) payload.phone = employee.phone;
      if (employee.email) payload.email = employee.email;
      if (employee.address) payload.address = employee.address;
      if (employee.departmentId) payload.department_id = employee.departmentId;
      if (employee.departmentName) payload.department_name = employee.departmentName;
      if (employee.salary !== undefined) payload.salary = employee.salary;
      if (employee.joiningDate) payload.joining_date = employee.joiningDate;
      if (employee.status) payload.status = employee.status;
      if (employee.position) payload.position = employee.position;

      const { data, error } = await supabase.from('employees').update(payload).eq('employee_id', id).select().single();
      if (error) throw new Error(error.message);
      return mapEmployeeFromDb(data);
    }

    await delay(250);
    const employees = mockStorage.employees;
    const index = employees.findIndex((e) => e.employeeId === id);
    if (index === -1) throw new Error(`Employee ${id} not found`);

    const updated = {
      ...employees[index],
      ...employee,
      fullName: employee.firstName && employee.lastName
        ? `${employee.firstName} ${employee.lastName}`
        : employees[index].fullName,
    };
    employees[index] = updated;
    mockStorage.employees = employees;
    return updated;
  },

  async delete(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('employees').delete().eq('employee_id', id);
      if (error) throw new Error(error.message);
      return;
    }

    await delay(250);
    mockStorage.employees = mockStorage.employees.filter((e) => e.employeeId !== id);
  },
};
