import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { OBJECTIVE_LABELS, OBJECTIVE_KEYS, REVERSE_OBJECTIVE_LABELS } from '../../types/patient';
import type { Patient, ObjectiveOption } from '../../types/patient';
import { useUpdatePatient } from '../../stores/patientStore';
import { useToastStore } from '../../stores/toastStore';
import type { UpdatePatientRequest } from '../../api/patients';

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

interface EditPatientModalProps {
  patient: Patient;
  open: boolean;
  onClose: () => void;
}

export function EditPatientModal({ patient, open, onClose }: EditPatientModalProps) {
  const updateMutation = useUpdatePatient();
  const [form, setForm] = useState({
    name: patient.name,
    objective: (REVERSE_OBJECTIVE_LABELS[patient.objective] ?? patient.objective) as ObjectiveOption,
    birthDate: patient.birthDate ?? '',
    sex: patient.sex || 'F',
    heightCm: patient.heightCm != null ? String(patient.heightCm) : '',
    whatsapp: formatPhone(patient.whatsapp ?? ''),
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    const updateData: UpdatePatientRequest = {
      name: form.name.trim(),
      objective: form.objective,
      ...(form.birthDate ? { birthDate: form.birthDate } : {}),
      sex: form.sex,
      ...(form.heightCm ? { heightCm: Number(form.heightCm) } : {}),
      ...(stripPhone(form.whatsapp) ? { whatsapp: stripPhone(form.whatsapp) } : {}),
    };
    updateMutation.mutate(
      { id: patient.id, data: updateData },
      {
        onSuccess: () => {
          useToastStore.getState().showSuccess('Paciente atualizado com sucesso');
          onClose();
        },
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title="Editar paciente">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Nome completo" value={form.name} onChange={(e) => set('name', e.target.value)} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Input label="Data de nascimento" type="date" value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label className="eyebrow">Sexo</label>
            <div className="seg" style={{ height: 36 }}>
              <button className={form.sex === 'F' ? 'active' : ''} onClick={() => set('sex', 'F')}>Feminino</button>
              <button className={form.sex === 'M' ? 'active' : ''} onClick={() => set('sex', 'M')}>Masculino</button>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Input label="Altura (cm)" placeholder="168" value={form.heightCm} onChange={(e) => set('heightCm', e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label className="eyebrow">Objetivo</label>
            <select
              value={form.objective}
              onChange={(e) => set('objective', e.target.value)}
              style={{
                padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6,
                fontSize: 13, background: 'var(--surface)', color: 'var(--fg)', fontFamily: 'var(--font-ui)',
                width: '100%',
              }}
            >
              {OBJECTIVE_KEYS.map(o => <option key={o} value={o}>{OBJECTIVE_LABELS[o]}</option>)}
            </select>
          </div>
        </div>

        <div className="divider"><span>Contato</span></div>

        <div className="flex flex-col gap-1.5">
          <label className="eyebrow">WhatsApp</label>
          <input
            value={form.whatsapp}
            onChange={(e) => set('whatsapp', formatPhone(stripPhone(e.target.value)))}
            type="tel"
            placeholder="(11) 99999-9999"
            style={{
              padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6,
              fontSize: 13, background: 'var(--surface)', color: 'var(--fg)', fontFamily: 'var(--font-mono)',
              width: '100%', boxSizing: 'border-box', outline: 'none',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--fg-muted)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" disabled={!form.name.trim() || updateMutation.isPending} onClick={handleSubmit}>
          {updateMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </div>
    </Modal>
  );
}