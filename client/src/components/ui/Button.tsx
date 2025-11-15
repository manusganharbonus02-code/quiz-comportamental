import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none";
    
    const variantClasses = {
      default: 'bg-amber-500 text-slate-900 font-bold hover:bg-amber-400 focus-visible:ring-amber-300 shadow-lg shadow-amber-500/20 transform hover:scale-105',
      outline: 'border border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200 focus-visible:ring-slate-600',
      ghost: 'hover:bg-slate-800 text-slate-300 hover:text-slate-100 focus-visible:ring-slate-600',
    };

    const sizeClasses = {
      default: 'h-10 py-2 px-4',
      sm: 'h-9 px-3',
      lg: 'h-12 px-8 text-base',
    };

    return (
      <button
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
