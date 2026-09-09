import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-600/40 text-rose-400 mb-6">
        <ShieldAlert className="w-12 h-12" />
      </div>
      <h1 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
        403 - Administrative Access Required
      </h1>
      <p className="mt-2 text-sm text-slate-400 max-w-md leading-relaxed">
        Your current active account role is <strong className="text-blue-400 font-mono">{user?.role}</strong>. This module or administrative operation is restricted to <strong className="text-amber-400 font-mono">ADMIN</strong> users according to the ERP Role-Based Access Control matrix.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="secondary"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Go Back
        </Button>
        <Button
          variant="primary"
          onClick={() => navigate('/dashboard')}
          leftIcon={<LayoutDashboard className="w-4 h-4" />}
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};
