import { useState, useEffect, useRef } from 'react';
import type { MealFood } from '../../types/plan';
import { FOOD_UNIT_SYMBOLS } from '../../types/food';

interface PlanFoodRowProps {
  item: MealFood;
  isLast: boolean;
  onReferenceAmountChange: (referenceAmount: number) => void;
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

export function PlanFoodRow({ item, isLast, onReferenceAmountChange, onPrepChange, onRemove }: PlanFoodRowProps) {
  const [macroFlash, setMacroFlash] = useState(false);
  const [localRef, setLocalRef] = useState(String(item.referenceAmount));
  const refInput = useRef<HTMLInputElement>(null);
  const unitSymbol = FOOD_UNIT_SYMBOLS[item.unit as keyof typeof FOOD_UNIT_SYMBOLS] || 'g';

  useEffect(() => {
    if (!refInput.current || refInput.current !== document.activeElement) {
      setLocalRef(String(item.referenceAmount));
    }
  }, [item.referenceAmount]);

  const handleRefBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'transparent';
    e.target.style.background = 'transparent';
    const newRef = Number(e.target.value) || 0;
    if (newRef !== item.referenceAmount) {
      setMacroFlash(true);
      onReferenceAmountChange(newRef);
      setTimeout(() => setMacroFlash(false), 200);
    } else {
      setLocalRef(String(item.referenceAmount));
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
        gridTemplateColumns: '2.2fr 0.8fr 0.6fr 1.8fr 0.8fr 0.8fr 0.9fr 0.8fr 28px',
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

      <input
        ref={refInput}
        type="number"
        value={localRef}
        onChange={(e) => setLocalRef(e.target.value)}
        onBlur={handleRefBlur}
        onFocus={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--surface)'; }}
        style={{
          padding: '5px 7px', border: '1px solid transparent', borderRadius: 5, fontSize: 12.5,
          background: 'transparent', outline: 'none', color: 'var(--fg)', width: '100%',
          fontFamily: 'var(--font-mono)', textAlign: 'right',
        }}
      />

      <div
        className="mono"
        style={{
          padding: '5px 7px', fontSize: 11, color: 'var(--fg-muted)',
          background: 'var(--surface-2)', borderRadius: 5, textAlign: 'center',
        }}
      >
        {unitSymbol}
      </div>

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