import { IconPlus, IconX } from '../icons';

const SKINFOLDS = ['Peitoral', 'Axilar médio', 'Tríceps', 'Subescapular', 'Abdominal', 'Suprailíaco', 'Coxa'];
const PERIMETRY = ['Cintura', 'Abdômen', 'Quadril', 'Braço D', 'Braço E', 'Coxa D', 'Coxa E', 'Panturrilha D'];

interface NewBiometryModalProps {
  onClose: () => void;
}

export function NewBiometryModal({ onClose }: NewBiometryModalProps) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(11,12,10,0.45)', zIndex: 200, display: 'grid', placeItems: 'center', padding: 20 }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: 'min(680px, 100%)', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-h">
          <div className="title">Nova avaliação biométrica</div>
          <div className="spacer" />
          <div style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>Preencha só o que tiver disponível</div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '4px 6px', marginLeft: 8 }}>
            <IconX size={14} />
          </button>
        </div>

        <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <BioField label="Data da avaliação" type="date" />
            <BioField label="Peso (kg)" placeholder="64.2" mono />
          </div>

          <div className="divider">
            <span>Bioimpedância · opcional</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            <BioField label="% Gordura" placeholder="22.8" mono />
            <BioField label="Massa magra (kg)" placeholder="49.8" mono />
            <BioField label="% Água" placeholder="54.2" mono />
            <BioField label="Gordura visceral · nível" placeholder="6" mono />
            <BioField label="TMB (kcal)" placeholder="1420" mono />
            <BioField label="Aparelho / marca" placeholder="ex: Tanita BC-601" />
          </div>

          <div className="divider">
            <span>Dobras cutâneas · mm · opcional</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {SKINFOLDS.map((f) => (
              <BioField key={f} label={f} placeholder="—" mono />
            ))}
          </div>
          <div
            style={{
              padding: '10px 12px',
              background: 'var(--surface-2)',
              borderRadius: 6,
              fontSize: 11.5,
              color: 'var(--fg-muted)',
              lineHeight: 1.5,
            }}
          >
            <span className="mono" style={{ color: 'var(--fg-subtle)', marginRight: 6, fontSize: 10 }}>
              FÓRMULA
            </span>
            Se todas as 7 dobras forem preenchidas, % gordura é calculado por Jackson &amp; Pollock (1978) + Siri.
          </div>

          <div className="divider">
            <span>Perimetria · cm · opcional</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {PERIMETRY.map((f) => (
              <BioField key={f} label={f} placeholder="—" mono />
            ))}
          </div>

          <BioField label="Observações · opcional" kind="textarea" placeholder="ex: paciente em jejum, avaliação pós-treino" />
        </div>

        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            background: 'var(--surface-2)',
          }}
        >
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            <IconPlus size={13} /> Registrar avaliação
          </button>
        </div>
      </div>
    </div>
  );
}

function BioField({ label, placeholder, type, kind, mono }: { label: string; placeholder?: string; type?: string; kind?: string; mono?: boolean }) {
  const style: React.CSSProperties = {
    padding: '8px 10px',
    border: '1px solid var(--border)',
    borderRadius: 6,
    fontSize: 13,
    background: 'var(--surface)',
    outline: 'none',
    width: '100%',
    color: 'var(--fg)',
    fontFamily: mono ? 'var(--font-mono)' : 'var(--font-ui)',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div className="eyebrow">{label}</div>
      {kind === 'textarea' ? (
        <textarea placeholder={placeholder} rows={2} style={{ ...style, resize: 'vertical', fontFamily: 'var(--font-ui)' }} />
      ) : (
        <input type={type || 'text'} placeholder={placeholder} style={style} />
      )}
    </div>
  );
}