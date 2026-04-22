import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { OBJECTIVE_LABELS, OBJECTIVE_KEYS } from '../../types/patient';
import type { ObjectiveOption } from '../../types/patient';

interface NewPatientModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: (data: { name: string; objective: ObjectiveOption; phone: string }) => void;
}

export function NewPatientModal({ open, onClose, onSave }: NewPatientModalProps) {
  const [form, setForm] = useState({ name: '', objective: '' as ObjectiveOption | '', phone: '', birthDate: '', sex: '', height: '', notes: '' });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.name.trim() || !form.objective) return;
    onSave?.({ name: form.name, objective: form.objective, phone: form.phone });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Novo paciente">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Nome completo" placeholder="ex: Ana Beatriz Lima" value={form.name} onChange={(e) => set('name', e.target.value)} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Input label="Data de nascimento" type="date" value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label className="eyebrow">Sexo</label>
            <select
              value={form.sex}
              onChange={(e) => set('sex', e.target.value)}
              style={{
                padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6,
                fontSize: 13, background: 'var(--surface)', color: 'var(--fg)', fontFamily: 'var(--font-ui)',
                width: '100%',
              }}
            >
              <option value="">Selecione…</option>
              <option value="F">Feminino</option>
              <option value="M">Masculino</option>
              <option value="O">Outro</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Input label="Altura (cm)" placeholder="165" value={form.height} onChange={(e) => set('height', e.target.value)} />
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
              <option value="">Selecione…</option>
              {OBJECTIVE_KEYS.map(o => <option key={o} value={o}>{OBJECTIVE_LABELS[o]}</option>)}
            </select>
          </div>
        </div>

        <div className="divider"><span>Contato</span></div>

        <Input label="WhatsApp" placeholder="+55 11 9 0000-0000" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        <div style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 6, fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
          <span className="mono" style={{ fontSize: 10, color: 'var(--lime-dim)', marginRight: 6 }}>IA</span>
          O paciente vai receber a IA por este número. Certifique que está correto antes de salvar.
        </div>

        <Input label="Observações iniciais · opcional" placeholder="ex: histórico de diabetes, alergia a lactose" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" disabled={!form.name.trim() || !form.objective} onClick={handleSubmit}>Cadastrar paciente</Button>
      </div>
    </Modal>
  );
}