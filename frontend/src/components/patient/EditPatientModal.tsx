import { useState } from 'react';
import type { DetailedPatient } from '../../types/patient';
import { IconX, IconCheck } from '../icons';

interface EditPatientModalProps {
  patient: DetailedPatient;
  onClose: () => void;
  onSave: (updated: Partial<DetailedPatient>) => void;
}

export function EditPatientModal({ patient, onClose, onSave }: EditPatientModalProps) {
  const [name, setName] = useState(patient.name);
  const [age, setAge] = useState(String(patient.age));
  const [sex, setSex] = useState(patient.sex || 'F');
  const [height, setHeight] = useState(String(patient.height));
  const [objective, setObjective] = useState(patient.objective);
  const [whatsapp, setWhatsapp] = useState('');

  const handle = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      initials: name
        .trim()
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0].toUpperCase())
        .slice(0, 2)
        .join(''),
      age: Number(age) || patient.age,
      sex,
      height: Number(height) || patient.height,
      objective: objective.trim(),
    });
  };

  const field = (label: string, val: string, set: (v: string) => void, opts: { type?: string; mono?: boolean; placeholder?: string } = {}) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div className="eyebrow">{label}</div>
      <input
        value={val}
        onChange={(e) => set(e.target.value)}
        type={opts.type || 'text'}
        placeholder={opts.placeholder || ''}
        style={{
          padding: '8px 10px',
          border: '1px solid var(--border)',
          borderRadius: 6,
          fontSize: 13,
          background: 'var(--surface)',
          outline: 'none',
          color: 'var(--fg)',
          width: '100%',
          boxSizing: 'border-box',
          fontFamily: opts.mono ? 'var(--font-mono)' : 'var(--font-ui)',
        }}
        onFocus={(e) => (e.target.style.borderColor = 'var(--fg-muted)')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
      />
    </div>
  );

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(11,12,10,0.4)', zIndex: 200, display: 'grid', placeItems: 'center', padding: 20 }}
      onClick={onClose}
    >
      <div className="card" style={{ width: 'min(480px, 100%)', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }} onClick={(e) => e.stopPropagation()}>
        <div className="card-h">
          <div className="title">Editar paciente</div>
          <div className="spacer" />
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '4px 6px' }}>
            <IconX size={14} />
          </button>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {field('Nome completo', name, setName, { placeholder: 'Ana Beatriz Lopes' })}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {field('Idade', age, setAge, { type: 'number', mono: true, placeholder: '34' })}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div className="eyebrow">Sexo</div>
              <div className="seg" style={{ height: 36 }}>
                <button className={sex === 'F' ? 'active' : ''} onClick={() => setSex('F')}>
                  Feminino
                </button>
                <button className={sex === 'M' ? 'active' : ''} onClick={() => setSex('M')}>
                  Masculino
                </button>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {field('Altura (cm)', height, setHeight, { type: 'number', mono: true, placeholder: '168' })}
            {field('WhatsApp', whatsapp, setWhatsapp, { placeholder: '+55 11 9 0000-0000' })}
          </div>
          {field('Objetivo clínico', objective, setObjective, { placeholder: 'Hipertrofia com manutenção de % gordura' })}
        </div>
        <div
          style={{
            padding: '12px 20px',
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
          <button className="btn btn-primary" onClick={handle} disabled={!name.trim()} style={{ opacity: name.trim() ? 1 : 0.45 }}>
            <IconCheck size={13} /> Salvar
          </button>
        </div>
      </div>
    </div>
  );
}