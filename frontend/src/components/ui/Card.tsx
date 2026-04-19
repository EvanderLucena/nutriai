import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, children, className }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border border-border bg-surface overflow-hidden',
        className,
      )}
    >
      {title && (
        <div className="card-h px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold font-ui text-fg">{title}</h3>
        </div>
      )}
      <div className="card-b p-5">{children}</div>
    </div>
  );
}