interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  showDots?: boolean;
  target?: number;
  className?: string;
}

export function Sparkline({
  values,
  width = 220,
  height = 54,
  stroke = 'var(--ink-contrast)',
  fill = 'rgba(127,183,126,0.15)',
  showDots = true,
  target,
  className,
}: SparklineProps) {
  if (!values || values.length === 0) return null;

  const min = Math.min(...values) - 0.2;
  const max = Math.max(...values) + 0.2;
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const pts = values.map((v, i) => [i * step, height - ((v - min) / range) * height]);
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = `${path} L${width},${height} L0,${height} Z`;

  return (
    <svg width={width} height={height} className={className} style={{ display: 'block', overflow: 'visible' }}>
      {target !== undefined && (() => {
        const ty = height - ((target - min) / range) * height;
        return <line x1={0} x2={width} y1={ty} y2={ty} stroke="var(--border-2)" strokeDasharray="2 3" strokeWidth="1" />;
      })()}
      <path d={area} fill={fill} />
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {showDots && pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 3 : 2} fill={stroke} />
      ))}
    </svg>
  );
}