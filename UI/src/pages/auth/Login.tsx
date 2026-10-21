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
import { testSupabaseConnection, getSupabaseConfig } from '../../services/supabase';

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

  const { login, loginWithGoogle } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const checkConnection = async () => {
    setSupabaseStatus((prev) => ({ ...prev, loading: true }));
    const result = await testSupabaseConnection();
    setSupabaseStatus({
      loading: false,
      connected: result.connected,
      message: result.message,
      projectId: result.projectId,
      usersCount: result.usersCount,
    });
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast('error', 'Validation Error', 'Please enter username and password');
      return;
    }

    try {
      setIsSubmitting(true);
      const success = await login({ username, password });
      if (success) {
        showToast('success', 'Security Authorized', `Logged in as ${username.toUpperCase()}`);
        navigate(from, { replace: true });
      } else {
        showToast('error', 'Authentication Failed', 'Invalid credentials or user not active');
      }
    } catch (err: any) {
      showToast('error', 'Login Error', err.message || 'Server connection error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      await loginWithGoogle();
    } catch (err: any) {
      showToast(
        'error',
        'Google Auth Notice',
        err.message || 'Please enable Google provider in your Supabase Dashboard.'
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleDemoSelect = (userType: 'tanmay' | 'rohit' | 'ashish') => {
    if (userType === 'tanmay') {
      setUsername('tanmay');
      setPassword('Tanmay@2026');
    } else if (userType === 'rohit') {
      setUsername('rohit');
      setPassword('Rohit@2026');
    } else {
      setUsername('ashish');
      setPassword('Ashish@2026');
    }
  };

  const config = getSupabaseConfig();

  return (
    <div className="min-h-screen w-screen bg-[#faf8f5] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background industrial circuit grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e8e4dc_1px,transparent_1px),linear-gradient(to_bottom,#e8e4dc_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-60" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/20 ring-1 ring-blue-500/30">
            <Factory className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Smart Industrial <span className="text-blue-600">ERP</span>
          </h1>
          <p className="text-xs text-slate-400">
            PostgreSQL & Supabase Connected Enterprise Management System
          </p>
        </div>

        {/* Live Supabase Connection Status Card */}
        <div
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-mono transition-all ${
            supabaseStatus.loading
              ? 'bg-white border-slate-800 text-slate-400 shadow-xs'
              : supabaseStatus.connected
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-xs'
              : 'bg-amber-50 border-amber-200 text-amber-800 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            {supabaseStatus.loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
            ) : supabaseStatus.connected ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            )}
            <span className="truncate">
              {supabaseStatus.loading
                ? 'Testing Supabase connection...'
                : supabaseStatus.connected
                ? `Supabase: Connected (${supabaseStatus.projectId || 'Live'})`
                : `Supabase: Disconnected (${supabaseStatus.message})`}
            </span>
          </div>

          <button
            type="button"
            onClick={checkConnection}
            title="Refresh connection status"
            className="p-1 rounded hover:bg-slate-800/40 text-slate-400 hover:text-slate-100 transition-colors shrink-0 ml-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${supabaseStatus.loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Login Form Container */}
        <div className="bg-white border border-slate-800 rounded-2xl p-6 shadow-xl shadow-stone-200/50 space-y-5">
          {/* Google OAuth Login Button */}
          <div>
            <Button
              variant="outline"
              size="lg"
              type="button"
              onClick={handleGoogleLogin}
              isLoading={isGoogleLoading}
              className="w-full flex items-center justify-center font-semibold border-slate-800 bg-white hover:bg-slate-950 text-slate-100 shadow-xs"
            >
              <GoogleIcon />
              Continue with Google
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-400 font-mono">
                  or sign in with password
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. tanmay, rohit, or ashish"
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <Input
              label="Password (SHA-256 Encrypted)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button
              variant="primary"
              size="lg"
              type="submit"
              className="w-full mt-2"
              isLoading={isSubmitting}
            >
              Sign In to Industrial Workspace
            </Button>
          </form>

          {/* 1-Click User Switcher Presets */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider">
                1-Click Fast Login
              </p>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                SHA-256 Secured
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoSelect('tanmay')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  username === 'tanmay' || username === 'admin'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-850'
                }`}
              >
                <Shield className="w-4 h-4 text-blue-600 mb-1" />
                <span className="font-bold text-slate-100 text-[11px]">Tanmay Goel</span>
                <span className="text-[10px] text-blue-600 font-mono">Owner / Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('rohit')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  username === 'rohit' || username === 'operator'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-850'
                }`}
              >
                <HardHat className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="font-bold text-slate-100 text-[11px]">Rohit C.</span>
                <span className="text-[10px] text-emerald-600 font-mono">Operator 1</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('ashish')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  username === 'ashish'
                    ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-xs'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-850'
                }`}
              >
                <Cpu className="w-4 h-4 text-purple-600 mb-1" />
                <span className="font-bold text-slate-100 text-[11px]">Ashish</span>
                <span className="text-[10px] text-purple-600 font-mono">Operator 2</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Database Notice */}
        <div className="text-center space-y-1">
          <p className="text-[11px] text-slate-500 font-mono flex items-center justify-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            Project: <strong className="text-slate-400">{config.projectId || 'khypyudvethxwhshrwjl'}</strong> • Supabase PostgreSQL
          </p>
        </div>
      </div>
    </div>
  );
};
