import { useState, useEffect } from 'react';
import { IconPlus, IconX, IconSparkle } from '../icons';
import type { PlanExtra } from '../../types/plan';

interface ExtrasSectionProps {
  extras: PlanExtra[];
  onUpdateExtra: (extraId: string, data: { name?: string; quantity?: string; kcal?: number; prot?: number; carb?: number; fat?: number }) => void;
  onAddExtra: () => void;
  onDeleteExtra: (extraId: string) => void;
}

function ExtraRow({ extra, onUpdateExtra, onDeleteExtra }: { extra: PlanExtra; onUpdateExtra: ExtrasSectionProps['onUpdateExtra']; onDeleteExtra: ExtrasSectionProps['onDeleteExtra'] }) {
  const [localName, setLocalName] = useState(extra.name);
  const [localQty, setLocalQty] = useState(extra.quantity);
  const [localKcal, setLocalKcal] = useState(String(extra.kcal));
  const [localProt, setLocalProt] = useState(String(extra.prot));
  const [localCarb, setLocalCarb] = useState(String(extra.carb));
  const [localFat, setLocalFat] = useState(String(extra.fat));

  useEffect(() => {
    setLocalName(extra.name);
    setLocalQty(extra.quantity);
    setLocalKcal(String(extra.kcal));
    setLocalProt(String(extra.prot));
    setLocalCarb(String(extra.carb));
    setLocalFat(String(extra.fat));
  }, [extra]);

  const inp = (localVal: string, setLocal: (v: string) => void, color: string, mono: boolean, align?: React.CSSProperties['textAlign'], onBlurred?: (val: string) => void) => (
    <input
      value={localVal}
      onChange={(ev) => setLocal(ev.target.value)}
      onBlur={(ev) => {
        ev.target.style.borderColor = 'transparent';
        if (onBlurred) onBlurred(ev.target.value);
      }}
      style={{
        padding: '3px 6px', border: '1px solid transparent', borderRadius: 5, fontSize: 12.5,
        background: 'transparent', outline: 'none', color, width: '100%',
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-ui)',
        textAlign: align || 'left',
      }}
      onFocus={(ev) => (ev.target.style.borderColor = 'var(--border)')}
    />
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.7fr 0.8fr 0.9fr 0.8fr 28px', gap: 8, padding: '5px 20px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
      {inp(localName, setLocalName, 'var(--fg)', false, undefined, (v) => { if (v !== extra.name) onUpdateExtra(extra.id, { name: v }); })}
      {inp(localQty, setLocalQty, 'var(--fg-muted)', true, undefined, (v) => { if (v !== extra.quantity) onUpdateExtra(extra.id, { quantity: v }); })}
      {inp(localKcal, setLocalKcal, 'var(--fg)', true, 'right', (v) => { const n = Number(v) || 0; if (n !== extra.kcal) onUpdateExtra(extra.id, { kcal: n }); })}
      {inp(localProt, setLocalProt, 'var(--sage-dim)', true, 'right', (v) => { const n = Number(v) || 0; if (n !== extra.prot) onUpdateExtra(extra.id, { prot: n }); })}
      {inp(localCarb, setLocalCarb, 'var(--carb)', true, 'right', (v) => { const n = Number(v) || 0; if (n !== extra.carb) onUpdateExtra(extra.id, { carb: n }); })}
      {inp(localFat, setLocalFat, 'var(--sky)', true, 'right', (v) => { const n = Number(v) || 0; if (n !== extra.fat) onUpdateExtra(extra.id, { fat: n }); })}
      <button
        onClick={() => onDeleteExtra(extra.id)}
        style={{ color: 'var(--fg-subtle)', padding: 4 }}
        onMouseEnter={(ev) => (ev.currentTarget.style.color = 'var(--coral)')}
        onMouseLeave={(ev) => (ev.currentTarget.style.color = 'var(--fg-subtle)')}
      >
        <IconX size={12} />
      </button>
    </div>
  );
}

export function ExtrasSection({ extras, onUpdateExtra, onAddExtra, onDeleteExtra }: ExtrasSectionProps) {
  return (
    <div style={{ padding: '20px 28px 28px' }}>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <IconSparkle size={14} style={{ color: 'var(--lime-dim)', flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
            Alimentos e bebidas <strong style={{ color: 'var(--fg)' }}>fora do plano estruturado</strong> que você pré-autoriza para a IA orientar
            quando o paciente mencionar. Não têm horário fixo — funcionam como parâmetros de contorno.
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.7fr 0.8fr 0.9fr 0.8fr 28px', gap: 8, padding: '8px 20px', borderBottom: '1px solid var(--border)' }}>
          {['Item', 'Porção', 'Kcal', 'Prot', 'Carb', 'Gord', ''].map((h, i) => (
            <div key={i} className="eyebrow" style={{ fontSize: 10, textAlign: i >= 2 && i <= 5 ? 'right' : 'left' }}>{h}</div>
          ))}
        </div>
        {extras.map((e) => (
          <ExtraRow
            key={e.id}
            extra={e}
            onUpdateExtra={onUpdateExtra}
            onDeleteExtra={onDeleteExtra}
          />
        ))}
        <div style={{ padding: '12px 20px', background: 'var(--surface-2)', borderTop: '1px solid var(--border)' }}>
          <button onClick={onAddExtra} style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>
            <IconPlus size={12} style={{ verticalAlign: '-2px' }} /> Adicionar Opção Extra
          </button>
        </div>
      </div>
    </div>
  );
}