import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost' | 'industrial' | 'emerald';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-lg active:scale-[0.98]';

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 focus:ring-blue-500 border border-blue-500/30',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 focus:ring-slate-600 border border-slate-700',
    outline: 'bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 focus:ring-slate-500',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 focus:ring-rose-500 border border-rose-500/30',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 focus:ring-emerald-500 border border-emerald-500/30',
    emerald: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 focus:ring-emerald-500 border border-emerald-500/30',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-100 focus:ring-slate-600',
    industrial: 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/20 focus:ring-amber-500 border border-amber-500/30',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-2.5 gap-2.5',
    icon: 'p-2',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
