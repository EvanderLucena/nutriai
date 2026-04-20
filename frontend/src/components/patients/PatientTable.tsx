import { StackBar } from '../viz/StackBar';
import { Avatar } from './Avatar';
import { IconArchive } from '../icons';
import type { Patient, PatientStatus } from '../../types/patient';

const STATUS_COLORS: Record<string, string> = {
  ontrack: 'var(--sage)',
  warning: 'var(--amber)',
  danger: 'var(--coral)',
  inactive: 'var(--fg-subtle)',
};

interface PatientTableProps {
  patients: Patient[];
  onOpen: (id: string) => void;
  onToggleActive?: (id: string) => void;
}

export function PatientTable({ patients, onOpen, onToggleActive }: PatientTableProps) {
  if (patients.length === 0) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center', fontSize: 13, color: 'var(--fg-subtle)' }}>
        Nenhum paciente neste filtro.
      </div>
    );
  }

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Paciente', 'Objetivo', 'Semanas', 'Adesão 7d', 'Peso', 'Δ peso', ''].map((h, i) => (
              <th key={i} className="eyebrow" style={{ textAlign: i > 0 ? 'left' : 'left', padding: '12px 18px', fontSize: 10 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {patients.map(p => {
            const isActive = p.active !== false;
            const displayStatus: PatientStatus | 'inactive' = isActive ? p.status : 'inactive';
            return (
              <tr
                key={p.id}
                onClick={() => { if (isActive) onOpen(p.id); }}
                style={{
                  cursor: isActive ? 'pointer' : 'default',
                  opacity: isActive ? 1 : 0.5,
                  transition: 'background 0.1s',
                  borderBottom: '1px solid var(--border)',
                }}
                onMouseEnter={(e) => { if (isActive) e.currentTarget.style.background = 'var(--surface-2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar initials={p.initials} status={displayStatus} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{p.name}</div>
                        {!isActive && (
                          <span style={{
                            fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
                            padding: '1px 5px', borderRadius: 3,
                            background: 'var(--surface-2)', color: 'var(--fg-subtle)',
                            border: '1px solid var(--border)',
                          }}>INATIVO</span>
                        )}
                      </div>
                      <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-subtle)', letterSpacing: '0.04em' }}>{p.age}A · {p.id.toUpperCase()}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: 12.5, color: 'var(--fg-muted)', padding: '14px 18px' }}>{p.objective}</td>
                <td className="mono tnum" style={{ fontSize: 12, padding: '14px 18px' }}>{p.tag}</td>
                <td style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, maxWidth: 100 }}>
                      <StackBar segments={[
                        { value: p.adherence, color: STATUS_COLORS[p.status] || 'var(--fg-subtle)', label: String(p.adherence) },
                        { value: 100 - p.adherence, color: 'var(--surface-2)', label: '' },
                      ]} />
                    </div>
                    <div className="mono tnum" style={{ fontSize: 12.5, width: 32 }}>{p.adherence}%</div>
                  </div>
                </td>
                <td className="mono tnum" style={{ fontSize: 12.5, padding: '14px 18px' }}>{p.weight} kg</td>
                <td className="mono tnum" style={{ fontSize: 12.5, color: p.weightDelta > 0 ? 'var(--coral-dim)' : p.weightDelta < 0 ? 'var(--sage-dim)' : 'var(--fg-muted)', padding: '14px 18px' }}>
                  {p.weightDelta > 0 ? '+' : ''}{p.weightDelta.toFixed(1)} kg
                </td>
                <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                  {onToggleActive && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleActive(p.id); }}
                      style={{
                        color: isActive ? 'var(--fg-subtle)' : 'var(--sage)',
                        border: 'none', background: 'none', cursor: 'pointer', padding: 4,
                        fontSize: 12, display: 'flex', alignItems: 'center', gap: 4,
                      }}
                      title={isActive ? 'Desativar' : 'Reativar'}
                    >
                      <IconArchive size={13} />
                      <span>{isActive ? 'Desativar' : 'Reativar'}</span>
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}