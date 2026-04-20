interface RingProps {
  size?: number;
  stroke?: number;
  value?: number;
  color?: string;
  track?: string;
  label?: string;
  sub?: string;
  valueColor?: string;
  className?: string;
}

export function Ring({
  size = 56,
  stroke = 5,
  value = 0.75,
  color = 'currentColor',
  track = 'var(--border)',
  label,
  sub,
  valueColor,
  className,
}: RingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.min(Math.max(value, 0), 1.2);
  const dash = Math.min(v, 1) * c;
  const over = v > 1;

  return (
    <div className={className} style={{ position: 'relative', width: size, height: size, display: 'inline-block' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={over ? 'var(--coral)' : color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      {(label || sub) && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', lineHeight: 1 }}>
          {label && <div className="mono tnum" style={{ fontSize: Math.max(11, size * 0.22), fontWeight: 600, color: valueColor || 'var(--fg)' }}>{label}</div>}
          {sub && <div className="mono" style={{ fontSize: 9, color: 'var(--fg-subtle)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>{sub}</div>}
        </div>
      )}
    </div>
  );
}