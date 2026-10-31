import { supabase, isSupabaseConfigured } from './supabase';
import { LoginResponse, User } from '../types/auth';

export const authService = {
  async signInWithGoogle(): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Google sign-in is unavailable. Contact your administrator.');
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) throw error;
  },

  async completeOAuthLogin(authCode?: string | null): Promise<LoginResponse> {
    if (!isSupabaseConfigured()) {
      throw new Error('Google sign-in is unavailable. Contact your administrator.');
    }

    let session: any = null;

    // 1. If an auth code is present, attempt code exchange for session (PKCE)
    if (authCode && typeof (supabase.auth as any).exchangeCodeForSession === 'function') {
      try {
        const { data: exchangeData, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(authCode);
        if (!exchangeError && exchangeData?.session) {
          session = exchangeData.session;
        } else if (exchangeError) {
          // If already exchanged by auto-detection or another listener, check getSession
          const { data: fallbackData } = await supabase.auth.getSession();
          if (fallbackData?.session) {
            session = fallbackData.session;
          } else {
            throw new Error(exchangeError.message || 'Unable to exchange authorization code for session');
          }
        }
      } catch (err: any) {
        // Fallback to getSession before failing
        const { data: fallbackData } = await supabase.auth.getSession();
        if (fallbackData?.session) {
          session = fallbackData.session;
        } else {
          throw err;
        }
      }
    }

    // 2. If no session yet, retrieve active session from Supabase
    if (!session) {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      session = sessionData?.session;
    }

    if (!session) {
      throw new Error('Google sign-in did not return a valid session');
    }

    // 3. Validate the identity with Supabase rather than trusting cached user data.
    const { data: identity, error: identityError } = await supabase.auth.getUser();
    if (identityError) throw identityError;
    const googleUser = identity.user;
    const isGoogle =
      googleUser?.app_metadata?.provider === 'google' ||
      googleUser?.identities?.some((item: any) => item.provider === 'google');

    if (!googleUser?.email || !googleUser.email_confirmed_at || !isGoogle) {
      await authService.logout();
      throw new Error('Sign in with a verified Google account.');
    }

    const email = googleUser.email.trim().toLowerCase();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    if (error) throw new Error('Unable to load your ERP account. Please try again.');
    if (!data) {
      await authService.logout();
      throw new Error(`No ERP account is linked to ${email}. Contact your administrator.`);
    }
    if (data.status !== 'ACTIVE' || !['ADMIN', 'EMPLOYEE'].includes(data.role)) {
      await authService.logout();
      throw new Error('Your ERP account does not have active workspace access. Contact your administrator.');
    }

    const meta = googleUser.user_metadata || {};
    const user: User = {
      userId: String(data.user_id),
      employeeId: String(data.employee_id || ''),
      username: data.username,
      role: data.role,
      status: data.status,
      fullName: data.full_name,
      email: data.email,
      departmentName: data.department_name,
      position: data.position,
      avatarUrl: data.avatar_url || meta.avatar_url || meta.picture,
    };
    return { token: session.access_token, user, expiresIn: session.expires_in ?? 3600 };
  },

  async logout(): Promise<void> {
    localStorage.removeItem('smart_erp_token');
    localStorage.removeItem('smart_erp_user');
    if (isSupabaseConfigured()) await supabase.auth.signOut({ scope: 'local' });
  },
};
