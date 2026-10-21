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
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-lg active:scale-[0.98]';

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs focus:ring-blue-500 border border-transparent',
    secondary: 'bg-white hover:bg-slate-850 text-slate-100 focus:ring-slate-400 border border-slate-800 shadow-xs',
    outline: 'bg-white hover:bg-slate-850 text-slate-200 hover:text-slate-100 border border-slate-800 focus:ring-slate-400 shadow-xs',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus:ring-rose-500 border border-transparent',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs focus:ring-emerald-500 border border-transparent',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs focus:ring-emerald-500 border border-transparent',
    ghost: 'bg-transparent hover:bg-slate-850 text-slate-400 hover:text-slate-100 focus:ring-slate-400',
    industrial: 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs focus:ring-amber-500 border border-transparent',
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
