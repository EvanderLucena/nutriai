import { useState } from 'react';
import type { MealFood } from '../../types/plan';

interface PlanFoodRowProps {
  item: MealFood;
  isLast: boolean;
  onGramsChange: (grams: number) => void;
  onQtyChange: (qty: string) => void;
  onPrepChange: (prep: string) => void;
  onRemove: () => void;
}

export function PlanFoodRow({ item, isLast, onGramsChange, onQtyChange, onPrepChange, onRemove }: PlanFoodRowProps) {
  const [macroFlash, setMacroFlash] = useState(false);

  const cellStyle = (color: string, isNum: boolean, readonly?: boolean): React.CSSProperties => ({
    padding: '5px 7px',
    border: '1px solid transparent',
    borderRadius: 5,
    fontSize: 12.5,
    background: readonly ? 'var(--surface-2)' : 'transparent',
    outline: 'none',
    color,
    width: '100%',
    fontFamily: isNum ? 'var(--font-mono)' : 'var(--font-ui)',
    textAlign: isNum ? 'right' : 'left',
    transition: readonly ? 'opacity 0.2s' : 'border-color 0.1s, background 0.1s',
    opacity: macroFlash ? 0.5 : 1,
  });

  const onFocusIn = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--border)';
    e.target.style.background = 'var(--surface)';
  };
  const onFocusOut = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'transparent';
    e.target.style.background = 'transparent';
  };

  const editableInp = (
    value: string | number,
    color: string,
    isNum: boolean,
    onChange: (val: string) => void,
    type?: string,
  ) => (
    <input
      value={String(value)}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocusIn}
      onBlur={onFocusOut}
      type={type}
      style={cellStyle(color, isNum)}
    />
  );

  const handleGramsBlur = (val: string) => {
    const newGrams = Number(val) || 0;
    setMacroFlash(true);
    onGramsChange(newGrams);
    setTimeout(() => setMacroFlash(false), 200);
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '2.2fr 1fr 0.8fr 1.8fr 0.8fr 0.8fr 0.9fr 0.8fr 28px',
        gap: 10,
        padding: '8px 16px',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        alignItems: 'center',
      }}
    >
      {/* Alimento — read-only, frozen display name */}
      <div
        className="mono"
        title="Vinculado ao catálogo"
        style={{
          padding: '5px 7px',
          fontSize: 12.5,
          color: 'var(--fg)',
          background: 'var(--surface-2)',
          borderRadius: 5,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {item.foodName}
      </div>

      {/* Quantidade — editable free text */}
      {editableInp(item.qty, 'var(--fg-muted)', false, (val) => onQtyChange(val))}

      {/* Gramas — editable numeric */}
      <input
        type="number"
        value={String(item.grams)}
        onBlur={(e) => handleGramsBlur(e.target.value)}
        style={cellStyle('var(--fg)', true)}
      />

      {/* Preparo — editable */}
      {editableInp(item.prep, 'var(--fg-muted)', false, (val) => onPrepChange(val))}

      {/* Kcal — read-only frozen macro */}
      <input readOnly value={String(item.kcal)} style={cellStyle('var(--fg)', true, true)} />

      {/* Prot — read-only frozen macro */}
      <input readOnly value={String(item.prot)} style={cellStyle('var(--sage-dim)', true, true)} />

      {/* Carb — read-only frozen macro */}
      <input readOnly value={String(item.carb)} style={cellStyle('var(--carb)', true, true)} />

      {/* Gord — read-only frozen macro */}
      <input readOnly value={String(item.fat)} style={cellStyle('var(--sky)', true, true)} />

      {/* Remove button */}
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