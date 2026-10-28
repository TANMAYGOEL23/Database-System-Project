import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  Factory,
  Lock,
  User,
  Shield,
  HardHat,
  Cpu,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { testSupabaseConnection, getSupabaseConfig, isSupabaseConfigured, supabase } from '../../services/supabase';

const GoogleIcon: React.FC = () => (
  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const Login: React.FC = () => {
  const [username, setUsername] = useState('tanmay');
  const [password, setPassword] = useState('Tanmay@2026');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [supabaseStatus, setSupabaseStatus] = useState<{
    loading: boolean;
    connected: boolean;
    message: string;
    projectId?: string;
    usersCount?: number;
  }>({
    loading: true,
    connected: false,
    message: 'Testing connection...',
  });

  const { login } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const checkConnection = async () => {
    setSupabaseStatus({ loading: true, connected: false, message: 'Testing Supabase connection...' });
    try {
      const res = await testSupabaseConnection();
      const cfg = getSupabaseConfig();
      setSupabaseStatus({
        loading: false,
        connected: res.success,
        message: res.message,
        projectId: cfg.projectId || undefined,
        usersCount: res.usersCount,
      });
    } catch (err: any) {
      setSupabaseStatus({
        loading: false,
        connected: false,
        message: err.message || 'Connection check failed',
      });
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showNotification('Please enter both username/email and password', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(username.trim(), password);
      if (result.success) {
        showNotification(result.message || 'Login successful!', 'success');
        navigate(from, { replace: true });
      } else {
        showNotification(result.message || 'Invalid credentials', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'An error occurred during login', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured()) {
      showNotification('Supabase is not configured. Google sign-in is unavailable.', 'error');
      return;
    }

    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard',
        },
      });
      if (error) throw error;
    } catch (err: any) {
      showNotification(err.message || 'Google authentication failed', 'error');
      setIsGoogleLoading(false);
    }
  };

  const fillDemoAccount = (userType: 'admin' | 'hr' | 'operator') => {
    if (userType === 'admin') {
      setUsername('tanmay');
      setPassword('Tanmay@2026');
    } else if (userType === 'hr') {
      setUsername('hr_manager');
      setPassword('Password123!');
    } else {
      setUsername('operator1');
      setPassword('Password123!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20 border border-blue-400/30">
            <Factory className="w-8 h-8 text-white animate-pulse" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
          Smart ERP & Factory
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Database Systems & Industrial Management Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/80 backdrop-xl py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-slate-800 shadow-black/50">
          
          {/* Supabase Connection Status Banner */}
          <div className="mb-6 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {supabaseStatus.loading ? (
                <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
              ) : supabaseStatus.connected ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
              <span className="text-slate-300 font-medium">
                {supabaseStatus.loading
                  ? 'Connecting to Supabase...'
                  : supabaseStatus.connected
                  ? `Connected ${supabaseStatus.projectId ? `(${supabaseStatus.projectId})` : ''}`
                  : 'Database Offline / Local Mode'}
              </span>
            </div>
            <button
              onClick={checkConnection}
              title="Refresh Connection"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <Input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 bg-slate-950/60 border-slate-800 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter username or email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-slate-950/60 border-slate-800 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-2.5 rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-200"
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In'}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500 font-semibold tracking-wider">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                variant="outline"
                className="w-full bg-slate-950/40 border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white py-2.5 rounded-xl transition-all flex items-center justify-center font-medium"
              >
                <GoogleIcon />
                {isGoogleLoading ? 'Connecting...' : 'Sign in with Google'}
              </Button>
            </div>
          </div>

          {/* Quick Demo Credentials Selector */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <p className="text-xs font-medium text-slate-400 mb-3 text-center">
              Quick Demo Access:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('admin')}
                className="px-2 py-1.5 text-xs bg-slate-800/80 hover:bg-blue-600/20 hover:border-blue-500/50 border border-slate-700/60 rounded-lg text-slate-300 hover:text-white transition-all flex flex-col items-center gap-1"
              >
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('hr')}
                className="px-2 py-1.5 text-xs bg-slate-800/80 hover:bg-emerald-600/20 hover:border-emerald-500/50 border border-slate-700/60 rounded-lg text-slate-300 hover:text-white transition-all flex flex-col items-center gap-1"
              >
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>HR Manager</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('operator')}
                className="px-2 py-1.5 text-xs bg-slate-800/80 hover:bg-amber-600/20 hover:border-amber-500/50 border border-slate-700/60 rounded-lg text-slate-300 hover:text-white transition-all flex flex-col items-center gap-1"
              >
                <HardHat className="w-3.5 h-3.5 text-amber-400" />
                <span>Operator</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};