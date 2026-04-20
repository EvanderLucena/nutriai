import { useState } from 'react';
import type { MealSlot, MealOption, MealFood } from '../types/plan';
import { IconPlus, IconDownload, IconCheck, IconX, IconTrash } from '../components/icons';
import { PlanFoodRow, OptionTab, AddFoodModal, EditFoodModal, AddMealModal, ExtrasSection } from '../components/plan';

const INITIAL_MEALS: MealSlot[] = [
  { id: 'cafe', label: 'Café da manhã', time: '07:00', kcal: 380, prot: 26, carb: 28, fat: 16 },
  { id: 'lanche1', label: 'Lanche manhã', time: '10:00', kcal: 210, prot: 8, carb: 28, fat: 8 },
  { id: 'almoco', label: 'Almoço', time: '12:30', kcal: 620, prot: 45, carb: 62, fat: 20 },
  { id: 'lanche2', label: 'Lanche tarde', time: '15:30', kcal: 240, prot: 14, carb: 32, fat: 6 },
  { id: 'jantar', label: 'Jantar', time: '19:30', kcal: 530, prot: 36, carb: 42, fat: 22 },
  { id: 'ceia', label: 'Ceia', time: '22:00', kcal: 220, prot: 16, carb: 14, fat: 10 },
];

const INITIAL_OPTIONS: MealOption[] = [
  { name: 'Opção 1 · Clássico', items: [
    { food: 'Frango grelhado', qty: '150g', prep: 'grelhado, sem óleo', kcal: 248, prot: 46, carb: 0, fat: 6 },
    { food: 'Arroz integral', qty: '4 col. sopa', prep: 'cozido', kcal: 165, prot: 4, carb: 35, fat: 1 },
    { food: 'Feijão carioca', qty: '1 concha', prep: 'cozido', kcal: 76, prot: 5, carb: 14, fat: 0 },
    { food: 'Salada verde', qty: 'à vontade', prep: 'crua, azeite 1 col.', kcal: 90, prot: 2, carb: 6, fat: 7 },
    { food: 'Azeite extra-virgem', qty: '1 col. chá', prep: '-', kcal: 40, prot: 0, carb: 0, fat: 5 },
  ]},
  { name: 'Opção 2 · Peixe', items: [
    { food: 'Salmão', qty: '130g', prep: 'assado', kcal: 290, prot: 32, carb: 0, fat: 18 },
    { food: 'Batata-doce', qty: '180g', prep: 'cozida', kcal: 155, prot: 3, carb: 36, fat: 0 },
    { food: 'Brócolis refogado', qty: '1 xícara', prep: 'refogado com alho', kcal: 55, prot: 4, carb: 8, fat: 1 },
    { food: 'Azeite extra-virgem', qty: '1 col. chá', prep: '-', kcal: 40, prot: 0, carb: 0, fat: 5 },
  ]},
  { name: 'Opção 3 · Vegetariano', items: [
    { food: 'Tofu grelhado', qty: '150g', prep: 'temperado, grelhado', kcal: 180, prot: 20, carb: 4, fat: 10 },
    { food: 'Quinoa', qty: '1/2 xícara', prep: 'cozida', kcal: 120, prot: 4, carb: 22, fat: 2 },
    { food: 'Legumes assados', qty: '1 prato', prep: 'abobrinha, cenoura, beterraba', kcal: 110, prot: 4, carb: 20, fat: 2 },
    { food: 'Castanhas-do-pará', qty: '3 unidades', prep: '-', kcal: 95, prot: 2, carb: 2, fat: 9 },
  ]},
];

interface ExtraItem {
  name: string;
  qty: string;
  category: string;
  kcal: number | string;
  prot: number | string;
  carb: number | string;
  fat: number | string;
  note: string;
}

const INITIAL_EXTRAS: ExtraItem[] = [
  { name: 'Cerveja Ultra', qty: '350ml · lata', category: 'Bebida alcoólica', kcal: 99, prot: 4, carb: 2, fat: 0, note: 'Se paciente reportar consumo à noite, IA orienta hidratação extra e ajuste do lanche seguinte.' },
  { name: 'Chocolate 70% cacau', qty: '20g · 2 quadradinhos', category: 'Doce/sobremesa', kcal: 108, prot: 2, carb: 8, fat: 8, note: 'Opção aprovada como sobremesa ocasional. IA contabiliza no total diário.' },
  { name: 'Açaí puro', qty: '200g · pequeno', category: 'Sobremesa/lanche', kcal: 120, prot: 1, carb: 10, fat: 7, note: 'Sem granola nem xarope. IA sugere combinar com banana no lugar do açúcar.' },
  { name: 'Pizza muçarela', qty: '1 fatia · 110g', category: 'Refeição social', kcal: 265, prot: 11, carb: 30, fat: 10, note: 'Se paciente avisar jantar fora, IA orienta máx. 2 fatias + salada.' },
  { name: 'Vinho tinto seco', qty: '150ml · 1 taça', category: 'Bebida alcoólica', kcal: 125, prot: 0, carb: 4, fat: 0, note: 'Até 2× na semana. IA reforça água entre taças.' },
];

function DailyMacro({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 82 }}>
      <div className="eyebrow">{label}</div>
      <div className="mono tnum" style={{ fontSize: 22, fontWeight: 500, color, letterSpacing: '-0.02em', marginTop: 2 }}>{value}</div>
      {sub && <div className="mono" style={{ fontSize: 10, color: 'var(--fg-subtle)' }}>{sub}</div>}
    </div>
  );
}

function TotalCell({ label, actual, target, unit = '', color }: { label: string; actual: number; target: number; unit?: string; color?: string }) {
  const pct = actual / target;
  const ok = pct >= 0.9 && pct <= 1.1;
  return (
    <div>
      <div className="eyebrow">{label} · {target}{unit}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 3 }}>
        <div className="mono tnum" style={{ fontSize: 18, fontWeight: 500, color: color || 'var(--fg)' }}>{actual}{unit}</div>
        <div className="mono tnum" style={{ fontSize: 11, color: ok ? 'var(--sage-dim)' : 'var(--amber)' }}>
          {pct >= 1 ? '+' : ''}{Math.round((pct - 1) * 100)}%
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

export function PlansView() {
  const [selectedMeal, setSelectedMeal] = useState('almoco');
  const [selectedOption, setSelectedOption] = useState(0);
  const [section, setSection] = useState<'meals' | 'extras'>('meals');
  const [dirty, setDirty] = useState(false);
  const [planTitle, setPlanTitle] = useState('Hipertrofia com manutenção de % gordura');
  const [editingTitle, setEditingTitle] = useState(false);
  const [meals, setMeals] = useState(INITIAL_MEALS);
  const [options, setOptions] = useState(INITIAL_OPTIONS);
  const [addFoodOpen, setAddFoodOpen] = useState(false);
  const [addMealOpen, setAddMealOpen] = useState(false);
  const [extras, setExtras] = useState(INITIAL_EXTRAS);
  const [newFoodOpen, setNewFoodOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ optIdx: number; itemIdx: number; name: string } | null>(null);
  const [pendingMealId, setPendingMealId] = useState<string | null>(null);

  const markDirty = () => setDirty(true);

  const updateItem = (optIdx: number, itemIdx: number, key: keyof MealFood, val: string) => {
    setOptions((opts) =>
      opts.map((o, oi) =>
        oi !== optIdx
          ? o
          : { ...o, items: o.items.map((it, ii) => ii !== itemIdx ? it : { ...it, [key]: ['food', 'qty', 'prep'].includes(key) ? val : (Number(val) || 0) }) },
      ),
    );
    markDirty();
  };

  const removeItem = (optIdx: number, itemIdx: number) => {
    setOptions((opts) => opts.map((o, oi) => oi !== optIdx ? o : { ...o, items: o.items.filter((_, ii) => ii !== itemIdx) }));
    markDirty();
  };

  const addItem = (optIdx: number, item: MealFood) => {
    setOptions((opts) => opts.map((o, oi) => oi !== optIdx ? o : { ...o, items: [...o.items, item] }));
    markDirty();
  };

  const addNewOption = () => {
    const currentOpt = options[selectedOption] || options[0];
    const newOpt: MealOption = { name: `Opção ${options.length + 1} · Cópia`, items: currentOpt.items.map((it) => ({ ...it })) };
    setOptions((opts) => [...opts, newOpt]);
    setSelectedOption(options.length);
    markDirty();
  };

  const removeOption = (optIdx: number) => {
    if (options.length <= 1) return;
    setOptions((opts) => opts.filter((_, i) => i !== optIdx));
    setSelectedOption((prev) => Math.min(prev, options.length - 2));
    markDirty();
  };

  const updateOptionName = (optIdx: number, name: string) => {
    setOptions((opts) => opts.map((o, oi) => oi !== optIdx ? o : { ...o, name }));
    markDirty();
  };

  const addMeal = (meal: MealSlot) => {
    setMeals((ms) => [...ms, meal]);
    setSelectedMeal(meal.id);
    markDirty();
  };

  const removeMeal = (mealId: string) => {
    if (meals.length <= 1) return;
    const filtered = meals.filter((m) => m.id !== mealId);
    setMeals(filtered);
    if (selectedMeal === mealId) {
      setSelectedMeal(filtered[0]?.id || meals[0].id);
    }
    markDirty();
  };

  const exportPDF = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const doc = win.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title></title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Georgia,serif;font-size:13px;color:#111;padding:40px 48px;max-width:720px;margin:0 auto}h1{font-size:24px;font-weight:normal;margin-bottom:4px}.meta{font-size:11px;color:#888;margin-bottom:32px;font-family:-apple-system,sans-serif}.meal{margin-bottom:28px;break-inside:avoid}.meal-header{display:flex;align-items:baseline;gap:10px;border-bottom:1.5px solid #111;padding-bottom:6px;margin-bottom:10px}.meal-label{font-size:15px;font-weight:bold}.meal-time{font-size:11px;color:#888;font-family:monospace}.option{margin-bottom:10px}.option-name{font-size:10px;text-transform:uppercase;letter-spacing:0.07em;color:#999;margin-bottom:5px;font-family:-apple-system,sans-serif}ul{list-style:none;padding-left:0;display:flex;flex-direction:column;gap:4px}li{font-size:13px;padding-left:12px;position:relative}li::before{content:"·";position:absolute;left:0;color:#aaa}.prep{color:#888;font-style:italic;font-size:12px}@media print{body{padding:20px 24px}}</style></head><body></body></html>`);
    doc.close();

    const h1 = doc.createElement('h1');
    h1.textContent = planTitle;
    doc.body.appendChild(h1);

    const meta = doc.createElement('div');
    meta.className = 'meta';
    meta.textContent = `Ana Beatriz L. · ${new Date().toLocaleDateString('pt-BR')} · NutriAI`;
    doc.body.appendChild(meta);

    meals.forEach((m) => {
      const mealDiv = doc.createElement('div');
      mealDiv.className = 'meal';
      const header = doc.createElement('div');
      header.className = 'meal-header';
      const label = doc.createElement('span');
      label.className = 'meal-label';
      label.textContent = m.label;
      const time = doc.createElement('span');
      time.className = 'meal-time';
      time.textContent = m.time;
      header.appendChild(label);
      header.appendChild(time);
      mealDiv.appendChild(header);

      options.forEach((o) => {
        if (!o.items.length) return;
        const optDiv = doc.createElement('div');
        optDiv.className = 'option';
        const optName = doc.createElement('div');
        optName.className = 'option-name';
        optName.textContent = o.name;
        optDiv.appendChild(optName);
        const ul = doc.createElement('ul');
        o.items.forEach((it) => {
          const li = doc.createElement('li');
          const strong = doc.createElement('strong');
          strong.textContent = it.food;
          li.appendChild(strong);
          if (it.qty) li.appendChild(doc.createTextNode(` · ${it.qty}`));
          if (it.prep && it.prep !== '-') {
            const prepSpan = doc.createElement('span');
            prepSpan.className = 'prep';
            prepSpan.textContent = `(${it.prep})`;
            li.appendChild(doc.createTextNode(' '));
            li.appendChild(prepSpan);
          }
          ul.appendChild(li);
        });
        optDiv.appendChild(ul);
        mealDiv.appendChild(optDiv);
      });

      doc.body.appendChild(mealDiv);
    });

    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const activeMeal = meals.find((m) => m.id === selectedMeal) || meals[2];
  const activeOptIdx = selectedOption;
  const activeOpt = options[selectedOption] || options[0];
  const optTotals = activeOpt.items.reduce(
    (a, x) => ({
      kcal: a.kcal + (Number(x.kcal) || 0),
      prot: a.prot + (Number(x.prot) || 0),
      carb: a.carb + (Number(x.carb) || 0),
      fat: a.fat + (Number(x.fat) || 0),
    }),
    { kcal: 0, prot: 0, carb: 0, fat: 0 },
  );

  return (
    <div>
      <div style={{ padding: '20px 28px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className="eyebrow">PLANO ATUAL</div>
            {editingTitle ? (
              <input
                autoFocus
                value={planTitle}
                onChange={(e) => { setPlanTitle(e.target.value); setDirty(true); }}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
                className="serif"
                style={{ fontSize: 24, margin: '4px 0 4px', fontWeight: 400, letterSpacing: '-0.01em', background: 'transparent', border: 'none', borderBottom: '1px solid var(--fg)', padding: '0 0 2px', color: 'var(--fg)', outline: 'none', width: '100%', maxWidth: 400 }}
              />
            ) : (
              <h2 onClick={() => setEditingTitle(true)} className="serif" style={{ fontSize: 24, margin: '4px 0 4px', fontWeight: 400, letterSpacing: '-0.01em', cursor: 'text' }} title="Clique para renomear">
                {planTitle}
              </h2>
            )}
            <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Criado 04 abr 2026 · próxima revisão 25 abr</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" onClick={exportPDF}><IconDownload size={13} /> Exportar PDF</button>
            <button className="btn btn-primary" onClick={() => setDirty(false)} disabled={!dirty} style={{ opacity: dirty ? 1 : 0.55 }}><IconCheck size={13} /> Salvar</button>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.04em', color: dirty ? 'var(--amber)' : 'var(--fg-subtle)' }}>
              {dirty ? 'NÃO SALVO' : 'SALVO'}
            </div>
          </div>
        </div>

        <div className="plans-macros-row" style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
          <DailyMacro label="Kcal · meta" value="2200" color="var(--ink-contrast)" />
          <DailyMacro label="Proteína" value="140g" sub="0.9g/kg magra" color="var(--sage)" />
          <DailyMacro label="Carboidrato" value="250g" sub="45% VET" color="var(--amber)" />
          <DailyMacro label="Gordura" value="70g" sub="30% VET" color="var(--sky)" />
        </div>

        <div style={{ marginTop: 16, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 6, fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.5, display: 'flex', gap: 10 }}>
          <span className="mono" style={{ color: 'var(--lime-dim)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>OBSERVAÇÕES</span>
          <span>Evitar lactose. Preferir proteína magra à noite. Carne vermelha máx 2×/semana.</span>
        </div>

        <div style={{ marginTop: 14, display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: -17 }}>
          {([
            { k: 'meals' as const, label: 'Refeições do plano' },
            { k: 'extras' as const, label: 'Opções extras · sem horário' },
          ]).map((t) => (
            <button
              key={t.k}
              onClick={() => setSection(t.k)}
              style={{
                padding: '10px 14px', fontSize: 13,
                color: section === t.k ? 'var(--fg)' : 'var(--fg-muted)',
                fontWeight: section === t.k ? 600 : 400,
                borderBottom: section === t.k ? '2px solid var(--fg)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {section === 'extras' ? (
        <ExtrasSection extras={extras} setExtras={setExtras} />
      ) : (
        <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: 620 }}>
          <div style={{ borderRight: '1px solid var(--border)', padding: '16px 14px' }}>
            <div className="eyebrow" style={{ padding: '0 6px 10px' }}>ESTRUTURA DO DIA</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {meals.map((m) => {
                const active = selectedMeal === m.id;
                const canRemove = meals.length > 1;
                return (
                  <div key={m.id}>
                    <button
                      onClick={() => { setSelectedMeal(m.id); setSelectedOption(0); }}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 6,
                        border: active ? '1px solid var(--fg)' : '1px solid transparent',
                        background: active ? 'var(--surface)' : 'transparent',
                        textAlign: 'left', transition: 'all 0.12s', width: '100%',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: active ? 600 : 500 }}>{m.label}</span>
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="mono tnum" style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.time}</span>
                          {canRemove && (
                             <button
                               onClick={(e) => { e.stopPropagation(); setPendingMealId(m.id); }}
                               style={{ color: 'var(--fg-subtle)', border: 'none', background: 'none', cursor: 'pointer', padding: 2, lineHeight: 0 }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--coral)')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--fg-subtle)')}
                            >
                              <IconX size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 10, fontSize: 10.5, color: 'var(--fg-muted)' }} className="mono tnum">
                        <span>{m.kcal}kcal</span>
                        <span>P{m.prot}</span>
                        <span>C{m.carb}</span>
                        <span>G{m.fat}</span>
                      </div>
                    </button>
                  </div>
                );
              })}
              <button onClick={() => setAddMealOpen(true)} style={{ padding: '10px 14px', borderRadius: 6, border: '1px dashed var(--border-2)', color: 'var(--fg-muted)', background: 'transparent', cursor: 'pointer', fontSize: 13, marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <IconPlus size={13} /> Adicionar refeição
              </button>
            </div>
          </div>

          <div style={{ padding: '20px 24px', background: 'var(--bg)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div className="eyebrow">EDITANDO · {activeMeal.label.toUpperCase()} · {activeMeal.time}</div>
                <h2 className="serif" style={{ fontSize: 26, margin: '4px 0 0', fontWeight: 400, letterSpacing: '-0.02em' }}>
                  {options.length} opções equivalentes
                </h2>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
              {options.map((o, i) => (
                <OptionTab key={i} name={o.name} active={selectedOption === i} onClick={() => setSelectedOption(i)} onRename={(name) => updateOptionName(i, name)} onRemove={options.length > 1 ? () => removeOption(i) : null} />
              ))}
              <button onClick={addNewOption} style={{ padding: '7px 12px', borderRadius: 6, border: '1px dashed var(--border-2)', background: 'transparent', color: 'var(--fg-muted)', fontSize: 12.5 }}>
                <IconPlus size={12} style={{ verticalAlign: '-2px' }} /> Nova opção
              </button>
            </div>

            <div className="card">
              <div className="plans-food-table" style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1.8fr 0.8fr 0.8fr 0.9fr 0.8fr 28px', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                {['Alimento', 'Quantidade', 'Preparo', 'Kcal', 'Prot', 'Carb', 'Gord', ''].map((h, i) => (
                  <div key={i} className="eyebrow" style={{ fontSize: 10, textAlign: i >= 3 && i <= 6 ? 'right' : 'left' }}>{h}</div>
                ))}
              </div>
              {activeOpt.items.map((it, i) => (
                <PlanFoodRow key={i} item={it} isLast={i === activeOpt.items.length - 1} onChange={(key, val) => updateItem(activeOptIdx, i, key, val)} onRemove={() => setPendingDelete({ optIdx: activeOptIdx, itemIdx: i, name: it.food })} />
              ))}
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', gap: 16 }}>
                <button onClick={() => setAddFoodOpen(true)} style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                  <IconPlus size={12} style={{ verticalAlign: '-2px' }} /> Adicionar Alimento
                </button>
                <button onClick={() => setNewFoodOpen(true)} style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>
                  <IconPlus size={12} style={{ verticalAlign: '-2px' }} /> Novo alimento
                </button>
              </div>
            </div>

            <div className="plans-totals-grid" style={{ marginTop: 16, padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 16, alignItems: 'center' }}>
              <div>
                <div className="eyebrow">TOTAL DA OPÇÃO</div>
                <div className="serif" style={{ fontSize: 18, letterSpacing: '-0.01em', marginTop: 2 }}>{activeOpt.name}</div>
              </div>
              <TotalCell label="Kcal" actual={optTotals.kcal} target={activeMeal.kcal} />
              <TotalCell label="Proteína" actual={optTotals.prot} target={activeMeal.prot} unit="g" color="var(--sage)" />
              <TotalCell label="Carboidrato" actual={optTotals.carb} target={activeMeal.carb} unit="g" color="var(--amber)" />
              <TotalCell label="Gordura" actual={optTotals.fat} target={activeMeal.fat} unit="g" color="var(--sky)" />
            </div>
          </div>
        </div>
      )}

      {addFoodOpen && <AddFoodModal onClose={() => setAddFoodOpen(false)} onAdd={(item) => { addItem(activeOptIdx, item); setAddFoodOpen(false); }} />}
      {addMealOpen && <AddMealModal onClose={() => setAddMealOpen(false)} onAdd={(meal) => { addMeal(meal); setAddMealOpen(false); }} />}
      {newFoodOpen && <EditFoodModal item={{ food: '', qty: '', prep: '-', kcal: 0, prot: 0, carb: 0, fat: 0 }} onClose={() => setNewFoodOpen(false)} onSave={(newItem) => { addItem(activeOptIdx, newItem); setNewFoodOpen(false); markDirty(); }} />}
      {pendingDelete && (
        <DeleteConfirmModal
          name={pendingDelete.name}
          onClose={() => setPendingDelete(null)}
          onConfirm={() => { removeItem(pendingDelete.optIdx, pendingDelete.itemIdx); setPendingDelete(null); }}
        />
      )}
      {pendingMealId && (
        <DeleteConfirmModal
          name={meals.find(m => m.id === pendingMealId)?.label || 'esta refeição'}
          onClose={() => setPendingMealId(null)}
          onConfirm={() => { if (pendingMealId) removeMeal(pendingMealId); setPendingMealId(null); }}
        />
      )}
    </div>
  );
}