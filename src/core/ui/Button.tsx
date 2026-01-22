import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'ai';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon,
  isLoading,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center rounded-xl font-black uppercase tracking-widest transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-offset-gray-950 disabled:opacity-60 disabled:cursor-not-allowed transform active:scale-95 hover:-translate-y-0.5';

  const sizes = {
    sm: 'px-3 py-1.5 text-[10px]',
    md: 'px-4 py-2 text-[11px]',
    lg: 'px-6 py-3 text-xs'
  };

  const variants = {
    primary: 'bg-brand-500 hover:bg-brand-600 text-white shadow-premium hover:shadow-premium-lg border border-brand-400/20',
    secondary:
      'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 hover:bg-white dark:hover:bg-gray-750 shadow-premium-sm hover:shadow-premium',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-premium hover:shadow-premium-lg border border-red-400/20',
    ghost: 'bg-transparent hover:bg-brand-50 dark:hover:bg-brand-900/20 text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400',
    ai: 'bg-gradient-to-br from-brand-400 to-indigo-600 hover:from-brand-500 hover:to-indigo-700 text-white shadow-premium-lg hover:shadow-premium-xl border border-white/20'
  };

  return (
    <button
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={isLoading || disabled}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : icon ? (
        <span className="mr-2 -ml-1 flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

export default Button;
