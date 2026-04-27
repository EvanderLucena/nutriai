import { useState, useEffect, useRef } from 'react';
import type { MealFood } from '../../types/plan';
import { FOOD_UNIT_SYMBOLS } from '../../types/food';
import { sanitizeNumberInput, parseNumberInput } from '../../utils/numberInput';

interface PlanFoodRowProps {
  item: MealFood;
  isLast: boolean;
  onReferenceAmountChange: (referenceAmount: number) => void;
  onPrepChange: (prep: string) => void;
  onRemove: () => void;
}

function EditableCell({
  value,
  color,
  isNum,
  onChange,
}: {
  value: string | number;
  color: string;
  isNum: boolean;
  onChange: (val: string) => void;
}) {
  const [local, setLocal] = useState(String(value));
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ref.current || ref.current !== document.activeElement) {
      setLocal(String(value));
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
      }}
    />
  );
}

function MacroReadonly({
  value,
  color,
  opacity,
}: {
  value: string;
  color: string;
  opacity: number;
}) {
  return (
    <input
      readOnly
      value={value}
      style={{
        padding: '5px 7px',
        border: '1px solid transparent',
        borderRadius: 5,
        fontSize: 12.5,
        background: 'var(--surface-2)',
        outline: 'none',
        color,
        width: '100%',
        fontFamily: 'var(--font-mono)',
        textAlign: 'right',
        opacity,
        transition: 'opacity 0.2s',
      }}
    />
  );
}

function RefInput({ value, onBlur }: { value: number; onBlur: (newRef: number) => void }) {
  const [localRef, setLocalRef] = useState(String(value));
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ref.current || ref.current !== document.activeElement) {
      setLocalRef(String(value));
    }
  }, [value]);

  return (
    <input
      ref={ref}
      inputMode="numeric"
      pattern="[0-9.,]*"
      value={localRef}
      onChange={(e) => setLocalRef(sanitizeNumberInput(e.target.value))}
      onBlur={() => {
        if (!ref.current) return;
        ref.current.style.borderColor = 'transparent';
        ref.current.style.background = 'transparent';
        onBlur(parseNumberInput(localRef));
      }}
      onKeyDown={(e) => {
        if (e.key.length === 1 && !/[0-9.,]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
        }
      }}
      onFocus={(e) => {
        e.target.style.borderColor = 'var(--border)';
        e.target.style.background = 'var(--surface)';
      }}
      style={{
        padding: '5px 7px',
        border: '1px solid transparent',
        borderRadius: 5,
        fontSize: 12.5,
        background: 'transparent',
        outline: 'none',
        color: 'var(--fg)',
        width: '100%',
        fontFamily: 'var(--font-mono)',
        textAlign: 'right',
      }}
    />
  );
}

function PlanFoodRowGrid({ children, isLast }: { children: React.ReactNode; isLast: boolean }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '2.2fr 0.8fr 0.6fr 1.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 28px',
        gap: 10,
        padding: '8px 16px',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        alignItems: 'center',
      }}
    >
      {children}
    </div>
  );
}

function RemoveButton({ onRemove }: { onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      title="Remover"
      style={{
        color: 'var(--fg-subtle)',
        padding: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--coral)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--fg-subtle)')}
    >
      ×
    </button>
  );
}

function FoodNameCell({ name }: { name: string }) {
  return (
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
      {name}
    </div>
  );
}

function UnitSymbol({ unitSymbol }: { unitSymbol: string }) {
  return (
    <div
      className="mono"
      style={{
        padding: '5px 7px',
        fontSize: 11,
        color: 'var(--fg-muted)',
        background: 'var(--surface-2)',
        borderRadius: 5,
        textAlign: 'center',
      }}
    >
      {unitSymbol}
    </div>
  );
}

function MacroCells({ item, opacity }: { item: MealFood; opacity: number }) {
  return (
    <>
      <MacroReadonly value={String(item.kcal)} color="var(--fg)" opacity={opacity} />
      <MacroReadonly value={String(item.prot)} color="var(--sage-dim)" opacity={opacity} />
      <MacroReadonly value={String(item.carb)} color="var(--carb)" opacity={opacity} />
      <MacroReadonly value={String(item.fat)} color="var(--sky)" opacity={opacity} />
      <MacroReadonly value={String(item.fiber ?? 0)} color="var(--lime-dim)" opacity={opacity} />
    </>
  );
}

export function PlanFoodRow({
  item,
  isLast,
  onReferenceAmountChange,
  onPrepChange,
  onRemove,
}: PlanFoodRowProps) {
  const [macroFlash, setMacroFlash] = useState(false);
  const unitSymbol = FOOD_UNIT_SYMBOLS[item.unit as keyof typeof FOOD_UNIT_SYMBOLS] || 'g';

  const handleRefBlur = (newRef: number) => {
    if (newRef !== item.referenceAmount) {
      setMacroFlash(true);
      onReferenceAmountChange(newRef);
      setTimeout(() => setMacroFlash(false), 200);
    }
  };

  return (
    <PlanFoodRowGrid isLast={isLast}>
      <FoodNameCell name={item.foodName} />
      <RefInput value={item.referenceAmount} onBlur={handleRefBlur} />
      <UnitSymbol unitSymbol={unitSymbol} />
      <EditableCell
        value={item.prep ?? ''}
        color="var(--fg-muted)"
        isNum={false}
        onChange={onPrepChange}
      />
      <MacroCells item={item} opacity={macroFlash ? 0.5 : 1} />
      <RemoveButton onRemove={onRemove} />
    </PlanFoodRowGrid>
  );
}
