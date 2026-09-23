import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-4 shadow-2xl">
        <div className="inline-flex p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <HelpCircle className="w-12 h-12" />
        </div>
        <h2 className="text-xl font-bold text-white">404 — System Node Not Found</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          The requested route does not correspond to an active plant ERP entity.
        </p>
        <div className="pt-2">
          <Button
            variant="primary"
            onClick={() => navigate('/dashboard')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Safe Operations
          </Button>
        </div>
      </div>
    </div>
  );
};
