import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: {
    value: string | number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'cyan' | 'slate';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  subtitle,
  trend,
  variant = 'slate',
  className,
}) => {
  const variantStyles = {
    blue: 'border-blue-500/30 bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-900',
    emerald: 'border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900',
    amber: 'border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900',
    rose: 'border-rose-500/30 bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900',
    indigo: 'border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900',
    cyan: 'border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900',
    slate: 'border-slate-800 bg-slate-900/90',
  };

  const iconContainerStyles = {
    blue: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    rose: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    indigo: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
    cyan: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
    slate: 'bg-slate-800 text-slate-300 border border-slate-700',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border p-5 transition-all duration-200 hover:border-slate-700 hover:shadow-lg',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-white font-mono">{value}</h3>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className={cn('rounded-xl p-3 shadow-inner', iconContainerStyles[variant])}>
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-semibold',
              trend.direction === 'up'
                ? 'bg-emerald-500/20 text-emerald-400'
                : trend.direction === 'down'
                ? 'bg-rose-500/20 text-rose-400'
                : 'bg-slate-800 text-slate-400'
            )}
          >
            {trend.direction === 'up' && <ArrowUpRight className="w-3.5 h-3.5" />}
            {trend.direction === 'down' && <ArrowDownRight className="w-3.5 h-3.5" />}
            {trend.direction === 'neutral' && <Minus className="w-3.5 h-3.5" />}
            {trend.value}
          </span>
          {trend.label && <span className="text-slate-500">{trend.label}</span>}
        </div>
      )}
    </div>
  );
};
