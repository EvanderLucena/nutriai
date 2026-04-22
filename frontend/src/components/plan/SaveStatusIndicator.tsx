import type { SaveStatus } from '../../stores/planStore';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
}

export function SaveStatusIndicator({ status }: SaveStatusIndicatorProps) {
  const config: Record<SaveStatus, { text: string; color: string }> = {
    saved: { text: 'SALVO', color: 'var(--fg-subtle)' },
    saving: { text: 'SALVANDO…', color: 'var(--fg-muted)' },
    error: { text: 'ERRO AO SALVAR', color: 'var(--coral)' },
  };

  const { text, color } = config[status];

  return (
    <span className="mono tnum" style={{ fontSize: 10, letterSpacing: '0.04em', color }}>
      {text}
    </span>
  );
}