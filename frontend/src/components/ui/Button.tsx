import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'ai' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-lime text-ink hover:bg-lime-dim font-semibold shadow-sm active:scale-[0.97]',
  secondary:
    'bg-surface-2 border border-border text-fg hover:bg-border active:scale-[0.97]',
  ghost: 'bg-transparent text-fg-muted hover:bg-surface-2 hover:text-fg',
  ai: 'bg-lime/15 text-lime border border-lime/30 hover:bg-lime/25 font-semibold',
  danger:
    'bg-coral text-white hover:bg-coral-dim font-semibold shadow-sm active:scale-[0.97]',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1 text-xs rounded-[var(--radius-sm)]',
  md: 'px-4 py-2 text-sm rounded-[var(--radius)]',
  lg: 'px-6 py-3 text-base rounded-[var(--radius-lg)]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-ui transition-all duration-150 cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}