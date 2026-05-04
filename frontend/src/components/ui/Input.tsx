import { type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  dataTestId?: string;
}

export function Input({ label, error, className, id, dataTestId, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="eyebrow">
          {label}
        </label>
      )}
      <input
        id={inputId}
        data-testid={dataTestId}
        className={cn(
          'w-full rounded-[var(--radius)] border bg-surface px-3 py-2 text-sm font-ui text-fg',
          'placeholder:text-fg-subtle',
          'focus:outline-none focus:ring-2 focus:ring-lime/40 focus:border-lime',
          'transition-colors duration-150',
          error ? 'border-coral' : 'border-border',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-coral">{error}</p>}
    </div>
  );
}
