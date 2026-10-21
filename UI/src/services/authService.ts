import { delay } from './api';
import { supabase, isSupabaseConfigured } from './supabase';
import { mockStorage } from './mockStorage';
import { LoginRequest, LoginResponse, User } from '../types/auth';
import { hashPassword } from '../utils/crypto';

// Username aliases mapping for quick transition
const USERNAME_ALIASES: Record<string, string> = {
  admin: 'tanmay',
  operator: 'rohit',
};

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const rawUsername = credentials.username.trim().toLowerCase();
    const resolvedUsername = USERNAME_ALIASES[rawUsername] || rawUsername;
    const inputHash = await hashPassword(credentials.password || '');

    if (isSupabaseConfigured()) {
      try {
        // Query by username or resolved alias
        let { data, error } = await supabase
          .from('users')
          .select('*')
          .ilike('username', resolvedUsername)
          .single();

        if (error || !data) {
          // Fallback check original username
          const res = await supabase
            .from('users')
            .select('*')
            .ilike('username', rawUsername)
            .single();
          data = res.data;
          error = res.error;
        }

        if (error || !data) {
          throw new Error('Invalid username or password');
        }

        // Verify SHA-256 password hash if present in database
        if (data.password_hash) {
          if (data.password_hash !== inputHash) {
            throw new Error('Invalid username or password');
          }
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
        console.warn('Supabase auth check:', err.message);
        throw err;
      }
    }

    // Mock Fallback Mode
    await delay(300);
    const user = mockStorage.users.find(
      (u) =>
        u.username.toLowerCase() === resolvedUsername ||
        u.username.toLowerCase() === rawUsername
    );

    if (user) {
      if (user.passwordHash && user.passwordHash !== inputHash) {
        throw new Error('Invalid username or password');
      }

      const token = `mock-jwt-token-${user.role.toLowerCase()}-${Date.now()}`;
      return {
        token,
        user,
        expiresIn: 86400,
      };
    }

    throw new Error('Invalid username or password');
  },

  async getCurrentUser(): Promise<User | null> {
    const savedUser = localStorage.getItem('smart_erp_user');
    return savedUser ? JSON.parse(savedUser) : null;
  },

  async signInWithGoogle(): Promise<{ error: any }> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured yet. Please check your .env credentials.');
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    return { error };
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
