interface StackBarSegment {
  value: number;
  color: string;
  label: string;
}

interface StackBarProps {
  segments: StackBarSegment[];
  height?: number;
  radius?: number;
  className?: string;
}

export function StackBar({ segments, height = 8, radius = 4, className }: StackBarProps) {
  return (
    <div className={className} style={{ display: 'flex', height, borderRadius: radius, overflow: 'hidden', background: 'var(--surface-2)' }}>
      {segments.map((s, i) => (
        <div key={i} title={`${s.label}: ${s.value}`} style={{ flex: s.value, background: s.color }} />
      ))}
    </div>
  );
}