import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Factory, Lock, User, Shield, HardHat, Cpu, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

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
      // Browser will redirect to Google; keep spinner until navigation happens
    } catch (err: any) {
      showToast('error', 'Google Sign-In Unavailable', err.message || 'Could not start Google sign-in');
      setIsGoogleLoading(false);
    }
  };

  const handleDemoSelect = (role: 'admin' | 'operator') => {
    if (role === 'admin') {
      setUsername('admin');
      setPassword('password123');
    } else {
      setUsername('operator');
      setPassword('password123');
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background industrial circuit grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/25 ring-1 ring-blue-400/30">
            <Factory className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Smart Industrial <span className="text-blue-400">ERP</span>
          </h1>
          <p className="text-xs text-slate-400">
            PostgreSQL & Supabase Connected University Database Management System
          </p>
        </div>

        {/* Login Form Container */}
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl p-6 shadow-2xl shadow-black/50 space-y-5">
          {/* Google OAuth */}
          <button
            id="google-signin-button"
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isSubmitting}
            className="group w-full flex items-center justify-center gap-3 h-11 rounded-xl bg-white text-slate-800 text-sm font-semibold shadow-lg shadow-black/30 ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:shadow-blue-500/20 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
              </svg>
            )}
            <span>{isGoogleLoading ? 'Redirecting to Google…' : 'Continue with Google'}</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              or use operator credentials
            </span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Operator Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin or operator"
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <Input
              label="Security Access Key / Password"
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

          {/* 1-Click Role Switcher Demo Presets */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <p className="text-[11px] text-center font-mono font-medium text-slate-400 uppercase tracking-wider">
              1-Click Demo Security Roles
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleDemoSelect('admin')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  username === 'admin'
                    ? 'bg-blue-600/20 border-blue-500/60 text-blue-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Shield className="w-4 h-4 text-blue-400" />
                <span>ADMIN (Full ERP)</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('operator')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  username === 'operator'
                    ? 'bg-emerald-600/20 border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <HardHat className="w-4 h-4 text-emerald-400" />
                <span>EMPLOYEE (Floor)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Database Notice */}
        <div className="text-center space-y-1">
          <p className="text-[11px] text-slate-500 font-mono flex items-center justify-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            PostgreSQL Relational Schema v2.4 • Supabase Ready
          </p>
        </div>
      </div>
    </div>
  );
};
