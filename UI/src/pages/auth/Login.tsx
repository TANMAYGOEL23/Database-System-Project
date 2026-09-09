import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Factory, Shield, User, Lock, AlertCircle, ArrowRight, CheckCircle2, Cpu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const isExpired = searchParams.get('expired') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }

    try {
      setIsLoading(true);
      await login({ username, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid username or password credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (userType: 'admin' | 'employee') => {
    setError(null);
    const targetUser = userType === 'admin' ? 'admin' : 'operator';
    setUsername(targetUser);
    setPassword('password123');

    try {
      setIsLoading(true);
      await login({ username: targetUser, password: 'password123' });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 industrial-grid-bg relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Factory Brand Header */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-xl shadow-blue-600/30 ring-1 ring-blue-400/40">
            <Factory className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          SMART INDUSTRIAL ERP
        </h2>
        <p className="mt-1 text-center text-xs font-mono uppercase tracking-widest text-blue-400">
          Relational Database & Factory Automation Suite
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/90 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 backdrop-blur-xl">
          {isExpired && (
            <div className="mb-4 p-3 rounded-lg bg-amber-950/50 border border-amber-600/50 text-amber-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Your session token has expired. Please sign in again.</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3.5 rounded-lg bg-rose-950/60 border border-rose-600/50 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin or operator"
              leftIcon={<User className="w-4 h-4 text-slate-400" />}
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              required
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500"
                />
                Remember workstation
              </label>
              <span className="text-slate-500 font-mono text-[11px]">JWT Auth Ready</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to ERP Portal
            </Button>
          </form>

          {/* Quick Demo Role Switchers */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
              One-Click Role Demonstration
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="flex flex-col items-center p-3 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 hover:border-blue-500/50 transition-all text-left group"
              >
                <Shield className="w-5 h-5 text-amber-400 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-200">Admin Mode</span>
                <span className="text-[10px] text-slate-400">Full ERP Access</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('employee')}
                className="flex flex-col items-center p-3 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 hover:border-blue-500/50 transition-all text-left group"
              >
                <Cpu className="w-5 h-5 text-blue-400 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-200">Employee Mode</span>
                <span className="text-[10px] text-slate-400">Restricted Tasks</span>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center">
            <p className="text-[11px] text-slate-400 font-mono">
              Database Systems Project • Spring Boot & PostgreSQL
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
