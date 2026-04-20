import { useState, useRef } from 'react';

interface LineChartDatum {
  date: string;
  [key: string]: number | string;
}

interface LineChartProps {
  data: LineChartDatum[];
  width?: number;
  height?: number;
  yKey?: string;
  yLabel?: string;
  color?: string;
  fill?: string;
  unit?: string;
  className?: string;
}

export function LineChart({
  data,
  width = 560,
  height = 200,
  yKey = 'weight',
  yLabel: _yLabel,
  color = 'var(--ink-contrast)',
  fill = 'rgba(11,12,10,0.05)',
  unit = '',
  className,
}: LineChartProps) {
  const [hover, setHover] = useState<{ idx: number; mx: number; my: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  if (!data || !data.length) return null;

  const padL = 36;
  const padR = 12;
  const padT = 14;
  const padB = 24;
  const w = width - padL - padR;
  const h = height - padT - padB;
  const vals = data.map((d) => d[yKey] as number);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const pad = range * 0.2;
  const ymin = min - pad;
  const ymax = max + pad;
  const yRange = ymax - ymin;
  const n = data.length;
  const step = w / (n - 1);
  const pts = data.map((d, i) => [padL + i * step, padT + h - ((d[yKey] as number - ymin) / yRange) * h] as [number, number]);
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = `${path} L${padL + w},${padT + h} L${padL},${padT + h} Z`;
  const yTicks = [ymax, (ymax + ymin) / 2, ymin];

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!svgRef.current || !wrapRef.current) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    const wrapRect = wrapRef.current.getBoundingClientRect();
    const svgX = (e.clientX - svgRect.left) * (width / svgRect.width);
    const idx = Math.round((svgX - padL) / step);
    const mx = e.clientX - wrapRect.left;
    const my = e.clientY - wrapRect.top;
    if (idx >= 0 && idx < n) setHover({ idx, mx, my });
    else setHover(null);
  };

  return (
    <div ref={wrapRef} className={className} style={{ position: 'relative' }} onMouseMove={handleMouseMove} onMouseLeave={() => setHover(null)}>
      <svg ref={svgRef} width={width} height={height} style={{ display: 'block', cursor: 'crosshair' }}>
        {yTicks.map((t, i) => {
          const y = padT + (i / 2) * h;
          return (
            <g key={i}>
              <line x1={padL} x2={padL + w} y1={y} y2={y} stroke="var(--border)" strokeDasharray="1 3" />
              <text x={padL - 6} y={y + 3} textAnchor="end" fontFamily="var(--font-mono)" fontSize="10" fill="var(--fg-subtle)">
                {t.toFixed(1)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => (
          <text key={i} x={padL + i * step} y={height - 6} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="var(--fg-subtle)">
            {d.date}
          </text>
        ))}
        <path d={area} fill={fill} />
        <path d={path} fill="none" stroke={color} strokeWidth="1.5" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={hover?.idx === i ? 5 : 3} fill="var(--bg)" stroke={color} strokeWidth="1.5" />
        ))}
        {hover && (
          <line x1={pts[hover.idx][0]} x2={pts[hover.idx][0]} y1={padT} y2={padT + h} stroke="var(--fg)" strokeWidth="1" strokeDasharray="3 3" opacity={0.35} />
        )}
      </svg>
      {hover && (
        <div style={{
          position: 'absolute',
          left: hover.mx + 14,
          top: hover.my - 10,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
          padding: '9px 12px',
          pointerEvents: 'none',
          zIndex: 10,
          whiteSpace: 'nowrap',
        }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--fg-subtle)', marginBottom: 6, letterSpacing: '0.06em' }}>{data[hover.idx].date}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span className="mono tnum" style={{ fontSize: 15, fontWeight: 600, color }}>{vals[hover.idx]}{unit}</span>
          </div>
        </div>
      )}
    </div>
  );
}