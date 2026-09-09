import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'System Operation Error',
  message,
  onRetry,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-start gap-4 p-5 rounded-xl border border-rose-600/30 bg-rose-950/30 text-rose-100 shadow-lg">
      <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 flex-shrink-0">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold tracking-wide text-rose-200">{title}</h4>
        <p className="text-xs text-rose-300 mt-1 leading-relaxed">{message}</p>
        {onRetry && (
          <div className="mt-3">
            <Button
              variant="danger"
              size="sm"
              onClick={onRetry}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Retry Action
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
