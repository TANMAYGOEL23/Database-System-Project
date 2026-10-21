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
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div
      className={cn(
        'relative bg-white border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 group overflow-hidden',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">{title}</p>
          <h4 className="text-2xl font-bold font-mono tracking-tight text-slate-100">{value}</h4>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-blue-600 group-hover:scale-105 transition-transform shadow-xs">
          {icon}
        </div>
      </div>

      {(trend || subtitle || badge) && (
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 font-mono font-medium',
                trend.isPositive ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'
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
