import { IconPlus, IconX, IconSparkle } from '../icons';
import type { PlanExtra } from '../../types/plan';

interface ExtrasSectionProps {
  extras: PlanExtra[];
  onUpdateExtra: (extraId: string, data: { name?: string; quantity?: string; kcal?: number; prot?: number; carb?: number; fat?: number }) => void;
  onAddExtra: () => void;
  onDeleteExtra: (extraId: string) => void;
}

export function ExtrasSection({ extras, onUpdateExtra, onAddExtra, onDeleteExtra }: ExtrasSectionProps) {
  const inp = (extraId: string, key: 'name' | 'quantity' | 'kcal' | 'prot' | 'carb' | 'fat', value: string | number, color: string, mono: boolean, align?: React.CSSProperties['textAlign']) => (
    <input
      value={String(value)}
      onChange={(ev) => {
        const isNameOrQty = key === 'name' || key === 'quantity';
        const numVal = Number(ev.target.value) || 0;
        onUpdateExtra(extraId, { [key]: isNameOrQty ? ev.target.value : numVal });
      }}
      onBlur={(ev) => (ev.target.style.borderColor = 'transparent')}
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
          <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.7fr 0.8fr 0.9fr 0.8fr 28px', gap: 8, padding: '5px 20px', borderBottom: e.id === extras[extras.length - 1].id ? 'none' : '1px solid var(--border)', alignItems: 'center' }}>
            {inp(e.id, 'name', e.name, 'var(--fg)', false)}
            {inp(e.id, 'quantity', e.quantity, 'var(--fg-muted)', true)}
            {inp(e.id, 'kcal', e.kcal, 'var(--fg)', true, 'right')}
            {inp(e.id, 'prot', e.prot, 'var(--sage-dim)', true, 'right')}
            {inp(e.id, 'carb', e.carb, 'var(--carb)', true, 'right')}
            {inp(e.id, 'fat', e.fat, 'var(--sky)', true, 'right')}
            <button
              onClick={() => onDeleteExtra(e.id)}
              style={{ color: 'var(--fg-subtle)', padding: 4 }}
              onMouseEnter={(ev) => (ev.currentTarget.style.color = 'var(--coral)')}
              onMouseLeave={(ev) => (ev.currentTarget.style.color = 'var(--fg-subtle)')}
            >
              <IconX size={12} />
            </button>
          </div>
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