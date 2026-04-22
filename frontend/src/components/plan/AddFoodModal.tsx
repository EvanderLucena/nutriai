import { useState, useRef, useCallback, useEffect } from 'react';
import type { Food } from '../../types/food';
import { mapFoodFromApi } from '../../types/food';
import { listFoods } from '../../api/foods';
import { IconSearch, IconPlus, IconX } from '../icons';
import { PortionChips } from './PortionChips';

interface AddFoodModalProps {
  onClose: () => void;
  onAdd: (item: { foodId: string; grams: number; qty: string }) => void;
}

export function AddFoodModal({ onClose, onAdd }: AddFoodModalProps) {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Food | null>(null);
  const [qty, setQty] = useState('');
  const [grams, setGrams] = useState<number | ''>('');
  const [results, setResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced API search
  const handleSearch = useCallback((val: string) => {
    setQ(val);
    setSelected(null);
    setGrams('');
    setQty('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await listFoods({ search: val, page: 0, size: 10 });
        setResults(response.content.map(mapFoodFromApi));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const handleSelectFood = (food: Food) => {
    setSelected(food);
    if (food.type === 'preset') {
      setGrams(food.grams ?? 0);
      setQty(food.portionLabel ?? '');
    } else {
      setGrams('');
      setQty('');
    }
  };

  const handlePortionSelect = (name: string, portionGrams: number) => {
    setQty(name);
    setGrams(portionGrams);
  };

  // Approximate macro preview for display
  const getMacroPreview = () => {
    if (!selected || !grams) return null;
    if (selected.type === 'preset') {
      return selected.nutrition ?? null;
    }
    if (selected.per100) {
      const g = Number(grams) || 0;
      return {
        kcal: Math.round((selected.per100.kcal * g) / 10) / 10,
        prot: Math.round((selected.per100.prot * g) / 10) / 10,
        carb: Math.round((selected.per100.carb * g) / 10) / 10,
        fat: Math.round((selected.per100.fat * g) / 10) / 10,
      };
    }
    return null;
  };

  const macroPreview = getMacroPreview();

  const handleAdd = () => {
    if (!selected || !grams) return;
    onAdd({
      foodId: selected.id,
      grams: Number(grams),
      qty: qty || (selected.type === 'preset' ? selected.portionLabel! : `${grams}g`),
    });
    onClose();
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
            <input autoFocus placeholder="Buscar no catálogo…" value={q} onChange={(e) => handleSearch(e.target.value)} />
          </div>
          {searching && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ padding: '10px 14px', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', display: 'flex', gap: 12 }}>
                  <div style={{ width: '60%', height: 14, background: 'var(--surface-2)', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
                  <div style={{ width: '20%', height: 14, background: 'var(--surface-2)', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
                </div>
              ))}
            </div>
          )}
          {!searching && results.length > 0 && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
              {results.map((f) => (
                <div
                  key={f.id}
                  onClick={() => handleSelectFood(f)}
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
          {!searching && q && results.length === 0 && (
            <div style={{ fontSize: 12.5, color: 'var(--fg-subtle)', textAlign: 'center', padding: '12px 0' }}>Nenhum alimento encontrado.</div>
          )}
          {selected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div className="eyebrow">Quantidade / descrição</div>
                  <input
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="ex: 1 unidade, 2 col. sopa"
                    style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, background: 'var(--surface)', outline: 'none', color: 'var(--fg)', width: '100%', boxSizing: 'border-box' }}
                  />
                  {selected.type === 'base' && selected.portions && (
                    <PortionChips portions={selected.portions} onSelect={handlePortionSelect} />
                  )}
                </div>
                <div>
                  <div className="eyebrow">Gramas</div>
                  <input
                    type="number"
                    value={grams}
                    onChange={(e) => setGrams(Number(e.target.value) || '')}
                    placeholder="0"
                    style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, background: 'var(--surface)', outline: 'none', color: 'var(--fg)', width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>
              {macroPreview && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 6 }}>
                  {(['kcal', 'prot', 'carb', 'fat'] as const).map((k) => (
                    <div key={k}>
                      <div className="eyebrow" style={{ fontSize: 9 }}>{k === 'kcal' ? 'kcal' : k === 'prot' ? 'prot' : k === 'carb' ? 'carb' : 'gord'}</div>
                      <div className="mono tnum" style={{ fontSize: 14, fontWeight: 600 }}>{macroPreview[k]}{k !== 'kcal' ? 'g' : ''}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mono" style={{ fontSize: 10, color: 'var(--fg-subtle)', letterSpacing: '0.04em' }}>
                * Valores aproximados — o backend calcula os valores finais
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--surface-2)' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={!selected || !grams} onClick={handleAdd} style={{ opacity: selected && grams ? 1 : 0.45 }}>
            <IconPlus size={13} /> Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}