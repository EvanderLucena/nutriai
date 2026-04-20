interface WeekBarsProps {
  values: number[];
  height?: number;
  activeIndex?: number;
  className?: string;
}

const DAYS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];

export function WeekBars({ values, height = 42, activeIndex = -1, className }: WeekBarsProps) {
  return (
    <div className={className} style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height }}>
      {values.map((v, i) => {
        const h = Math.max(3, v * height);
        const color = v < 0.7 ? 'var(--coral)' : v < 0.85 ? 'var(--amber)' : 'var(--sage)';
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: '100%', height: h, background: color, borderRadius: 2, opacity: activeIndex === -1 || activeIndex === i ? 1 : 0.45 }} />
            <div className="mono" style={{ fontSize: 9, color: 'var(--fg-subtle)', letterSpacing: '0.04em' }}>
              {DAYS[i]}
            </div>
          </div>
        );
      })}
    </div>
  );
}