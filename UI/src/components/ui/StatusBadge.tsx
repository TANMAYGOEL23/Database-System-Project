import React from 'react';
import { getStatusBadgeClass } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface StatusBadgeProps {
  status: string;
  className?: string;
  dot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, dot = true }) => {
  const badgeClass = getStatusBadgeClass(status);
  const formattedText = status.replace(/_/g, ' ');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border',
        badgeClass,
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full animate-pulse',
            status.toUpperCase().includes('ACTIVE') || status.toUpperCase().includes('ONLINE') || status.toUpperCase().includes('RUNNING')
              ? 'bg-emerald-400'
              : status.toUpperCase().includes('IN_PROGRESS') || status.toUpperCase().includes('BUSY')
              ? 'bg-blue-400'
              : status.toUpperCase().includes('WARNING') || status.toUpperCase().includes('LOW') || status.toUpperCase().includes('PENDING')
              ? 'bg-amber-400'
              : status.toUpperCase().includes('CRITICAL') || status.toUpperCase().includes('ERROR') || status.toUpperCase().includes('OUT')
              ? 'bg-rose-400'
              : 'bg-slate-400'
          )}
        />
      )}
      {formattedText}
    </span>
  );
};
