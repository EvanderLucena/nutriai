import { useState } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import type { BiometryAssessmentDTO, CreateBiometryAssessmentRequest } from '../../types/patient';
import { IconPlus, IconX } from '../icons';

const SKINFOLD_KEYS = [
  'peitoral',
  'axilar_medio',
  'triceps',
  'subescapular',
  'abdominal',
  'suprailiaco',
  'coxa',
];
const SKINFOLD_LABELS: Record<string, string> = {
  peitoral: 'Peitoral',
  axilar_medio: 'Axilar médio',
  triceps: 'Tríceps',
  subescapular: 'Subescapular',
  abdominal: 'Abdominal',
  suprailiaco: 'Suprailíaco',
  coxa: 'Coxa',
};

const PERIMETRY_KEYS = [
  'cintura',
  'abdomen',
  'quadril',
  'braco_d',
  'braco_e',
  'coxa_d',
  'coxa_e',
  'panturrilha_d',
];
const PERIMETRY_LABELS: Record<string, string> = {
  cintura: 'Cintura',
  abdomen: 'Abdômen',
  quadril: 'Quadril',
  braco_d: 'Braço D',
  braco_e: 'Braço E',
  coxa_d: 'Coxa D',
  coxa_e: 'Coxa E',
  panturrilha_d: 'Panturrilha D',
};

interface NewBiometryModalProps {
  patientId: string;
  createMutation: UseMutationResult<BiometryAssessmentDTO, Error, CreateBiometryAssessmentRequest>;
  onSuccess: () => void;
  onClose: () => void;
}

export function NewBiometryModal({ createMutation, onSuccess, onClose }: NewBiometryModalProps) {
  const [form, setForm] = useState({
    assessmentDate: new Date().toISOString().slice(0, 10),
    weight: '',
    bodyFatPercent: '',
    leanMassKg: '',
    waterPercent: '',
    visceralFatLevel: '',
    bmrKcal: '',
    device: '',
    notes: '',
  });
  const [skinfoldValues, setSkinfoldValues] = useState<Record<string, string>>({});
  const [perimetryValues, setPerimetryValues] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    const skinfolds = SKINFOLD_KEYS.filter(
      (k) => skinfoldValues[k] && skinfoldValues[k].trim() !== '',
    ).map((k, i) => ({
      measureKey: k,
      valueMm: parseFloat(skinfoldValues[k]),
      sortOrder: i + 1,
    }));

    const perimetry = PERIMETRY_KEYS.filter(
      (k) => perimetryValues[k] && perimetryValues[k].trim() !== '',
    ).map((k, i) => ({
      measureKey: k,
      valueCm: parseFloat(perimetryValues[k]),
      sortOrder: i + 1,
    }));

    const payload: CreateBiometryAssessmentRequest = {
      assessmentDate: form.assessmentDate,
      weight: parseFloat(form.weight),
      bodyFatPercent: form.bodyFatPercent ? parseFloat(form.bodyFatPercent) : null,
      leanMassKg: form.leanMassKg ? parseFloat(form.leanMassKg) : null,
      waterPercent: form.waterPercent ? parseFloat(form.waterPercent) : null,
      visceralFatLevel: form.visceralFatLevel ? parseInt(form.visceralFatLevel, 10) : null,
      bmrKcal: form.bmrKcal ? parseInt(form.bmrKcal, 10) : null,
      device: form.device || null,
      notes: form.notes || null,
      skinfolds: skinfolds.length > 0 ? skinfolds : undefined,
      perimetry: perimetry.length > 0 ? perimetry : undefined,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        onSuccess();
      },
    });
  };

  const isSubmitting = createMutation.isPending;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(11,12,10,0.45)',
        zIndex: 200,
        display: 'grid',
        placeItems: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: 'min(680px, 100%)',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-h">
          <div className="title">Nova avaliação biométrica</div>
          <div className="spacer" />
          <div style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>
            Preencha só o que tiver disponível
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '4px 6px', marginLeft: 8 }}
          >
            <IconX size={14} />
          </button>
        </div>

        <div
          style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <BioField
              label="Data da avaliação"
              type="date"
              value={form.assessmentDate}
              onChange={(v) => set('assessmentDate', v)}
            />
            <BioField
              label="Peso (kg)"
              placeholder="64.2"
              mono
              value={form.weight}
              onChange={(v) => set('weight', v)}
            />
          </div>

          <div className="divider">
            <span>Bioimpedância · opcional</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            <BioField
              label="% Gordura"
              placeholder="22.8"
              mono
              value={form.bodyFatPercent}
              onChange={(v) => set('bodyFatPercent', v)}
            />
            <BioField
              label="Massa magra (kg)"
              placeholder="49.8"
              mono
              value={form.leanMassKg}
              onChange={(v) => set('leanMassKg', v)}
            />
            <BioField
              label="% Água"
              placeholder="54.2"
              mono
              value={form.waterPercent}
              onChange={(v) => set('waterPercent', v)}
            />
            <BioField
              label="Gordura visceral · nível"
              placeholder="6"
              mono
              value={form.visceralFatLevel}
              onChange={(v) => set('visceralFatLevel', v)}
            />
            <BioField
              label="TMB (kcal)"
              placeholder="1420"
              mono
              value={form.bmrKcal}
              onChange={(v) => set('bmrKcal', v)}
            />
            <BioField
              label="Aparelho / marca"
              placeholder="ex: Tanita BC-601"
              value={form.device}
              onChange={(v) => set('device', v)}
            />
          </div>

          <div className="divider">
            <span>Dobras cutâneas · mm · opcional</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {SKINFOLD_KEYS.map((k) => (
              <BioField
                key={k}
                label={SKINFOLD_LABELS[k]}
                placeholder="—"
                mono
                value={skinfoldValues[k] ?? ''}
                onChange={(v) => setSkinfoldValues((prev) => ({ ...prev, [k]: v }))}
              />
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
            <span
              className="mono"
              style={{ color: 'var(--fg-subtle)', marginRight: 6, fontSize: 10 }}
            >
              FÓRMULA
            </span>
            Se todas as 7 dobras forem preenchidas, % gordura é calculado por Jackson &amp; Pollock
            (1978) + Siri.
          </div>

          <div className="divider">
            <span>Perimetria · cm · opcional</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {PERIMETRY_KEYS.map((k) => (
              <BioField
                key={k}
                label={PERIMETRY_LABELS[k]}
                placeholder="—"
                mono
                value={perimetryValues[k] ?? ''}
                onChange={(v) => setPerimetryValues((prev) => ({ ...prev, [k]: v }))}
              />
            ))}
          </div>

          <BioField
            label="Observações · opcional"
            kind="textarea"
            placeholder="ex: paciente em jejum, avaliação pós-treino"
            value={form.notes}
            onChange={(v) => set('notes', v)}
          />

          {createMutation.isError && (
            <div
              style={{
                padding: '10px 12px',
                background: 'rgba(255,107,74,0.1)',
                borderRadius: 6,
                fontSize: 13,
                color: 'var(--coral)',
              }}
            >
              Erro ao salvar avaliação — verifique os dados e tente novamente.
            </div>
          )}
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
          <button className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!form.assessmentDate || !form.weight || isSubmitting}
            style={{ opacity: !form.assessmentDate || !form.weight || isSubmitting ? 0.5 : 1 }}
          >
            <IconPlus size={13} /> {isSubmitting ? 'Salvando...' : 'Registrar avaliação'}
          </button>
        </div>
      </div>
    </div>
  );
}

function BioField({
  label,
  placeholder,
  type,
  kind,
  mono,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  kind?: string;
  mono?: boolean;
  value?: string;
  onChange?: (v: string) => void;
}) {
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
        <textarea
          placeholder={placeholder}
          rows={2}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          style={{ ...style, resize: 'vertical', fontFamily: 'var(--font-ui)' }}
        />
      ) : (
        <input
          type={type || 'text'}
          placeholder={placeholder}
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          style={style}
        />
      )}
    </div>
  );
}
