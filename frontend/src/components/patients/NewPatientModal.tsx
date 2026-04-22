import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { OBJECTIVE_LABELS, OBJECTIVE_KEYS } from '../../types/patient';
import type { ObjectiveOption } from '../../types/patient';

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

interface NewPatientModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: (data: {
    name: string;
    objective: ObjectiveOption;
    birthDate?: string;
    sex?: string;
    heightCm?: number;
    whatsapp?: string;
  }) => void;
}

export function NewPatientModal({ open, onClose, onSave }: NewPatientModalProps) {
  const [form, setForm] = useState({
    name: '',
    objective: '' as ObjectiveOption | '',
    birthDate: '',
    sex: 'F' as 'F' | 'M',
    heightCm: '',
    whatsapp: '',
    notes: '',
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.name.trim() || !form.objective) return;
    onSave?.({
      name: form.name,
      objective: form.objective as ObjectiveOption,
      ...(form.birthDate ? { birthDate: form.birthDate } : {}),
      sex: form.sex,
      ...(form.heightCm ? { heightCm: Number(form.heightCm) } : {}),
      ...(stripPhone(form.whatsapp) ? { whatsapp: stripPhone(form.whatsapp) } : {}),
    });
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
              <option value="">Selecione…</option>
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