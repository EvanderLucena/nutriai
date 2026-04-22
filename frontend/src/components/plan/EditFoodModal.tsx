import { useState } from 'react';
import type { MealFood } from '../../types/plan';
import { IconX, IconCheck } from '../icons';

interface EditFoodModalProps {
  item: MealFood;
  onClose: () => void;
  onSave: (item: MealFood) => void;
}

export function EditFoodModal({ item, onClose, onSave }: EditFoodModalProps) {
  const [foodName, setFoodName] = useState(item.foodName);
  const [qty, setQty] = useState(item.qty);
  const [prep, setPrep] = useState(item.prep);
  const [grams, setGrams] = useState(String(item.grams));
  const [kcal, setKcal] = useState(String(item.kcal));
  const [prot, setProt] = useState(String(item.prot));
  const [carb, setCarb] = useState(String(item.carb));
  const [fat, setFat] = useState(String(item.fat));

  const handle = () => {
    if (!foodName.trim()) return;
    onSave({
      ...item,
      foodName: foodName.trim(),
      qty,
      prep,
      grams: Number(grams) || 0,
      kcal: Number(kcal) || 0,
      prot: Number(prot) || 0,
      carb: Number(carb) || 0,
      fat: Number(fat) || 0,
    });
  };

  const field = (label: string, val: string, set: (v: string) => void, opts: { color?: string; mono?: boolean } = {}) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div className="eyebrow">{label}</div>
      <input
        autoComplete="off"
        value={val}
        onChange={(e) => set(e.target.value)}
        style={{
          padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13,
          background: 'var(--surface)', outline: 'none', color: opts.color || 'var(--fg)',
          fontFamily: opts.mono ? 'var(--font-mono)' : 'var(--font-ui)', width: '100%', boxSizing: 'border-box',
        }}
        onFocus={(e) => (e.target.style.borderColor = 'var(--fg-muted)')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
      />
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,12,10,0.4)', zIndex: 200, display: 'grid', placeItems: 'center', padding: 20 }} onClick={onClose}>
      <div className="card" style={{ width: 'min(460px, 100%)', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }} onClick={(e) => e.stopPropagation()}>
        <div className="card-h">
          <div className="title">Editar alimento</div>
          <div className="spacer" />
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '4px 6px' }}><IconX size={14} /></button>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--fg-subtle)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Alimento vinculado ao catálogo
          </div>
          {field('Nome', foodName, setFoodName)}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {field('Quantidade', qty, setQty)}
            {field('Gramas', grams, setGrams, { mono: true })}
          </div>
          {field('Preparo', prep, setPrep)}
          <div className="divider"><span>Valores nutricionais (congelados)</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {field('Kcal', kcal, setKcal, { mono: true })}
            {field('Prot (g)', prot, setProt, { color: 'var(--sage-dim)', mono: true })}
            {field('Carb (g)', carb, setCarb, { color: 'var(--carb)', mono: true })}
            {field('Gord (g)', fat, setFat, { color: 'var(--sky)', mono: true })}
          </div>
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--surface-2)' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handle} disabled={!foodName.trim()} style={{ opacity: foodName.trim() ? 1 : 0.45 }}>
            <IconCheck size={13} /> Salvar
          </button>
        </div>
      </div>
    </div>
  );
}