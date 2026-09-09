import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 mb-6">
        <FileQuestion className="w-12 h-12" />
      </div>
      <h1 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
        404 - Module or Record Not Found
      </h1>
      <p className="mt-2 text-sm text-slate-400 max-w-md leading-relaxed">
        The requested ERP system endpoint or route does not exist in the navigation schema.
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
