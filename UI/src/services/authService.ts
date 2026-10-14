import { delay } from './api';
import { supabase, isSupabaseConfigured } from './supabase';
import { mockStorage } from './mockStorage';
import { LoginRequest, LoginResponse, User } from '../types/auth';

const mapDbUser = (data: any, fallbackAvatar?: string): User => ({
  userId: data.user_id || data.userId,
  employeeId: data.employee_id || data.employeeId,
  username: data.username,
  role: data.role,
  status: data.status,
  fullName: data.full_name || data.fullName,
  email: data.email,
  departmentName: data.department_name || data.departmentName,
  position: data.position,
  avatarUrl: data.avatar_url || data.avatarUrl || fallbackAvatar,
});

export const authService = {
  /**
   * Redirects the browser to Google's consent screen via Supabase Auth.
   * After consent, Google redirects back to /auth/callback.
   */
  async signInWithGoogle(): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error(
        'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in UI/.env'
      );
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (error) throw error;
  },

  /**
   * Called on the OAuth callback page. Reads the Supabase session created from
   * the Google login and maps the Google email to an ERP user record.
   */
  async completeOAuthLogin(): Promise<LoginResponse> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured');
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    const session = sessionData.session;
    if (!session?.user?.email) {
      throw new Error('Google sign-in did not return a valid session');
    }

    const email = session.user.email.trim();
    const meta = session.user.user_metadata || {};
    const googleAvatar: string | undefined = meta.avatar_url || meta.picture;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('email', email)
      .maybeSingle();

    if (error || !data) {
      await supabase.auth.signOut();
      throw new Error(`No ERP account is linked to ${email}. Contact your administrator.`);
    }

    if (data.status && data.status !== 'ACTIVE') {
      await supabase.auth.signOut();
      throw new Error(`Account ${email} is ${String(data.status).toLowerCase()}.`);
    }

    return {
      token: session.access_token,
      user: mapDbUser(data, googleAvatar),
      expiresIn: session.expires_in ?? 3600,
    };
  },

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

        const user: User = mapDbUser(data);

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
