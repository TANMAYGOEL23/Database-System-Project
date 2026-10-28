import { supabase, isSupabaseConfigured } from './supabase';
import { User, LoginResponse } from '../types/auth';

// Helper for demo/mock delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock database storage fallback for offline/local development
const mockStorage = {
  users: [
    {
      id: 'usr_admin_01',
      username: 'tanmay',
      email: 'tanmay.goel@megafactory.internal',
      fullName: 'Tanmay Goel',
      role: 'ADMIN',
      departmentName: 'Executive Operations',
      position: 'Owner & Chief Executive Officer',
      passwordHash: 'Tanmay@2026',
    },
    {
      id: 'usr_hr_01',
      username: 'hr_manager',
      email: 'hr@megafactory.internal',
      fullName: 'Priya Sharma',
      role: 'HR_MANAGER',
      departmentName: 'Human Resources',
      position: 'HR Director',
      passwordHash: 'Password123!',
    },
    {
      id: 'usr_op_01',
      username: 'operator1',
      email: 'operator1@megafactory.internal',
      fullName: 'Rahul Kumar',
      role: 'OPERATOR',
      departmentName: 'Production Line A',
      position: 'Machine Operator',
      passwordHash: 'Password123!',
    },
  ],
};

const ADMIN_IDENTIFIERS = [
  'prishaajit@gmail.com',
  'tanmay.goel@megafactory.internal',
  'tanmay',
  'prisha',
  'prishaajit',
  'admin',
];

const isUserAdmin = (email?: string | null, username?: string | null): boolean => {
  const normEmail = (email || '').toLowerCase().trim();
  const normUser = (username || '').toLowerCase().trim();
  return (
    ADMIN_IDENTIFIERS.includes(normEmail) ||
    ADMIN_IDENTIFIERS.includes(normUser) ||
    normEmail.includes('tanmay') ||
    normEmail.includes('admin') ||
    normEmail.includes('prisha')
  );
};

export const authService = {
  async signInWithGoogle(): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Google sign-in is unavailable. Supabase is not configured.');
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard',
      },
    });
    if (error) throw error;
  },

  async login(emailOrUsername: string, pass: string): Promise<LoginResponse> {
    const rawUsername = emailOrUsername.trim().toLowerCase();
    const resolvedUsername = rawUsername === 'admin' ? 'tanmay' : rawUsername;

    // 1. Try Supabase Authentication if Configured
    if (isSupabaseConfigured()) {
      try {
        let authEmail = resolvedUsername;
        if (!authEmail.includes('@')) {
          if (resolvedUsername === 'tanmay') {
            authEmail = 'tanmay.goel@megafactory.internal';
          } else if (resolvedUsername === 'hr_manager') {
            authEmail = 'hr@megafactory.internal';
          } else if (resolvedUsername === 'operator1') {
            authEmail = 'operator1@megafactory.internal';
          } else {
            authEmail = `${resolvedUsername}@megafactory.internal`;
          }
        }

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: pass,
        });

        if (!authError && authData.user) {
          const userEmail = authData.user.email || authEmail;
          const isAdmin = isUserAdmin(userEmail, resolvedUsername);

          // Fetch user profile from database table if it exists
          let dbUser: any = null;
          try {
            const { data } = await supabase
              .from('users')
              .select('*')
              .ilike('email', userEmail)
              .maybeSingle();
            dbUser = data;
          } catch {
            // Ignore table fetch issues and fallback to metadata
          }

          const user: User = {
            id: dbUser?.id || authData.user.id,
            username: dbUser?.username || resolvedUsername,
            status: dbUser?.status || 'ACTIVE',
            fullName: dbUser?.full_name || authData.user.user_metadata?.full_name || 'Tanmay Goel',
            email: userEmail,
            departmentName: dbUser?.department_name || (isAdmin ? 'Executive Operations' : 'General'),
            position: dbUser?.position || (isAdmin ? 'Owner & Chief Executive Officer' : 'Staff'),
            role: isAdmin ? 'ADMIN' : (dbUser?.role || 'EMPLOYEE'),
            avatarUrl: dbUser?.avatar_url || authData.user.user_metadata?.avatar_url,
          };

          const token = `sb-jwt-${user.id}-${Date.now()}`;
          return {
            token,
            user,
            expiresIn: 86400,
          };
        }
      } catch (err: any) {
        console.warn('Supabase auth check:', err.message);
      }
    }

    // 2. Mock Fallback Mode
    await delay(300);
    const foundUser = mockStorage.users.find(
      (u) =>
        u.username.toLowerCase() === resolvedUsername ||
        u.email.toLowerCase() === resolvedUsername
    );

    if (foundUser) {
      if (foundUser.passwordHash && foundUser.passwordHash !== pass) {
        throw new Error('Invalid username or password');
      }

      const isAdmin = isUserAdmin(foundUser.email, foundUser.username);
      const user: User = {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
        fullName: foundUser.fullName,
        role: isAdmin ? 'ADMIN' : (foundUser.role as any),
        departmentName: foundUser.departmentName,
        position: foundUser.position,
        status: 'ACTIVE',
      };

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
};