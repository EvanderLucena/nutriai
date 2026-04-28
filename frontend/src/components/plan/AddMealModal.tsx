import { useValidation } from '../../hooks/useValidation';
import { IconPlus, IconX } from '../icons';

interface AddMealModalProps {
  onClose: () => void;
  onAdd: (data: { label: string; time: string }) => void;
}

export function AddMealModal({ onClose, onAdd }: AddMealModalProps) {
  const {
    values: form,
    errors,
    set,
    onBlur,
    validateAll,
    reset,
  } = useValidation({ label: '', time: '' } as Record<string, string>, {
    label: {
      required: true,
      requiredMessage: 'Nome da refeição é obrigatório.',
      minLength: 2,
      minLengthMessage: 'Nome deve ter pelo menos 2 caracteres.',
    },
    time: {
      required: true,
      requiredMessage: 'Horário é obrigatório.',
    },
  });

  const handleSave = () => {
    if (!validateAll()) return;
    onAdd({ label: form.label.trim(), time: form.time });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(11,12,10,0.4)',
        zIndex: 200,
        display: 'grid',
        placeItems: 'center',
        padding: 20,
      }}
      onClick={handleClose}
    >
      <div
        className="card"
        style={{ width: 'min(420px, 100%)', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-h">
          <div className="title">Nova refeição</div>
          <div className="spacer" />
          <button onClick={handleClose} className="btn btn-ghost" style={{ padding: '4px 6px' }}>
            <IconX size={14} />
          </button>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label className="eyebrow" htmlFor="meal-label">
                Nome
              </label>
              <input
                id="meal-label"
                autoFocus
                value={form.label}
                onChange={(e) => set('label', e.target.value)}
                onBlur={onBlur('label')}
                aria-invalid={errors.label ? 'true' : undefined}
                aria-describedby={errors.label ? 'meal-label-error' : undefined}
                placeholder="ex: Lanche pré-treino"
                style={{
                  padding: '8px 10px',
                  border: `1px solid ${errors.label ? 'var(--coral)' : 'var(--border)'}`,
                  borderRadius: 6,
                  fontSize: 13,
                  background: 'var(--surface)',
                  outline: 'none',
                  color: 'var(--fg)',
                }}
              />
              {errors.label && (
                <p id="meal-label-error" className="text-xs text-coral" role="alert">
                  {errors.label}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label className="eyebrow" htmlFor="meal-time">
                Horário
              </label>
              <input
                id="meal-time"
                type="time"
                value={form.time}
                onChange={(e) => set('time', e.target.value)}
                onBlur={onBlur('time')}
                aria-invalid={errors.time ? 'true' : undefined}
                aria-describedby={errors.time ? 'meal-time-error' : undefined}
                style={{
                  padding: '8px 10px',
                  border: `1px solid ${errors.time ? 'var(--coral)' : 'var(--border)'}`,
                  borderRadius: 6,
                  fontSize: 13,
                  background: 'var(--surface)',
                  outline: 'none',
                  color: 'var(--fg)',
                  fontFamily: 'var(--font-mono)',
                }}
              />
              {errors.time && (
                <p id="meal-time-error" className="text-xs text-coral" role="alert">
                  {errors.time}
                </p>
              )}
            </div>
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
          <button className="btn btn-ghost" onClick={handleClose}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            disabled={!form.label.trim() || !form.time}
            onClick={handleSave}
            style={{ opacity: form.label.trim() && form.time ? 1 : 0.45 }}
          >
            <IconPlus size={13} /> Criar refeição
          </button>
        </div>
      </div>
    </div>
  );
}
