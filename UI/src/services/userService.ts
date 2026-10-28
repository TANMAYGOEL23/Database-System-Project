import { supabase, isSupabaseConfigured } from './supabase';
import { mockStorage } from './mockStorage';
import { User, UserRole, UserStatus } from '../types/auth';

const mapDbUser = (data: any): User => ({
  userId: data.user_id || data.userId,
  employeeId: data.employee_id || data.employeeId || '',
  username: data.username,
  role: (data.role as UserRole) || 'EMPLOYEE',
  status: (data.status as UserStatus) || 'ACTIVE',
  fullName: data.full_name || data.fullName,
  email: data.email,
  departmentName: data.department_name || data.departmentName || '',
  position: data.position || '',
  avatarUrl: data.avatar_url || data.avatarUrl || '',
});

export const userService = {
  /**
   * Retrieves all registered user accounts from Supabase users table (with mockStorage fallback).
   */
  async getAll(): Promise<User[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped = data.map(mapDbUser);
          mockStorage.users = mapped;
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase users query fallback:', err);
      }
    }
    return mockStorage.users;
  },

  /**
   * Retrieves a single user account by userId.
   */
  async getById(userId: string): Promise<User | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data) {
          return mapDbUser(data);
        }
      } catch (err) {
        console.warn('Supabase user query fallback:', err);
      }
    }
    const found = mockStorage.users.find((u) => u.userId === userId);
    return found || null;
  },

  /**
   * Looks up a user account by email address (case-insensitive).
   */
  async getByEmail(email: string): Promise<User | null> {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (!error && data) {
          return mapDbUser(data);
        }
      } catch (err) {
        console.warn('Supabase user by email fallback:', err);
      }
    }
    const found = mockStorage.users.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );
    return found || null;
  },

  /**
   * Adds a new authorized user / Google Mail account to the system.
   * Only accessible by Admins.
   */
  async create(user: Omit<User, 'userId'> & { userId?: string }): Promise<User> {
    const newUserId = user.userId || `USR-${Math.floor(100 + Math.random() * 900)}`;
    const record: User = {
      ...user,
      userId: newUserId,
      email: user.email.trim().toLowerCase(),
      username: (user.username || user.email.split('@')[0]).trim().toLowerCase(),
      status: user.status || 'ACTIVE',
      role: user.role || 'EMPLOYEE',
      departmentName: user.departmentName || 'Operations',
      position: user.position || 'Staff',
      employeeId: user.employeeId || '',
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('users')
          .insert({
            user_id: record.userId,
            employee_id: record.employeeId || null,
            username: record.username,
            role: record.role,
            status: record.status,
            full_name: record.fullName,
            email: record.email,
            department_name: record.departmentName,
            position: record.position,
            avatar_url: record.avatarUrl || null,
          })
          .select()
          .single();

        if (!error && data) {
          const mapped = mapDbUser(data);
          const currentList = [...mockStorage.users];
          const idx = currentList.findIndex((u) => u.userId === mapped.userId || u.email.toLowerCase() === mapped.email.toLowerCase());
          if (idx !== -1) {
            currentList[idx] = mapped;
          } else {
            currentList.unshift(mapped);
          }
          mockStorage.users = currentList;
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase user insert fallback:', err);
      }
    }

    // Fallback in-memory
    const currentList = [...mockStorage.users];
    const idx = currentList.findIndex((u) => u.userId === record.userId || u.email.toLowerCase() === record.email.toLowerCase());
    if (idx !== -1) {
      currentList[idx] = record;
    } else {
      currentList.unshift(record);
    }
    mockStorage.users = currentList;
    return record;
  },

  /**
   * Updates an existing user's details or switches their role (ADMIN <-> EMPLOYEE).
   */
  async update(userId: string, updates: Partial<User>): Promise<User> {
    if (isSupabaseConfigured()) {
      try {
        const dbPayload: any = {};
        if (updates.fullName !== undefined) dbPayload.full_name = updates.fullName;
        if (updates.email !== undefined) dbPayload.email = updates.email.trim().toLowerCase();
        if (updates.username !== undefined) dbPayload.username = updates.username.trim().toLowerCase();
        if (updates.role !== undefined) dbPayload.role = updates.role;
        if (updates.status !== undefined) dbPayload.status = updates.status;
        if (updates.departmentName !== undefined) dbPayload.department_name = updates.departmentName;
        if (updates.position !== undefined) dbPayload.position = updates.position;
        if (updates.employeeId !== undefined) dbPayload.employee_id = updates.employeeId || null;
        if (updates.avatarUrl !== undefined) dbPayload.avatar_url = updates.avatarUrl;

        const { data, error } = await supabase
          .from('users')
          .update(dbPayload)
          .eq('user_id', userId)
          .select()
          .single();

        if (!error && data) {
          const mapped = mapDbUser(data);
          const list = [...mockStorage.users];
          const index = list.findIndex((u) => u.userId === userId);
          if (index !== -1) {
            list[index] = mapped;
            mockStorage.users = list;
          }
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase user update fallback:', err);
      }
    }

    const list = [...mockStorage.users];
    const index = list.findIndex((u) => u.userId === userId);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      mockStorage.users = list;
      return list[index];
    }
    throw new Error(`User ${userId} not found`);
  },

  /**
   * Deactivates / removes a user account from the system.
   */
  async delete(userId: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('user_id', userId);

        if (!error) {
          const list = [...mockStorage.users];
          const index = list.findIndex((u) => u.userId === userId);
          if (index !== -1) {
            list.splice(index, 1);
            mockStorage.users = list;
          }
          return true;
        }
      } catch (err) {
        console.warn('Supabase user delete fallback:', err);
      }
    }

    const list = [...mockStorage.users];
    const index = list.findIndex((u) => u.userId === userId);
    if (index !== -1) {
      list.splice(index, 1);
      mockStorage.users = list;
      return true;
    }
    return false;
  },
};
