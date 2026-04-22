import { useState, useEffect, useRef } from 'react';
import type { MealFood } from '../../types/plan';

interface PlanFoodRowProps {
  item: MealFood;
  isLast: boolean;
  onGramsChange: (grams: number) => void;
  onQtyChange: (qty: string) => void;
  onPrepChange: (prep: string) => void;
  onRemove: () => void;
}

function EditableCell({ value, color, isNum, onChange }: { value: string | number; color: string; isNum: boolean; onChange: (val: string) => void }) {
  const [local, setLocal] = useState(String(value));
  const ref = useRef<HTMLInputElement>(null);
  const syncing = useRef(false);

  useEffect(() => {
    if (!ref.current || ref.current !== document.activeElement) {
      syncing.current = true;
      setLocal(String(value));
      syncing.current = false;
    }
  }, [value]);

  return (
    <input
      ref={ref}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={(e) => {
        e.target.style.borderColor = 'transparent';
        e.target.style.background = 'transparent';
        const synced = String(value);
        if (e.target.value !== synced) onChange(e.target.value);
        else setLocal(synced);
      }}
      onFocus={(e) => {
        e.target.style.borderColor = 'var(--border)';
        e.target.style.background = 'var(--surface)';
      }}
      style={{
        padding: '5px 7px', border: '1px solid transparent', borderRadius: 5, fontSize: 12.5,
        background: 'transparent', outline: 'none', color, width: '100%',
        fontFamily: isNum ? 'var(--font-mono)' : 'var(--font-ui)',
        textAlign: isNum ? 'right' : 'left',
      }}
    />
  );
}

export function PlanFoodRow({ item, isLast, onGramsChange, onQtyChange, onPrepChange, onRemove }: PlanFoodRowProps) {
  const [macroFlash, setMacroFlash] = useState(false);
  const [localGrams, setLocalGrams] = useState(String(item.grams));
  const gramsRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!gramsRef.current || gramsRef.current !== document.activeElement) {
      setLocalGrams(String(item.grams));
    }
  }, [item.grams]);

  const handleGramsBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'transparent';
    e.target.style.background = 'transparent';
    const newGrams = Number(e.target.value) || 0;
    if (newGrams !== item.grams) {
      setMacroFlash(true);
      onGramsChange(newGrams);
      setTimeout(() => setMacroFlash(false), 200);
    } else {
      setLocalGrams(String(item.grams));
    }
  };

  const readonlyStyle = (color: string): React.CSSProperties => ({
    padding: '5px 7px', border: '1px solid transparent', borderRadius: 5, fontSize: 12.5,
    background: 'var(--surface-2)', outline: 'none', color, width: '100%',
    fontFamily: 'var(--font-mono)', textAlign: 'right',
    transition: 'opacity 0.2s', opacity: macroFlash ? 0.5 : 1,
  });

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
      <div
        className="mono"
        title="Vinculado ao catálogo"
        style={{
          padding: '5px 7px', fontSize: 12.5, color: 'var(--fg)',
          background: 'var(--surface-2)', borderRadius: 5,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}
      >
        {item.foodName}
      </div>

      <EditableCell value={item.qty} color="var(--fg-muted)" isNum={false} onChange={onQtyChange} />

      <input
        ref={gramsRef}
        type="number"
        value={localGrams}
        onChange={(e) => setLocalGrams(e.target.value)}
        onBlur={handleGramsBlur}
        onFocus={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--surface)'; }}
        style={{
          padding: '5px 7px', border: '1px solid transparent', borderRadius: 5, fontSize: 12.5,
          background: 'transparent', outline: 'none', color: 'var(--fg)', width: '100%',
          fontFamily: 'var(--font-mono)', textAlign: 'right',
        }}
      />

      <EditableCell value={item.prep} color="var(--fg-muted)" isNum={false} onChange={onPrepChange} />

      <input readOnly value={String(item.kcal)} style={readonlyStyle('var(--fg)')} />
      <input readOnly value={String(item.prot)} style={readonlyStyle('var(--sage-dim)')} />
      <input readOnly value={String(item.carb)} style={readonlyStyle('var(--carb)')} />
      <input readOnly value={String(item.fat)} style={readonlyStyle('var(--sky)')} />

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