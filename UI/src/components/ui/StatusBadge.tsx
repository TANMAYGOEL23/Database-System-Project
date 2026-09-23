import React from 'react';
import { cn } from '../../utils/cn';
import { getStatusBadgeClass } from '../../utils/formatters';

export interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, size = 'sm' }) => {
  const badgeClass = getStatusBadgeClass(status);
  const formattedText = status.replace(/_/g, ' ');

  return (
    <span
      className={cn(
        'inline-flex items-center font-mono font-medium rounded-full border tracking-wide uppercase',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
        badgeClass,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {formattedText}
    </span>
  );
};
