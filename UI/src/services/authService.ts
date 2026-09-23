import { delay } from './api';
import { supabase, isSupabaseConfigured } from './supabase';
import { mockStorage } from './mockStorage';
import { LoginRequest, LoginResponse, User } from '../types/auth';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .ilike('username', credentials.username.trim())
          .single();

        if (error || !data) {
          throw new Error('Invalid username or password');
        }

        const user: User = {
          userId: data.user_id || data.userId,
          employeeId: data.employee_id || data.employeeId,
          username: data.username,
          role: data.role,
          status: data.status,
          fullName: data.full_name || data.fullName,
          email: data.email,
          departmentName: data.department_name || data.departmentName,
          position: data.position,
          avatarUrl: data.avatar_url || data.avatarUrl,
        };

        const token = `sb-jwt-${user.userId}-${Date.now()}`;
        return {
          token,
          user,
          expiresIn: 86400,
        };
      } catch (err: any) {
        console.warn('Supabase auth failed, trying fallback', err);
        throw err;
      }
    }

    // Mock Fallback
    await delay(300);
    const user = mockStorage.users.find(
      (u) => u.username.toLowerCase() === credentials.username.toLowerCase()
    );

    if (user) {
      const token = `mock-jwt-token-${user.role.toLowerCase()}-${Date.now()}`;
      return {
        token,
        user,
        expiresIn: 86400,
      };
    }

    if (credentials.username.toLowerCase().includes('admin')) {
      const adminUser = mockStorage.users[0];
      return {
        token: `mock-jwt-token-admin-${Date.now()}`,
        user: adminUser,
        expiresIn: 86400,
      };
    }

    const empUser = mockStorage.users[1];
    return {
      token: `mock-jwt-token-employee-${Date.now()}`,
      user: empUser,
      expiresIn: 86400,
    };
  },

  async getCurrentUser(): Promise<User | null> {
    const savedUser = localStorage.getItem('smart_erp_user');
    return savedUser ? JSON.parse(savedUser) : null;
  },

  async logout(): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    localStorage.removeItem('smart_erp_token');
    localStorage.removeItem('smart_erp_user');
  },
};
