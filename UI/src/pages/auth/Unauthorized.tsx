import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-4 shadow-2xl">
        <div className="inline-flex p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h2 className="text-xl font-bold text-white">403 — Restricted Industrial Area</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Your current operator security credentials do not grant access to this plant system.
        </p>
        <div className="pt-2">
          <Button
            variant="primary"
            onClick={() => navigate('/dashboard')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Return to Workstation
          </Button>
        </div>
      </div>
    </div>
  );
};
