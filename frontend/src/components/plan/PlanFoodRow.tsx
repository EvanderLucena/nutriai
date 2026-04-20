import type { MealFood } from '../../types/plan';

interface PlanFoodRowProps {
  item: MealFood;
  isLast: boolean;
  onChange: (key: keyof MealFood, val: string) => void;
  onRemove: () => void;
}

export function PlanFoodRow({ item, isLast, onChange, onRemove }: PlanFoodRowProps) {
  const cellStyle = (color: string, isNum: boolean): React.CSSProperties => ({
    padding: '5px 7px',
    border: '1px solid transparent',
    borderRadius: 5,
    fontSize: 12.5,
    background: 'transparent',
    outline: 'none',
    color,
    width: '100%',
    fontFamily: isNum ? 'var(--font-mono)' : 'var(--font-ui)',
    textAlign: isNum ? 'right' : 'left',
    transition: 'border-color 0.1s, background 0.1s',
  });

  const onFocusIn = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--border)';
    e.target.style.background = 'var(--surface)';
  };
  const onFocusOut = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'transparent';
    e.target.style.background = 'transparent';
  };

  const inp = (key: keyof MealFood, color: string, isNum: boolean) => (
    <input
      value={String(item[key])}
      onChange={(e) => onChange(key, e.target.value)}
      onFocus={onFocusIn}
      onBlur={onFocusOut}
      style={cellStyle(color, isNum)}
    />
  );

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '2.2fr 1fr 1.8fr 0.8fr 0.8fr 0.9fr 0.8fr 28px',
        gap: 10,
        padding: '8px 16px',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        alignItems: 'center',
      }}
    >
      {inp('food', 'var(--fg)', false)}
      {inp('qty', 'var(--fg-muted)', false)}
      {inp('prep', 'var(--fg-muted)', false)}
      {inp('kcal', 'var(--fg)', true)}
      {inp('prot', 'var(--sage-dim)', true)}
      {inp('carb', 'var(--carb)', true)}
      {inp('fat', 'var(--sky)', true)}
      <button
        onClick={onRemove}
        title="Remover"
        style={{ color: 'var(--fg-subtle)', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--coral)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--fg-subtle)')}
      >
        ×
      </button>
    </div>
  );
}