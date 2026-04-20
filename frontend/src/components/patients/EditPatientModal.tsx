import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { Patient } from '../../types/patient';

const OBJECTIVES = ['Emagrecimento', 'Hipertrofia', 'Manutenção', 'Recomposição corporal', 'Saúde geral', 'Controle glicêmico', 'Controle pressão', 'Performance esportiva', 'Reeducação alimentar'];

interface EditPatientModalProps {
  patient: Patient;
  open: boolean;
  onClose: () => void;
  onSave?: (id: string, data: Partial<Patient>) => void;
}

export function EditPatientModal({ patient, open, onClose, onSave }: EditPatientModalProps) {
  const [form, setForm] = useState({
    name: patient.name,
    objective: patient.objective,
    phone: '',
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onSave?.(patient.id, { name: form.name, objective: form.objective });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Editar paciente">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Nome completo" value={form.name} onChange={(e) => set('name', e.target.value)} />

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
            {OBJECTIVES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <Input label="WhatsApp" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" disabled={!form.name.trim()} onClick={handleSubmit}>Salvar alterações</Button>
      </div>
    </Modal>
  );
}