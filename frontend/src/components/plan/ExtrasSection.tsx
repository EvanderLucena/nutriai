import { IconPlus, IconX, IconSparkle } from '../icons';

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

interface ExtrasSectionProps {
  extras: ExtraItem[];
  setExtras: React.Dispatch<React.SetStateAction<ExtraItem[]>>;
}

export function ExtrasSection({ extras, setExtras }: ExtrasSectionProps) {
  const update = (i: number, key: keyof ExtraItem, val: string) =>
    setExtras((ex) =>
      ex.map((e, idx) =>
        idx !== i ? e : { ...e, [key]: ['name', 'qty', 'category', 'note'].includes(key) ? val : (Number(val) || 0) },
      ),
    );

  const remove = (i: number) => setExtras((ex) => ex.filter((_, idx) => idx !== i));

  const addBlank = () =>
    setExtras((ex) => [...ex, { name: '', qty: '', category: '', kcal: 0, prot: 0, carb: 0, fat: 0, note: '' }]);

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
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 0.7fr 0.8fr 0.9fr 0.8fr 28px', gap: 8, padding: '8px 20px', borderBottom: '1px solid var(--border)' }}>
          {['Item', 'Porção', 'Categoria', 'Kcal', 'Prot', 'Carb', 'Gord', ''].map((h, i) => (
            <div key={i} className="eyebrow" style={{ fontSize: 10, textAlign: i >= 3 && i <= 6 ? 'right' : 'left' }}>{h}</div>
          ))}
        </div>
        {extras.map((e, i) => {
          const inp = (key: keyof ExtraItem, color: string, mono: boolean, align?: React.CSSProperties['textAlign']) => (
            <input
              value={String(e[key])}
              onChange={(ev) => update(i, key, ev.target.value)}
              style={{
                padding: '3px 6px', border: '1px solid transparent', borderRadius: 5, fontSize: 12.5,
                background: 'transparent', outline: 'none', color, width: '100%',
                fontFamily: mono ? 'var(--font-mono)' : 'var(--font-ui)',
                textAlign: align || 'left',
              }}
              onFocus={(ev) => (ev.target.style.borderColor = 'var(--border)')}
              onBlur={(ev) => (ev.target.style.borderColor = 'transparent')}
            />
          );
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 0.7fr 0.8fr 0.9fr 0.8fr 28px', gap: 8, padding: '5px 20px', borderBottom: i === extras.length - 1 ? 'none' : '1px solid var(--border)', alignItems: 'center' }}>
              {inp('name', 'var(--fg)', false)}
              {inp('qty', 'var(--fg-muted)', true)}
              {inp('category', 'var(--fg-muted)', false)}
              {inp('kcal', 'var(--fg)', true, 'right')}
              {inp('prot', 'var(--sage-dim)', true, 'right')}
              {inp('carb', 'var(--carb)', true, 'right')}
              {inp('fat', 'var(--sky)', true, 'right')}
              <button
                onClick={() => remove(i)}
                style={{ color: 'var(--fg-subtle)', padding: 4 }}
                onMouseEnter={(ev) => (ev.currentTarget.style.color = 'var(--coral)')}
                onMouseLeave={(ev) => (ev.currentTarget.style.color = 'var(--fg-subtle)')}
              >
                <IconX size={12} />
              </button>
            </div>
          );
        })}
        <div style={{ padding: '12px 20px', background: 'var(--surface-2)', borderTop: '1px solid var(--border)' }}>
          <button onClick={addBlank} style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>
            <IconPlus size={12} style={{ verticalAlign: '-2px' }} /> Adicionar Opção Extra
          </button>
        </div>
      </div>
    </div>
  );
}