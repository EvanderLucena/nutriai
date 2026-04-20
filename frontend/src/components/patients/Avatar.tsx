import type { PatientStatus } from '../../types/patient';

interface AvatarProps {
  initials: string;
  status?: PatientStatus | 'inactive' | 'pending';
  size?: number;
  src?: string;
}

const STATUS_COLORS: Record<string, string> = {
  ontrack: 'var(--sage)',
  warning: 'var(--amber)',
  danger: 'var(--coral)',
  inactive: 'var(--fg-subtle)',
  pending: 'var(--fg-subtle)',
};

export function Avatar({ initials, status = 'ontrack', size = 32, src }: AvatarProps) {
  const bgColor = STATUS_COLORS[status] || 'var(--fg-subtle)';

  if (src) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', position: 'relative', flexShrink: 0, overflow: 'hidden' }}>
        <img src={src} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {status && (
          <span style={{
            position: 'absolute', bottom: -1, right: -1,
            width: size >= 40 ? 10 : 8, height: size >= 40 ? 10 : 8,
            borderRadius: '50%', background: bgColor,
            boxShadow: '0 0 0 3px var(--surface)',
          }} />
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: 'var(--surface-2)',
        display: 'grid', placeItems: 'center',
        fontFamily: 'var(--font-mono)', fontSize: size >= 40 ? 13 : size * 0.38,
        fontWeight: 600, color: 'var(--fg)',
        position: 'relative', flexShrink: 0,
      }}
    >
      {initials}
      {status && (
        <span style={{
          position: 'absolute', bottom: -1, right: -1,
          width: size >= 40 ? 10 : 8, height: size >= 40 ? 10 : 8,
          borderRadius: '50%', background: bgColor,
          boxShadow: '0 0 0 3px var(--surface)',
        }} />
      )}
    </div>
  );
}