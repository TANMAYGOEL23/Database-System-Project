import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User, AuthContextType, LoginResponse } from '../types/auth';
import { authService } from '../services/authService';
import { isSupabaseConfigured, supabase } from '../services/supabase';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Every reload validates the Google session and reloads the database role.
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearUser = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('smart_erp_token');
    localStorage.removeItem('smart_erp_user');
  }, []);

  const saveSession = useCallback((res: LoginResponse) => {
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('smart_erp_token', res.token);
    localStorage.setItem('smart_erp_user', JSON.stringify(res.user));
  }, []);

  useEffect(() => {
    clearUser();
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }
    let active = true;
    let revision = 0;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentRevision = ++revision;
      if (!session) {
        clearUser();
        setIsLoading(false);
        return;
      }
      // The callback page completes PKCE login itself. Supabase methods must run
      // outside this listener so they do not contend with its session lock.
      if (window.location.pathname === '/auth/callback') return;
      setIsLoading(true);
      const timer = setTimeout(() => {
        timers.delete(timer);
        authService.completeOAuthLogin()
          .then((res) => { if (active && currentRevision === revision) saveSession(res); })
          .catch(() => { if (active && currentRevision === revision) clearUser(); })
          .finally(() => { if (active && currentRevision === revision) setIsLoading(false); });
      }, 0);
      timers.add(timer);
    });
    return () => {
      active = false;
      timers.forEach(clearTimeout);
      subscription.unsubscribe();
    };
  }, [clearUser, saveSession]);

  const loginWithGoogle = useCallback(() => authService.signInWithGoogle(), []);

  const completeOAuthLogin = useCallback(async (): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await authService.completeOAuthLogin();
      saveSession(res);
      return res.user;
    } catch (error) {
      clearUser();
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [clearUser, saveSession]);

  const logout = useCallback(() => {
    clearUser();
    void authService.logout().catch(console.error);
  }, [clearUser]);

  return (
    <AuthContext.Provider value={{
      user, token, isAuthenticated: !!user && !!token, isLoading,
      loginWithGoogle, completeOAuthLogin, logout,
      isAdmin: user?.role === 'ADMIN', isEmployee: user?.role === 'EMPLOYEE',
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
