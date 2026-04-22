import { useState } from 'react';
import { IconPlus, IconDownload, IconX, IconTrash } from '../components/icons';
import { PlanFoodRow, OptionTab, AddFoodModal, AddMealModal, ExtrasSection, SaveStatusIndicator } from '../components/plan';
import { Toast } from '../components/ui/Toast';
import {
  usePlan,
  usePlanUIStore,
  useUpdatePlan,
  useAddMealSlot,
  useDeleteMealSlot,
  useAddOption,
  useAddFoodItem,
  useUpdateFoodItem,
  useDeleteFoodItem,
  useAddExtra,
  useUpdateExtra,
  useDeleteExtra,
} from '../stores/planStore';

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
  const pct = target > 0 ? actual / target : 0;
  const ok = pct >= 0.9 && pct <= 1.1;
  return (
    <div>
      <div className="eyebrow">{label} · {target}{unit}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 3 }}>
        <div className="mono tnum" style={{ fontSize: 18, fontWeight: 500, color: color || 'var(--fg)' }}>{actual}{unit}</div>
        {target > 0 && (
          <div className="mono tnum" style={{ fontSize: 11, color: ok ? 'var(--sage-dim)' : 'var(--amber)' }}>
            {pct >= 1 ? '+' : ''}{Math.round((pct - 1) * 100)}%
          </div>
        )}
      </div>
    </div>
  );
}

function DeleteConfirmModal({ name, onClose, onConfirm }: { name: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,12,10,0.4)', zIndex: 200, display: 'grid', placeItems: 'center', padding: 20 }} onClick={onClose}>
      <div className="card" style={{ width: 'min(400px, 100%)', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '20px 24px' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>Excluir</h3>
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

function SkeletonPlan() {
  return (
    <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: 620 }}>
      <div style={{ borderRight: '1px solid var(--border)', padding: '16px 14px' }}>
        <div style={{ padding: '0 6px 10px' }}>
          <div style={{ width: 100, height: 10, background: 'var(--surface-2)', borderRadius: 3 }} />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ padding: '12px 14px', borderRadius: 6, marginBottom: 4 }}>
            <div style={{ width: '60%', height: 13, background: 'var(--surface-2)', borderRadius: 3, marginBottom: 6 }} />
            <div style={{ width: '40%', height: 11, background: 'var(--surface-2)', borderRadius: 3 }} />
          </div>
        ))}
      </div>
      <div style={{ padding: '20px 24px', background: 'var(--bg)' }}>
        <div style={{ width: 200, height: 26, background: 'var(--surface-2)', borderRadius: 4, marginBottom: 18 }} />
        <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ width: 120, height: 32, background: 'var(--surface-2)', borderRadius: 6 }} />
          ))}
        </div>
        <div className="card">
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1.8fr 0.8fr 0.8fr 0.9fr 0.8fr 28px', gap: 10 }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} style={{ height: 10, background: 'var(--surface-2)', borderRadius: 2 }} />
            ))}
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr 1.8fr 0.8fr 0.8fr 0.9fr 0.8fr 28px', gap: 10 }}>
              {Array.from({ length: 9 }).map((_, j) => (
                <div key={j} style={{ height: 14, background: 'var(--surface-2)', borderRadius: 3 }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface PlansViewProps {
  patientId: string;
}

export function PlansView({ patientId }: PlansViewProps) {
  const { data: plan, isLoading } = usePlan(patientId);
  const planUI = usePlanUIStore();
  const activeMealId = planUI.activeMealId;
  const activeOptionIndex = planUI.activeOptionIndex;
  const addFoodModalOpen = planUI.addFoodModalOpen;
  const addMealModalOpen = planUI.addMealModalOpen;
  const pendingDeleteMealIds = planUI.pendingDeleteMealId;
  const pendingDeleteItemData = planUI.pendingDeleteItem;
  const saveStatus = planUI.saveStatus;
  const [section, setSection] = useState<'meals' | 'extras'>('meals');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');

  const updatePlan = useUpdatePlan(patientId);
  const addMealSlot = useAddMealSlot(patientId);
  const deleteMealSlot = useDeleteMealSlot(patientId);
  const addOption = useAddOption(patientId);
  const addFoodItem = useAddFoodItem(patientId);
  const updateFoodItem = useUpdateFoodItem(patientId);
  const deleteFoodItem = useDeleteFoodItem(patientId);
  const addExtra = useAddExtra(patientId);
  const updateExtra = useUpdateExtra(patientId);
  const deleteExtra = useDeleteExtra(patientId);

  // Track previous save status to detect error transitions
  const prevSaveStatus = useState(saveStatus);
  if (saveStatus === 'error' && prevSaveStatus[0] !== 'error') {
    // Toast will show automatically via saveStatus === 'error'
  }
  prevSaveStatus[0] = saveStatus;

  const meals = plan?.meals ?? [];
  const extras = plan?.extras ?? [];

  const activeMeal = meals.find((m) => m.id === activeMealId) ?? meals[0];
  const activeOptIdx = activeOptionIndex;
  const activeOpt = activeMeal?.options[activeOptIdx] ?? activeMeal?.options[0];

  const optTotals = activeOpt?.items.reduce(
    (a, x) => ({
      kcal: a.kcal + (Number(x.kcal) || 0),
      prot: a.prot + (Number(x.prot) || 0),
      carb: a.carb + (Number(x.carb) || 0),
      fat: a.fat + (Number(x.fat) || 0),
    }),
    { kcal: 0, prot: 0, carb: 0, fat: 0 },
  ) ?? { kcal: 0, prot: 0, carb: 0, fat: 0 };

  // Set initial activeMealId when plan loads
  if (plan && meals.length > 0 && !activeMealId) {
    planUI.setActiveMealId(meals[0].id);
  }

  const handleTitleBlur = () => {
    setEditingTitle(false);
    if (plan && titleValue.trim() && titleValue !== plan.title) {
      updatePlan.mutate({ title: titleValue.trim() });
    }
  };

  const handleDeleteFoodItem = () => {
    if (pendingDeleteItemData) {
      deleteFoodItem.mutate({
        mealId: pendingDeleteItemData.mealId,
        optionId: pendingDeleteItemData.optionId,
        itemId: pendingDeleteItemData.itemId,
      });
      planUI.setPendingDeleteItem(null);
    }
  };

  const handleDeleteMeal = () => {
    if (pendingDeleteMealIds) {
      deleteMealSlot.mutate(pendingDeleteMealIds);
      planUI.setPendingDeleteMealId(null);
    }
  };

  const handleAddExtra = () => {
    addExtra.mutate({ name: '', quantity: '' });
  };

  const exportPDF = () => {
    if (!plan || !activeMeal) return;
    const win = window.open('', '_blank');
    if (!win) return;
    const doc = win.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title></title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Georgia,serif;font-size:13px;color:#111;padding:40px 48px;max-width:720px;margin:0 auto}h1{font-size:24px;font-weight:normal;margin-bottom:4px}.meta{font-size:11px;color:#888;margin-bottom:32px;font-family:-apple-system,sans-serif}.meal{margin-bottom:28px;break-inside:avoid}.meal-header{display:flex;align-items:baseline;gap:10px;border-bottom:1.5px solid #111;padding-bottom:6px;margin-bottom:10px}.meal-label{font-size:15px;font-weight:bold}.meal-time{font-size:11px;color:#888;font-family:monospace}.option{margin-bottom:10px}.option-name{font-size:10px;text-transform:uppercase;letter-spacing:0.07em;color:#999;margin-bottom:5px;font-family:-apple-system,sans-serif}ul{list-style:none;padding-left:0;display:flex;flex-direction:column;gap:4px}li{font-size:13px;padding-left:12px;position:relative}li::before{content:"·";position:absolute;left:0;color:#aaa}.prep{color:#888;font-style:italic;font-size:12px}@media print{body{padding:20px 24px}}</style></head><body></body></html>`);
    doc.close();

    const h1 = doc.createElement('h1');
    h1.textContent = plan.title || 'Plano alimentar';
    doc.body.appendChild(h1);

    const meta = doc.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${new Date().toLocaleDateString('pt-BR')} · NutriAI`;
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

      m.options.forEach((o) => {
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
          strong.textContent = it.foodName;
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

  if (isLoading || !plan) {
    return <SkeletonPlan />;
  }

  return (
    <div>
      <div style={{ padding: '20px 28px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className="eyebrow">PLANO ATUAL</div>
            {editingTitle ? (
              <input
                autoFocus
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => { if (e.key === 'Enter') handleTitleBlur(); }}
                className="serif"
                style={{ fontSize: 24, margin: '4px 0 4px', fontWeight: 400, letterSpacing: '-0.01em', background: 'transparent', border: 'none', borderBottom: '1px solid var(--fg)', padding: '0 0 2px', color: 'var(--fg)', outline: 'none', width: '100%', maxWidth: 400 }}
              />
            ) : (
              <h2 onClick={() => { setTitleValue(plan.title); setEditingTitle(true); }} className="serif" style={{ fontSize: 24, margin: '4px 0 4px', fontWeight: 400, letterSpacing: '-0.01em', cursor: 'text' }} title="Clique para renomear">
                {plan.title}
              </h2>
            )}
            <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Criado {new Date(plan.createdAt).toLocaleDateString('pt-BR')} · atualizado {new Date(plan.updatedAt).toLocaleDateString('pt-BR')}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" onClick={exportPDF}><IconDownload size={13} /> Exportar PDF</button>
            <SaveStatusIndicator status={saveStatus} />
          </div>
        </div>

        <div className="plans-macros-row" style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
          <DailyMacro label="Kcal · meta" value={`${plan.kcalTarget}`} color="var(--ink-contrast)" />
          <DailyMacro label="Proteína" value={`${plan.protTarget}g`} color="var(--sage)" />
          <DailyMacro label="Carboidrato" value={`${plan.carbTarget}g`} color="var(--amber)" />
          <DailyMacro label="Gordura" value={`${plan.fatTarget}g`} color="var(--sky)" />
        </div>

        <div style={{ marginTop: 16, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 6, fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.5, display: 'flex', gap: 10 }}>
          <span className="mono" style={{ color: 'var(--lime-dim)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>OBSERVAÇÕES</span>
          <span>{plan.notes || 'Sem observações'}</span>
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
        <ExtrasSection
          extras={extras}
          onUpdateExtra={(extraId, data) => updateExtra.mutate({ extraId, data })}
          onAddExtra={handleAddExtra}
          onDeleteExtra={(extraId) => deleteExtra.mutate(extraId)}
        />
      ) : (
        <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: 620 }}>
          <div style={{ borderRight: '1px solid var(--border)', padding: '16px 14px' }}>
            <div className="eyebrow" style={{ padding: '0 6px 10px' }}>ESTRUTURA DO DIA</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {meals.map((m) => {
                const active = activeMeal?.id === m.id;
                const canRemove = meals.length > 1;
                const mTotals = m.options.reduce(
                  (a, opt) => {
                    const optT = opt.items.reduce((s, x) => ({
                      kcal: s.kcal + (Number(x.kcal) || 0),
                      prot: s.prot + (Number(x.prot) || 0),
                      carb: s.carb + (Number(x.carb) || 0),
                      fat: s.fat + (Number(x.fat) || 0),
                    }), { kcal: 0, prot: 0, carb: 0, fat: 0 });
                    return { kcal: a.kcal + optT.kcal, prot: a.prot + optT.prot, carb: a.carb + optT.carb, fat: a.fat + optT.fat };
                  },
                  { kcal: 0, prot: 0, carb: 0, fat: 0 },
                );
                return (
                  <div key={m.id}>
                    <button
                      onClick={() => { planUI.setActiveMealId(m.id); planUI.setActiveOptionIndex(0); }}
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
                              onClick={(e) => { e.stopPropagation(); planUI.setPendingDeleteMealId(m.id); }}
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
                        <span>{mTotals.kcal || 0}kcal</span>
                        <span>P{mTotals.prot || 0}</span>
                        <span>C{mTotals.carb || 0}</span>
                        <span>G{mTotals.fat || 0}</span>
                      </div>
                    </button>
                  </div>
                );
              })}
              <button onClick={() => planUI.setAddMealModalOpen(true)} style={{ padding: '10px 14px', borderRadius: 6, border: '1px dashed var(--border-2)', color: 'var(--fg-muted)', background: 'transparent', cursor: 'pointer', fontSize: 13, marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <IconPlus size={13} /> Adicionar refeição
              </button>
            </div>
          </div>

          {activeMeal && activeOpt && (
            <div style={{ padding: '20px 24px', background: 'var(--bg)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
                <div>
                  <div className="eyebrow">EDITANDO · {activeMeal.label.toUpperCase()} · {activeMeal.time}</div>
                  <h2 className="serif" style={{ fontSize: 26, margin: '4px 0 0', fontWeight: 400, letterSpacing: '-0.02em' }}>
                    {activeMeal.options.length} opções equivalentes
                  </h2>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
                {activeMeal.options.map((o, i) => (
                  <OptionTab
                    key={o.id}
                    name={o.name}
                    active={activeOptIdx === i}
                    onClick={() => planUI.setActiveOptionIndex(i)}
                    onRename={(_name) => {
                      // Double-click rename → update via API
                      // TODO: wire to useUpdateOption when PlanUIStore has mealId context
                    }}
                    onRemove={activeMeal.options.length > 1 ? () => {
                      // Will be wired to useDeleteOption
                    } : null}
                  />
                ))}
                <button
                  onClick={() => addOption.mutate({ mealId: activeMeal.id, data: { name: `Opção ${activeMeal.options.length + 1} · Cópia` } })}
                  style={{ padding: '7px 12px', borderRadius: 6, border: '1px dashed var(--border-2)', background: 'transparent', color: 'var(--fg-muted)', fontSize: 12.5 }}
                >
                  <IconPlus size={12} style={{ verticalAlign: '-2px' }} /> Nova opção
                </button>
              </div>

              <div className="card">
                <div className="plans-food-table" style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 0.8fr 1.8fr 0.8fr 0.8fr 0.9fr 0.8fr 28px', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                  {['Alimento', 'Quantidade', 'Gramas', 'Preparo', 'Kcal', 'Prot', 'Carb', 'Gord', ''].map((h, i) => (
                    <div key={i} className="eyebrow" style={{ fontSize: 10, textAlign: i >= 4 && i <= 7 ? 'right' : 'left' }}>{h}</div>
                  ))}
                </div>
                {activeOpt.items.map((it) => (
                  <PlanFoodRow
                    key={it.id}
                    item={it}
                    isLast={it.id === activeOpt.items[activeOpt.items.length - 1]?.id}
                    onGramsChange={(grams) => updateFoodItem.mutate({ mealId: activeMeal.id, optionId: activeOpt.id, itemId: it.id, data: { grams } })}
                    onQtyChange={(qty) => updateFoodItem.mutate({ mealId: activeMeal.id, optionId: activeOpt.id, itemId: it.id, data: { qty } })}
                    onPrepChange={(prep) => updateFoodItem.mutate({ mealId: activeMeal.id, optionId: activeOpt.id, itemId: it.id, data: { prep } })}
                    onRemove={() => planUI.setPendingDeleteItem({ mealId: activeMeal.id, optionId: activeOpt.id, itemId: it.id, name: it.foodName })}
                  />
                ))}
                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', gap: 16 }}>
                  <button onClick={() => planUI.setAddFoodModalOpen(true)} style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                    <IconPlus size={12} style={{ verticalAlign: '-2px' }} /> Adicionar Alimento
                  </button>
                </div>
              </div>

              <div className="plans-totals-grid" style={{ marginTop: 16, padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 16, alignItems: 'center' }}>
                <div>
                  <div className="eyebrow">TOTAL DA OPÇÃO</div>
                  <div className="serif" style={{ fontSize: 18, letterSpacing: '-0.01em', marginTop: 2 }}>{activeOpt.name}</div>
                </div>
                <TotalCell label="Kcal" actual={optTotals.kcal} target={meals.length > 0 ? Math.round(plan.kcalTarget / meals.length) : 0} />
                <TotalCell label="Proteína" actual={optTotals.prot} target={meals.length > 0 ? Math.round(plan.protTarget / meals.length) : 0} unit="g" color="var(--sage)" />
                <TotalCell label="Carboidrato" actual={optTotals.carb} target={meals.length > 0 ? Math.round(plan.carbTarget / meals.length) : 0} unit="g" color="var(--amber)" />
                <TotalCell label="Gordura" actual={optTotals.fat} target={meals.length > 0 ? Math.round(plan.fatTarget / meals.length) : 0} unit="g" color="var(--sky)" />
              </div>
            </div>
          )}
        </div>
      )}

      {addFoodModalOpen && activeMeal && activeOpt && (
        <AddFoodModal
          onClose={() => planUI.setAddFoodModalOpen(false)}
          onAdd={(data) => {
            addFoodItem.mutate({
              mealId: activeMeal.id,
              optionId: activeOpt.id,
              data: { foodId: data.foodId, grams: data.grams, qty: data.qty },
            });
            planUI.setAddFoodModalOpen(false);
          }}
        />
      )}
      {addMealModalOpen && (
        <AddMealModal
          onClose={() => planUI.setAddMealModalOpen(false)}
          onAdd={(data) => {
            addMealSlot.mutate({ label: data.label, time: data.time });
            planUI.setAddMealModalOpen(false);
          }}
        />
      )}
      {pendingDeleteItemData && (
        <DeleteConfirmModal
          name={pendingDeleteItemData.name}
          onClose={() => planUI.setPendingDeleteItem(null)}
          onConfirm={handleDeleteFoodItem}
        />
      )}
      {pendingDeleteMealIds && (
        <DeleteConfirmModal
          name={meals.find((m) => m.id === pendingDeleteMealIds)?.label || 'esta refeição'}
          onClose={() => planUI.setPendingDeleteMealId(null)}
          onConfirm={handleDeleteMeal}
        />
      )}
      <Toast visible={saveStatus === 'error'} onHide={() => { /* Toast auto-dismisses */ }} />
    </div>
  );
}