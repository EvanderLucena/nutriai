import type { ReactNode } from 'react';
import { Sparkline } from './viz/Sparkline';
import { cn } from '../lib/utils';

interface KPIProps {
  label: string;
  value: string | number;
  sub?: string;
  change?: string;
  trend?: 'up' | 'down';
  sparklineData?: number[];
  danger?: boolean;
  icon?: ReactNode;
  className?: string;
}

export function KPI({ label, value, sub, change, trend, sparklineData, danger, icon, className }: KPIProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border border-border bg-surface p-4',
        className,
      )}
    >
      <div className="eyebrow" style={{ marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div className="mono tnum" style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-0.02em', color: danger ? 'var(--coral)' : 'var(--fg)' }}>
          {value}
        </div>
        {sparklineData && sparklineData.length > 0 && (
          <Sparkline
            values={sparklineData}
            width={80}
            height={30}
            stroke={trend === 'down' ? 'var(--coral-dim)' : 'var(--sage-dim)'}
            fill={trend === 'down' ? 'rgba(204,85,59,0.12)' : 'rgba(127,183,126,0.12)'}
            showDots={false}
          />
        )}
        {icon && <div style={{ color: 'var(--fg-subtle)' }}>{icon}</div>}
      </div>
      {(sub || change) && (
        <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          {change && (
            <span style={{ color: trend === 'up' ? 'var(--sage)' : trend === 'down' ? 'var(--coral)' : 'var(--fg-muted)', fontWeight: 500 }}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''} {change}
            </span>
          )}
          {sub && <span>{sub}</span>}
        </div>
      )}
    </div>
  );
}