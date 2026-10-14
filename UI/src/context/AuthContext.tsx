import React, { createContext, useContext, useState } from 'react';
import { User, LoginRequest, AuthContextType } from '../types/auth';
import { authService } from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('smart_erp_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('smart_erp_token'));
  const [isLoading, setIsLoading] = useState(false);

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
    // Redirects away from the app; the session is completed on /auth/callback
    await authService.signInWithGoogle();
  };

  const completeOAuthLogin = async (): Promise<User> => {
    try {
      setIsLoading(true);
      const res = await authService.completeOAuthLogin();
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('smart_erp_token', res.token);
      localStorage.setItem('smart_erp_user', JSON.stringify(res.user));
      return res.user;
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

  const isAdmin = user?.role === 'ADMIN';
  const isEmployee = user?.role === 'EMPLOYEE';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        loginWithGoogle,
        completeOAuthLogin,
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
