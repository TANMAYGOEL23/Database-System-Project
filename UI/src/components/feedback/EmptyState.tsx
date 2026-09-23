import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from '../ui/Button';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There are currently no items matching your criteria in the system.',
  actionText,
  onAction,
  icon = <PackageOpen className="w-12 h-12 text-slate-600" />,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 space-y-4 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
      <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">{icon}</div>
      <div className="max-w-sm space-y-1">
        <h4 className="text-base font-semibold text-slate-200">{title}</h4>
        <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      </div>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
