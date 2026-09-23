import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

export interface ErrorMessageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Failed to load data',
  message = 'An error occurred while communicating with the database backend.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 space-y-3 rounded-2xl border border-rose-900/40 bg-rose-950/20">
      <div className="p-3 rounded-xl bg-rose-900/30 text-rose-400">
        <AlertOctagon className="w-8 h-8" />
      </div>
      <div className="space-y-0.5 max-w-sm">
        <h4 className="text-sm font-semibold text-rose-200">{title}</h4>
        <p className="text-xs text-rose-300/80">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          className="border-rose-800/60 text-rose-200 hover:bg-rose-900/40"
        >
          Retry Request
        </Button>
      )}
    </div>
  );
};
