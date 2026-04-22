interface PortionChipsProps {
  portions: Array<{ name: string; grams: number }>;
  onSelect: (name: string, grams: number) => void;
}

export function PortionChips({ portions, onSelect }: PortionChipsProps) {
  if (!portions || portions.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
      {portions.map((p, i) => (
        <button
          key={i}
          onClick={() => onSelect(p.name, p.grams)}
          style={{
            fontSize: 11,
            padding: '3px 7px',
            borderRadius: 999,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--fg-muted)',
            cursor: 'pointer',
            fontFamily: 'var(--font-ui)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {p.name} ({p.grams}g)
        </button>
      ))}
    </div>
  );
}