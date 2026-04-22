import { useState } from 'react';
import { IconPlus, IconX } from '../icons';

interface AddMealModalProps {
  onClose: () => void;
  onAdd: (data: { label: string; time: string }) => void;
}

export function AddMealModal({ onClose, onAdd }: AddMealModalProps) {
  const [label, setLabel] = useState('');
  const [time, setTime] = useState('');

  const valid = label.trim() && time;

  const handle = () => {
    if (!valid) return;
    onAdd({ label: label.trim(), time });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,12,10,0.4)', zIndex: 200, display: 'grid', placeItems: 'center', padding: 20 }} onClick={onClose}>
      <div className="card" style={{ width: 'min(420px, 100%)', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }} onClick={(e) => e.stopPropagation()}>
        <div className="card-h">
          <div className="title">Nova refeição</div>
          <div className="spacer" />
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '4px 6px' }}><IconX size={14} /></button>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div className="eyebrow">Nome</div>
              <input autoFocus value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ex: Lanche pré-treino" style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, background: 'var(--surface)', outline: 'none', color: 'var(--fg)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div className="eyebrow">Horário</div>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, background: 'var(--surface)', outline: 'none', color: 'var(--fg)', fontFamily: 'var(--font-mono)' }} />
            </div>
          </div>
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--surface-2)' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={!valid} onClick={handle} style={{ opacity: valid ? 1 : 0.45 }}>
            <IconPlus size={13} /> Criar refeição
          </button>
        </div>
      </div>
    </div>
  );
}