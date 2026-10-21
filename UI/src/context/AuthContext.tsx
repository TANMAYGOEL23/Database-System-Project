import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginRequest, AuthContextType } from '../types/auth';
import { authService } from '../services/authService';
import { supabase, isSupabaseConfigured } from '../services/supabase';

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
          const role = (isAdmin || dbUser.role === 'ADMIN') ? 'ADMIN' : (dbUser.role || 'EMPLOYEE');
          appUser = {
            userId: dbUser.user_id || dbUser.userId,
            employeeId: dbUser.employee_id || dbUser.employeeId || 'EMP-OAUTH',
            username: dbUser.username,
            role,
            status: dbUser.status || 'ACTIVE',
            fullName: dbUser.full_name || fullName,
            email: dbUser.email,
            departmentName: isAdmin ? 'Executive Operations' : (dbUser.department_name || 'Executive Operations'),
            position: isAdmin ? 'Owner & Chief Executive Officer' : (dbUser.position || 'Operations Specialist'),
            avatarUrl: dbUser.avatar_url || avatarUrl,
          };

          // If designated Admin was stored as EMPLOYEE, update in Supabase
          if (isAdmin && dbUser.role !== 'ADMIN') {
            await supabase
              .from('users')
              .update({
                role: 'ADMIN',
                department_name: 'Executive Operations',
                position: 'Owner & Chief Executive Officer'
              })
              .ilike('email', email);
          }
        } else {
          // Provision user profile in users table
          const newUserId = `USR-${Math.floor(100 + Math.random() * 900)}`;
          const newEmployeeId = `EMP-${Math.floor(100 + Math.random() * 900)}`;
          const username =
            email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() ||
            `user_${Date.now()}`;

          const newUserRecord = {
            user_id: newUserId,
            employee_id: newEmployeeId,
            username,
            role: isAdmin ? 'ADMIN' : 'EMPLOYEE',
            status: 'ACTIVE',
            full_name: fullName,
            email,
            department_name: isAdmin ? 'Executive Operations' : 'Shop Floor Operations',
            position: isAdmin ? 'Owner & Chief Executive Officer' : 'Plant Technician',
            avatar_url: avatarUrl,
          };

          await supabase.from('users').upsert([newUserRecord], { onConflict: 'email' });

          appUser = {
            userId: newUserId,
            employeeId: newEmployeeId,
            username,
            role: isAdmin ? 'ADMIN' : 'EMPLOYEE',
            status: 'ACTIVE',
            fullName,
            email,
            departmentName: newUserRecord.department_name,
            position: newUserRecord.position,
            avatarUrl,
          };
        }

        setUser(appUser);
        setToken(session.access_token);
        localStorage.setItem('smart_erp_token', session.access_token);
        localStorage.setItem('smart_erp_user', JSON.stringify(appUser));
      } catch (err) {
        console.error('Error syncing Supabase user profile:', err);
      }
    };

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        syncSession(session);
      }
    });

    // Listen to OAuth sign-ins & token changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        syncSession(session);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginRequest): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await authService.login(credentials);
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('smart_erp_token', res.token);
      localStorage.setItem('smart_erp_user', JSON.stringify(res.user));
      return true;
    } catch (err) {
      console.error('Login error', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const { error } = await authService.signInWithGoogle();
      if (error) {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    localStorage.removeItem('smart_erp_token');
    localStorage.removeItem('smart_erp_user');
  };

  const isAdmin = user?.role === 'ADMIN' || isUserAdmin(user?.email, user?.username);
  const isEmployee = user?.role === 'EMPLOYEE' && !isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        loginWithGoogle,
        logout,
        isAdmin,
        isEmployee,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
