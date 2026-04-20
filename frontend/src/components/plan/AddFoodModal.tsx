import { useState, useMemo } from 'react';
import type { MealFood } from '../../types/plan';
import { FOODS_CATALOG } from '../../data/foods';
import type { Food } from '../../types/food';
import { IconSearch, IconPlus, IconX } from '../icons';

interface AddFoodModalProps {
  onClose: () => void;
  onAdd: (item: MealFood) => void;
}

export function AddFoodModal({ onClose, onAdd }: AddFoodModalProps) {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Food | null>(null);
  const [qty, setQty] = useState('');

  const results = useMemo(() => {
    if (!q) return [];
    return FOODS_CATALOG.filter((f) => f.name.toLowerCase().includes(q.toLowerCase())).slice(0, 8);
  }, [q]);

  const handleAdd = () => {
    if (!selected) return;
    const nutrition =
      selected.type === 'preset'
        ? selected.nutrition!
        : { kcal: selected.per100!.kcal, prot: selected.per100!.prot, carb: selected.per100!.carb, fat: selected.per100!.fat };
    onAdd({
      food: selected.name,
      qty: qty || (selected.type === 'preset' ? selected.portionLabel! : '100g'),
      prep: '-',
      ...nutrition,
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,12,10,0.4)', zIndex: 200, display: 'grid', placeItems: 'center', padding: 20 }} onClick={onClose}>
      <div className="card" style={{ width: 'min(520px, 100%)', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }} onClick={(e) => e.stopPropagation()}>
        <div className="card-h">
          <div className="title">Adicionar alimento</div>
          <div className="spacer" />
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '4px 6px' }}><IconX size={14} /></button>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="search" style={{ margin: 0 }}>
            <IconSearch size={13} />
            <input autoFocus placeholder="Buscar no catálogo…" value={q} onChange={(e) => { setQ(e.target.value); setSelected(null); }} />
          </div>
          {results.length > 0 && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
              {results.map((f) => (
                <div
                  key={f.id}
                  onClick={() => setSelected(f)}
                  style={{
                    padding: '10px 14px', cursor: 'pointer',
                    background: selected?.id === f.id ? 'var(--surface-2)' : 'transparent',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: selected?.id === f.id ? 600 : 400 }}>{f.name}</div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--fg-subtle)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {f.category} · {f.type === 'preset' ? f.portionLabel : 'por 100g'}
                    </div>
                  </div>
                  <div className="mono tnum" style={{ fontSize: 11.5, color: 'var(--fg-muted)', flexShrink: 0 }}>
                    {f.type === 'preset' ? f.nutrition!.kcal : f.per100!.kcal} kcal
                  </div>
                </div>
              ))}
            </div>
          )}
          {q && results.length === 0 && (
            <div style={{ fontSize: 12.5, color: 'var(--fg-subtle)', textAlign: 'center', padding: '12px 0' }}>Nenhum alimento encontrado.</div>
          )}
          {selected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="eyebrow">Quantidade / descrição</div>
              <input
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder={selected.type === 'preset' ? selected.portionLabel : 'ex: 150g'}
                style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, background: 'var(--surface)', outline: 'none', color: 'var(--fg)' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 6 }}>
                {(['kcal', 'prot', 'carb', 'fat'] as const).map((k) => {
                  const n = selected.type === 'preset' ? selected.nutrition! : selected.per100!;
                  return (
                    <div key={k}>
                      <div className="eyebrow" style={{ fontSize: 9 }}>{k}</div>
                      <div className="mono tnum" style={{ fontSize: 14, fontWeight: 600 }}>{n[k]}{k !== 'kcal' ? 'g' : ''}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--surface-2)' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={!selected} onClick={handleAdd} style={{ opacity: selected ? 1 : 0.45 }}>
            <IconPlus size={13} /> Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}