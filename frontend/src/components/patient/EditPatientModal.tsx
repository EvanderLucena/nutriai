import { useState } from 'react';
import { useUpdatePatient } from '../../stores/patientStore';
import { useToastStore } from '../../stores/toastStore';
import type { Patient, ObjectiveOption } from '../../types/patient';
import { OBJECTIVE_LABELS, OBJECTIVE_KEYS, REVERSE_OBJECTIVE_LABELS } from '../../types/patient';
import { IconX, IconCheck } from '../icons';

interface EditPatientModalProps {
  patient: Patient;
  onClose: () => void;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

function stripPhone(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11);
}

export function EditPatientModal({ patient, onClose }: EditPatientModalProps) {
  const updateMutation = useUpdatePatient();
  const [name, setName] = useState(patient.name);
  const [birthDate, setBirthDate] = useState(patient.birthDate ?? '');
  const [sex, setSex] = useState(patient.sex || 'F');
  const [heightCm, setHeightCm] = useState(patient.heightCm != null ? String(patient.heightCm) : '');
  const [whatsapp, setWhatsapp] = useState(formatPhone(patient.whatsapp ?? ''));
  const [objective, setObjective] = useState<ObjectiveOption>(
    (REVERSE_OBJECTIVE_LABELS[patient.objective] ?? patient.objective) as ObjectiveOption
  );

  const handle = () => {
    if (!name.trim()) return;
    updateMutation.mutate(
      {
        id: patient.id,
        data: {
          name: name.trim(),
          ...(birthDate ? { birthDate } : {}),
          sex,
          ...(heightCm ? { heightCm: Number(heightCm) } : {}),
          ...(stripPhone(whatsapp) ? { whatsapp: stripPhone(whatsapp) } : {}),
          objective,
        },
      },
      {
        onSuccess: () => {
          useToastStore.getState().showSuccess('Paciente atualizado com sucesso');
          onClose();
        },
      },
    );
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
            {field('Data de nascimento', birthDate, setBirthDate, { type: 'date' })}
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
            {field('Altura (cm)', heightCm, setHeightCm, { type: 'number', mono: true, placeholder: '168' })}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div className="eyebrow">WhatsApp</div>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(formatPhone(stripPhone(e.target.value)))}
                type="tel"
                placeholder="(11) 99999-9999"
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
                  fontFamily: 'var(--font-mono)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--fg-muted)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div className="eyebrow">Objetivo clínico</div>
            <select
              value={objective}
              onChange={(e) => setObjective(e.target.value as ObjectiveOption)}
              style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, background: 'var(--surface)', color: 'var(--fg)', width: '100%' }}
            >
              {OBJECTIVE_KEYS.map(o => <option key={o} value={o}>{OBJECTIVE_LABELS[o]}</option>)}
            </select>
          </div>
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
          <button className="btn btn-primary" onClick={handle} disabled={!name.trim() || updateMutation.isPending} style={{ opacity: name.trim() ? 1 : 0.45 }}>
            <IconCheck size={13} /> Salvar
          </button>
        </div>
      </div>
    </div>
  );
}