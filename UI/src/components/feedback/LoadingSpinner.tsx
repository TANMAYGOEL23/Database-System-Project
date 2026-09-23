import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading data...',
  size = 'md',
  className,
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 space-y-3', className)}>
      <Loader2 className={cn('animate-spin text-blue-500', sizes[size])} />
      {message && <p className="text-xs font-mono text-slate-400 animate-pulse">{message}</p>}
    </div>
  );
};
