import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User, AuthContextType, LoginResponse } from '../types/auth';
import { authService } from '../services/authService';
import { isSupabaseConfigured, supabase } from '../services/supabase';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_IDENTIFIERS = [
  'prishaajit@gmail.com',
  'tanmay.goel@megafactory.internal',
  'tanmay',
  'prisha',
  'prishaajit',
  'admin',
];

export const isUserAdmin = (email?: string | null, username?: string | null): boolean => {
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('smart_erp_user');
    if (!saved) return null;
    try {
      const parsed: User = JSON.parse(saved);
      if (parsed && isUserAdmin(parsed.email, parsed.username)) {
        parsed.role = 'ADMIN';
        parsed.departmentName = parsed.departmentName || 'Executive Operations';
        parsed.position = parsed.position || 'Owner & Chief Executive Officer';
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('smart_erp_token'));
  const [isLoading, setIsLoading] = useState(false);

  // Sync Supabase OAuth session changes (e.g. Google Sign-In redirect)
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const syncSession = async (session: any) => {
      if (!session?.user) return;
      try {
        const email = session.user.email || '';
        const fullName =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          email.split('@')[0];
        const avatarUrl = session.user.user_metadata?.avatar_url || '';
        const isAdmin = isUserAdmin(email, session.user.user_metadata?.user_name);

        // Query existing user in database
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .ilike('email', email)
          .maybeSingle();

        let appUser: User;
        if (dbUser) {
          appUser = {
            id: dbUser.id,
            email: dbUser.email,
            username: dbUser.username || fullName,
            fullName: dbUser.full_name || fullName,
            role: isAdmin ? 'ADMIN' : (dbUser.role || 'EMPLOYEE'),
            departmentName: dbUser.department_name || (isAdmin ? 'Executive Operations' : 'General'),
            position: dbUser.position || (isAdmin ? 'Owner & Chief Executive Officer' : 'Staff'),
            avatarUrl: dbUser.avatar_url || avatarUrl,
          };
        } else {
          appUser = {
            id: session.user.id,
            email: email,
            username: session.user.user_metadata?.user_name || fullName,
            fullName: fullName,
            role: isAdmin ? 'ADMIN' : 'EMPLOYEE',
            departmentName: isAdmin ? 'Executive Operations' : 'General',
            position: isAdmin ? 'Owner & Chief Executive Officer' : 'Staff',
            avatarUrl: avatarUrl,
          };
        }

        setUser(appUser);
        setToken(session.access_token);
        localStorage.setItem('smart_erp_user', JSON.stringify(appUser));
        localStorage.setItem('smart_erp_token', session.access_token);
      } catch (err) {
        console.error('Error syncing Supabase session:', err);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) syncSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        syncSession(session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (emailOrUsername: string, pass: string): Promise<LoginResponse> => {
    setIsLoading(true);
    try {
      const res = await authService.login(emailOrUsername, pass);
      if (res.success && res.user && res.token) {
        let loggedUser = res.user;
        if (isUserAdmin(loggedUser.email, loggedUser.username)) {
          loggedUser.role = 'ADMIN';
          loggedUser.departmentName = loggedUser.departmentName || 'Executive Operations';
          loggedUser.position = loggedUser.position || 'Owner & Chief Executive Officer';
        }
        setUser(loggedUser);
        setToken(res.token);
        localStorage.setItem('smart_erp_user', JSON.stringify(loggedUser));
        localStorage.setItem('smart_erp_token', res.token);
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('smart_erp_user');
    localStorage.removeItem('smart_erp_token');
    if (isSupabaseConfigured()) {
      supabase.auth.signOut().catch(() => {});
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};