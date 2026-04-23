import { useState, useEffect, useRef, useCallback } from 'react';
import { FOOD_CATEGORIES, FOOD_CATEGORY_LABELS, FOOD_UNIT_KEYS, FOOD_UNIT_LABELS, FOOD_UNIT_SYMBOLS, REVERSE_CATEGORY_LABELS } from '../types/food';
import type { Food, FoodCategory, FoodCategoryKey, FoodUnit } from '../types/food';
import { useFoodUIStore, useFoodCatalog, useCreateFood, useUpdateFood, useDeleteFood } from '../stores/foodStore';
import { IconSearch, IconPlus, IconEdit, IconDots, IconX, IconCheck, IconTrash } from '../components/icons';

function MiniMacro({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 9.5, color: 'var(--fg-subtle)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
      <div className="mono tnum" style={{ fontSize: 14, fontWeight: 500, color: color || 'var(--fg)', letterSpacing: '-0.01em' }}>{value}</div>
    </div>
  );
}

function FoodMenuDropdown({ onEdit, onDelete, onClose }: { onEdit: () => void; onDelete: () => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position: 'absolute', right: 0, top: '100%', zIndex: 50,
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 140, padding: '4px 0',
    }}>
      <button onClick={() => { onEdit(); onClose(); }} style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px',
        border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--fg)',
        textAlign: 'left', fontFamily: 'var(--font-ui)',
      }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
      >
        <IconEdit size={13} /> Editar
      </button>
      <button onClick={() => { onDelete(); onClose(); }} style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px',
        border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--coral)',
        textAlign: 'left', fontFamily: 'var(--font-ui)',
      }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
      >
        <IconTrash size={13} /> Excluir
      </button>
    </div>
  );
}

function EditFoodCatalogModal({ food, onClose }: { food: Food; onClose: () => void }) {
  const [name, setName] = useState(food.name);
  const [category, setCategory] = useState<FoodCategoryKey>(
    REVERSE_CATEGORY_LABELS[food.category] || (food.category as FoodCategoryKey)
  );
  const [unit, setUnit] = useState<FoodUnit>(food.unit);
  const [referenceAmount, setReferenceAmount] = useState(String(food.referenceAmount));
  const [kcal, setKcal] = useState(String(food.kcal));
  const [prot, setProt] = useState(String(food.prot));
  const [carb, setCarb] = useState(String(food.carb));
  const [fat, setFat] = useState(String(food.fat));
  const [fiber, setFiber] = useState(String(food.fiber));
  const [prep, setPrep] = useState(food.prep);
  const updateFood = useUpdateFood();

  const handle = () => {
    if (!name.trim()) return;
    updateFood.mutate({
      id: food.id,
      data: {
        name: name.trim(),
        category,
        unit,
        referenceAmount: Number(referenceAmount) || 0,
        kcal: Number(kcal) || 0,
        prot: Number(prot) || 0,
        carb: Number(carb) || 0,
        fat: Number(fat) || 0,
        fiber: Number(fiber) || 0,
        prep: prep || null,
      },
    });
    onClose();
  };

  const field = (label: string, val: string, set: (v: string) => void, opts: { mono?: boolean; type?: string; placeholder?: string } = {}) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div className="eyebrow">{label}</div>
      <input
        value={val}
        onChange={(e) => set(e.target.value)}
        type={opts.type || 'text'}
        placeholder={opts.placeholder || ''}
        style={{
          padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13,
          background: 'var(--surface)', outline: 'none', color: 'var(--fg)', width: '100%', boxSizing: 'border-box',
          fontFamily: opts.mono ? 'var(--font-mono)' : 'var(--font-ui)',
        }}
        onFocus={(e) => (e.target.style.borderColor = 'var(--fg-muted)')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
      />
    </div>
  );

  const unitSymbol = FOOD_UNIT_SYMBOLS[unit];
  const refLabel = unit === 'UNIDADE' ? 'unidade' : unit === 'ML' ? 'ml' : 'g';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,12,10,0.4)', zIndex: 200, display: 'grid', placeItems: 'center', padding: 20 }} onClick={onClose}>
      <div className="card" style={{ width: 'min(520px, 100%)', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }} onClick={(e) => e.stopPropagation()}>
        <div className="card-h">
          <div className="title">Editar alimento</div>
          <div className="spacer" />
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '4px 6px' }}><IconX size={14} /></button>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {field('Nome', name, setName)}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div className="eyebrow">Categoria</div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FoodCategoryKey)}
                style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, background: 'var(--surface)', color: 'var(--fg)', width: '100%' }}
              >
                {FOOD_CATEGORIES.filter((c) => c !== 'Todos').map((c) => <option key={c} value={c}>{FOOD_CATEGORY_LABELS[c as FoodCategoryKey]}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div className="eyebrow">Unidade</div>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as FoodUnit)}
                style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, background: 'var(--surface)', color: 'var(--fg)', width: '100%' }}
              >
                {FOOD_UNIT_KEYS.map((u) => <option key={u} value={u}>{FOOD_UNIT_LABELS[u]}</option>)}
              </select>
            </div>
            {field(`Referência (${refLabel})`, referenceAmount, setReferenceAmount, { mono: true })}
          </div>
          <div className="divider"><span>Valores por {referenceAmount || '?'}{unitSymbol}</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {field('Kcal', kcal, setKcal, { mono: true })}
            {field('Prot (g)', prot, setProt, { mono: true })}
            {field('Carb (g)', carb, setCarb, { mono: true })}
            {field('Gord (g)', fat, setFat, { mono: true })}
          </div>
          {field('Fibra (g)', fiber, setFiber, { mono: true })}
          {field('Preparo sugerido', prep, setPrep, { placeholder: 'ex: grelhado, cozido no vapor' })}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--surface-2)' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handle} disabled={!name.trim()} style={{ opacity: name.trim() ? 1 : 0.45 }}>
            <IconCheck size={13} /> Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ name, onClose, onConfirm }: { name: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,12,10,0.4)', zIndex: 200, display: 'grid', placeItems: 'center', padding: 20 }} onClick={onClose}>
      <div className="card" style={{ width: 'min(400px, 100%)', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '20px 24px' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>Excluir alimento</h3>
          <p style={{ fontSize: 13.5, color: 'var(--fg-muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
            Tem certeza que deseja excluir <strong style={{ color: 'var(--fg)' }}>{name}</strong>? Esta ação não pode ser desfeita.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn" style={{ background: 'var(--coral)', color: '#fff', borderColor: 'transparent' }} onClick={onConfirm}>
              <IconTrash size={13} /> Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: '60%', height: 14, background: 'var(--surface-2)', borderRadius: 4, marginBottom: 8, animation: 'pulse 1.5s infinite' }} />
        <div style={{ width: '40%', height: 12, background: 'var(--surface-2)', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
      </div>
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ height: 28, background: 'var(--surface-2)', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FoodCard({ food, onEdit, onDelete }: { food: Food; onEdit: () => void; onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const unitSymbol = FOOD_UNIT_SYMBOLS[food.unit];
  const refLabel = food.unit === 'UNIDADE' ? 'unidade' : food.unit === 'ML' ? 'ml' : 'g';
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--fg-subtle)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{food.category}</div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.005em' }}>{food.name}</div>
          {food.prep && <div className="mono" style={{ fontSize: 10, color: 'var(--fg-subtle)', marginTop: 2 }}>{food.prep}</div>}
        </div>
        <div style={{ position: 'relative' }}>
          <button style={{ color: 'var(--fg-subtle)' }} onClick={() => setMenuOpen((v) => !v)}><IconDots size={14} /></button>
          {menuOpen && <FoodMenuDropdown onEdit={onEdit} onDelete={onDelete} onClose={() => setMenuOpen(false)} />}
        </div>
      </div>
      <div style={{ padding: '12px 16px' }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>por {food.referenceAmount}{unitSymbol} ({refLabel})</div>
        <div className="foods-foods-macros-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          <MiniMacro label="Kcal" value={food.kcal} />
          <MiniMacro label="Prot" value={`${food.prot}g`} color="var(--sage-dim)" />
          <MiniMacro label="Carb" value={`${food.carb}g`} color="var(--carb)" />
          <MiniMacro label="Gord" value={`${food.fat}g`} color="var(--sky)" />
        </div>
      </div>
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)', marginTop: 'auto' }}>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-subtle)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>usado em {food.used} planos</div>
        <button className="btn btn-ghost" style={{ fontSize: 11.5, padding: '3px 6px', color: 'var(--fg-muted)' }} onClick={onEdit}><IconEdit size={11} /> Editar</button>
      </div>
    </div>
  );
}

function FoodsPagination({ page, pages, total, pageSize, onChange }: { page: number; pages: number; total: number; pageSize: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', marginTop: 8, borderTop: '1px solid var(--border)' }}>
      <div className="mono" style={{ fontSize: 11.5, color: 'var(--fg-subtle)', letterSpacing: '0.04em' }}>
        {from}–{to} <span style={{ color: 'var(--fg-muted)' }}>de</span> {total}
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button className="btn btn-ghost" disabled={page === 0} onClick={() => onChange(page - 1)} style={{ padding: '4px 8px', opacity: page === 0 ? 0.35 : 1 }}>←</button>
        {Array.from({ length: pages }, (_, i) => (
          <button key={i} onClick={() => onChange(i)} style={{ width: 28, height: 28, borderRadius: 5, fontSize: 12, background: i === page ? 'var(--surface-2)' : 'transparent', border: i === page ? '1px solid var(--border)' : '1px solid transparent', color: i === page ? 'var(--fg)' : 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
            {i + 1}
          </button>
        ))}
        <button className="btn btn-ghost" disabled={page === pages - 1} onClick={() => onChange(page + 1)} style={{ padding: '4px 8px', opacity: page === pages - 1 ? 0.35 : 1 }}>→</button>
      </div>
    </div>
  );
}

function CreateFoodModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<FoodCategoryKey>('PROTEINA');
  const [unit, setUnit] = useState<FoodUnit>('GRAMAS');
  const [referenceAmount, setReferenceAmount] = useState('');
  const [kcal, setKcal] = useState('');
  const [prot, setProt] = useState('');
  const [carb, setCarb] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [prep, setPrep] = useState('');
  const [portionLabel, setPortionLabel] = useState('');
  const createFood = useCreateFood();

  const handle = () => {
    if (!name.trim()) return;
    createFood.mutate({
      name: name.trim(),
      category,
      unit,
      referenceAmount: Number(referenceAmount) || 0,
      kcal: Number(kcal) || 0,
      prot: Number(prot) || 0,
      carb: Number(carb) || 0,
      fat: Number(fat) || 0,
      fiber: Number(fiber) || 0,
      prep: prep || null,
      portionLabel: portionLabel || null,
    });
    onClose();
  };

  const field = (label: string, val: string, set: (v: string) => void, opts: { mono?: boolean; placeholder?: string } = {}) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div className="eyebrow">{label}</div>
      <input
        placeholder={opts.placeholder || ''}
        value={val}
        onChange={(e) => set(e.target.value)}
        style={{
          padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13,
          background: 'var(--surface)', outline: 'none', color: 'var(--fg)', width: '100%', boxSizing: 'border-box',
          fontFamily: opts.mono ? 'var(--font-mono)' : 'var(--font-ui)',
        }}
        onFocus={(e) => (e.target.style.borderColor = 'var(--fg-muted)')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
      />
    </div>
  );

  const unitSymbol = FOOD_UNIT_SYMBOLS[unit];
  const refLabel = unit === 'UNIDADE' ? 'unidade' : unit === 'ML' ? 'ml' : 'g';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,12,10,0.4)', zIndex: 200, display: 'grid', placeItems: 'center', padding: 20 }} onClick={onClose}>
      <div className="card" style={{ width: 'min(520px, 100%)', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }} onClick={(e) => e.stopPropagation()}>
        <div className="card-h">
          <div className="title">Novo alimento</div>
          <div className="spacer" />
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '4px 6px' }}><IconX size={14} /></button>
        </div>
        <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {field('Nome do alimento', name, setName, { placeholder: 'ex: Frango desfiado' })}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div className="eyebrow">Categoria</div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FoodCategoryKey)}
                style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, background: 'var(--surface)', color: 'var(--fg)', width: '100%' }}
              >
                {FOOD_CATEGORIES.filter((c) => c !== 'Todos').map((c) => <option key={c} value={c}>{FOOD_CATEGORY_LABELS[c as FoodCategoryKey]}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div className="eyebrow">Unidade</div>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as FoodUnit)}
                style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, background: 'var(--surface)', color: 'var(--fg)', width: '100%' }}
              >
                {FOOD_UNIT_KEYS.map((u) => <option key={u} value={u}>{FOOD_UNIT_LABELS[u]}</option>)}
              </select>
            </div>
          </div>
          {field(`Referência (${refLabel})`, referenceAmount, setReferenceAmount, { mono: true, placeholder: unit === 'GRAMAS' ? '100' : '1' })}
          <div className="divider"><span>Valores por {referenceAmount || '?'}{unitSymbol}</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {field('Kcal', kcal, setKcal, { mono: true, placeholder: '0' })}
            {field('Proteína (g)', prot, setProt, { mono: true, placeholder: '0' })}
            {field('Carboidrato (g)', carb, setCarb, { mono: true, placeholder: '0' })}
            {field('Gordura (g)', fat, setFat, { mono: true, placeholder: '0' })}
          </div>
          {field('Fibra (g)', fiber, setFiber, { mono: true, placeholder: '0' })}
          {field('Preparo sugerido', prep, setPrep, { placeholder: 'ex: grelhado, cozido no vapor' })}
          {field('Descrição da porção', portionLabel, setPortionLabel, { placeholder: 'ex: 1 unidade · 100g' })}
        </div>
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--surface-2)' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handle} disabled={!name.trim()} style={{ opacity: name.trim() ? 1 : 0.45 }}>
            <IconCheck size={13} /> Salvar no catálogo
          </button>
        </div>
      </div>
    </div>
  );
}

export function FoodsView() {
  const { searchQuery, categoryFilter, currentPage, pageSize, setSearchQuery, setCategoryFilter, setCurrentPage, createModalOpen, setCreateModalOpen, editingFoodId, setEditingFoodId } = useFoodUIStore();
  const { data, isLoading } = useFoodCatalog();
  const deleteFood = useDeleteFood();
  const [deletingFood, setDeletingFood] = useState<Food | null>(null);

  // Debounced search: 300ms
  const [localQ, setLocalQ] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = useCallback((val: string) => {
    setLocalQ(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(val);
    }, 300);
  }, [setSearchQuery]);
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const foods = data?.content ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;
  const total = data?.total ?? 0;

  const editingFood = editingFoodId ? foods.find((f) => f.id === editingFoodId) ?? null : null;

  const handleConfirmDelete = () => {
    if (deletingFood) {
      deleteFood.mutate(deletingFood.id);
      setDeletingFood(null);
    }
  };

  return (
    <div>
      <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid var(--border)' }}>
        <div>
          <div className="eyebrow">Catálogo pessoal · reutilizável nos planos</div>
          <h1 className="serif" style={{ fontSize: 32, margin: '4px 0 6px', fontWeight: 400, letterSpacing: '-0.02em' }}>Alimentos</h1>
        </div>
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div className="search" style={{ margin: 0, flex: 1, maxWidth: 320 }}>
            <IconSearch size={13} />
            <input placeholder="Buscar no catálogo…" value={localQ} onChange={(e) => handleSearch(e.target.value)} />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as FoodCategory)}
            style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg)', fontSize: 12.5, fontFamily: 'var(--font-ui)' }}
          >
            {FOOD_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === 'Todos' ? 'Todos' : FOOD_CATEGORY_LABELS[c as FoodCategoryKey]}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={() => setCreateModalOpen(true)}><IconPlus size={13} /> Novo alimento</button>
        </div>
      </div>

      <div style={{ padding: '20px 28px 40px' }}>
        <div className="foods-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            foods.map((f) => (
              <FoodCard key={f.id} food={f} onEdit={() => setEditingFoodId(f.id)} onDelete={() => setDeletingFood(f)} />
            ))
          )}
          {!isLoading && foods.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: 'var(--fg-subtle)', fontSize: 13 }}>
              Nenhum alimento encontrado.
            </div>
          )}
        </div>
        <FoodsPagination page={currentPage} pages={totalPages} total={total} pageSize={pageSize} onChange={setCurrentPage} />
      </div>

      {createModalOpen && <CreateFoodModal onClose={() => setCreateModalOpen(false)} />}
      {editingFood && <EditFoodCatalogModal food={editingFood} onClose={() => setEditingFoodId(null)} />}
      {deletingFood && <DeleteConfirmModal name={deletingFood.name} onClose={() => setDeletingFood(null)} onConfirm={handleConfirmDelete} />}
    </div>
  );
}