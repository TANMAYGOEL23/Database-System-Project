import React from 'react';
import { cn } from '../../utils/cn';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  subtitle?: string;
  badge?: string;
  badgeColor?: 'blue' | 'emerald' | 'amber' | 'rose';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  subtitle,
  badge,
  badgeColor = 'blue',
  className,
}) => {
  const badgeColors = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <div
      className={cn(
        'relative bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg shadow-black/20 transition-all duration-200 group overflow-hidden',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">{title}</p>
          <h4 className="text-2xl font-bold font-mono tracking-tight text-slate-100">{value}</h4>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 text-blue-400 group-hover:scale-105 transition-transform">
          {icon}
        </div>
      </div>

      {(trend || subtitle || badge) && (
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 font-mono font-medium',
                trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
              )}
            >
              {trend.isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{Math.abs(trend.value)}%</span>
              {trend.label && <span className="text-slate-500 ml-1">{trend.label}</span>}
            </div>
          )}
          {subtitle && !trend && <span className="text-slate-400">{subtitle}</span>}
          {badge && (
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase border',
                badgeColors[badgeColor]
              )}
            >
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
