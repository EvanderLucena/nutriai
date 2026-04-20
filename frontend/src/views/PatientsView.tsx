import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { PATIENTS } from '../data/patients';
import { useNavigationStore } from '../stores/navigationStore';
import { IconSearch, IconPlus, IconFilter, IconArchive } from '../components/icons';
import { PatientTable, PatientGrid, NewPatientModal, EditPatientModal, Pagination } from '../components/patients';
import type { Patient, PatientStatus } from '../types/patient';

const PAGE_SIZE = 10;

function MiniStat({ label, value, dot }: { label: string; value: string; dot?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <div className="eyebrow">{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
        {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot }} />}
        <div className="mono tnum" style={{ fontSize: 18, fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}

function TogglePatientModal({ name, activating, onClose, onConfirm }: { name: string; activating: boolean; onClose: () => void; onConfirm: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 200 }} onClick={onClose}>
      <div className="card" style={{ width: 'min(400px, 100%)', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '20px 24px' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>{activating ? 'Reativar paciente' : 'Desativar paciente'}</h3>
          <p style={{ fontSize: 13.5, color: 'var(--fg-muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
            {activating ? (
              <>Deseja reativar <strong style={{ color: 'var(--fg)' }}>{name}</strong>? O paciente voltará a aparecer na carteira ativa.</>
            ) : (
              <>Deseja desativar <strong style={{ color: 'var(--fg)' }}>{name}</strong>? Os dados serão preservados e o paciente poderá ser reativado depois.</>
            )}
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button
              className="btn"
              style={activating ? { background: 'var(--sage)', color: '#fff', borderColor: 'transparent' } : { background: 'var(--amber)', color: '#fff', borderColor: 'transparent' }}
              onClick={onConfirm}
            >
              <IconArchive size={13} /> {activating ? 'Reativar' : 'Desativar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PatientsView() {
  const navigate = useNavigate();
  const { setActivePatientId, setView } = useNavigationStore();
  const [patientsList, setPatientsList] = useState<Patient[]>([...PATIENTS]);
  const [mode, setMode] = useState<'table' | 'grid'>('table');
  const [q, setQ] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusF, setStatusF] = useState<PatientStatus | 'all' | 'inactive'>('all');
  const [page, setPage] = useState(0);
  const [newPatientOpen, setNewPatientOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [togglingPatient, setTogglingPatient] = useState<Patient | null>(null);

  const showInactive = statusF === 'inactive';

  const activePats = useMemo(() => patientsList.filter(p => p.active !== false), [patientsList]);
  const inactivePats = useMemo(() => patientsList.filter(p => p.active === false), [patientsList]);

  const filtered = useMemo(() => {
    let list = showInactive ? inactivePats : activePats;
    if (statusF !== 'all' && !showInactive) {
      list = list.filter(p => p.status === statusF);
    }
    if (q) list = list.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
    return list;
  }, [activePats, inactivePats, showInactive, statusF, q]);

  const activeFilters = !showInactive ? [statusF !== 'all'].filter(Boolean).length : 0;

  const toggleActive = useCallback((id: string) => {
    const patient = patientsList.find(p => p.id === id);
    if (patient) setTogglingPatient(patient);
  }, [patientsList]);

  const confirmToggle = useCallback(() => {
    if (!togglingPatient) return;
    setPatientsList(prev => prev.map(p => p.id === togglingPatient.id ? { ...p, active: p.active === false ? true : false } : p));
    setTogglingPatient(null);
  }, [togglingPatient]);

  const saveEdit = useCallback((id: string, updated: Partial<Patient>) => {
    setPatientsList(prev => prev.map(p => p.id !== id ? p : { ...p, ...updated }));
    setEditingPatient(null);
  }, []);

  const handleOpen = useCallback((id: string) => {
    setActivePatientId(id);
    setView('patient');
    navigate(`/patient/${id}`);
  }, [setActivePatientId, setView, navigate]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: filterOpen && !showInactive ? 12 : 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="eyebrow">{showInactive ? 'Inativos · arquivo clínico' : 'Carteira clínica'}</div>
          <h1 className="serif" style={{ fontSize: 34, margin: '4px 0 0', fontWeight: 400, letterSpacing: '-0.02em' }}>
            {filtered.length} {showInactive ? 'pacientes inativos' : 'pacientes ativos'}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {!showInactive && (
            <>
              <MiniStat label="Adesão média" value="82%" />
              <MiniStat label="On-track" value={String(activePats.filter(p => p.status === 'ontrack').length)} dot="var(--sage)" />
              <MiniStat label="Atenção" value={String(activePats.filter(p => p.status === 'warning').length)} dot="var(--amber)" />
              <MiniStat label="Crítico" value={String(activePats.filter(p => p.status === 'danger').length)} dot="var(--coral)" />
              <div style={{ width: 1, height: 32, background: 'var(--border)' }} />
            </>
          )}
          <div className="search" style={{ margin: 0, width: 200 }}>
            <IconSearch size={13} />
            <input placeholder="Buscar por nome…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
          </div>
          {!showInactive && (
            <div className="seg" style={{ height: 30 }}>
              <button className={mode === 'table' ? 'active' : ''} onClick={() => setMode('table')}>Lista</button>
              <button className={mode === 'grid' ? 'active' : ''} onClick={() => setMode('grid')}>Cartões</button>
            </div>
          )}
          {!showInactive && (
            <button
              className={`btn ${filterOpen || activeFilters > 0 ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={() => setFilterOpen(v => !v)}
              style={{ position: 'relative' }}
            >
              <IconFilter size={13} /> Filtrar
              {activeFilters > 0 && (
                <span style={{
                  position: 'absolute', top: -5, right: -5,
                  width: 16, height: 16, borderRadius: '50%',
                  background: 'var(--fg)', color: 'var(--bg)',
                  fontSize: 9, fontFamily: 'var(--font-mono)',
                  display: 'grid', placeItems: 'center',
                }}>{activeFilters}</span>
              )}
            </button>
          )}
          <button
            className={`btn ${showInactive ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => { setStatusF(showInactive ? 'all' : 'inactive'); setQ(''); setPage(0); }}
            style={{ color: showInactive ? 'var(--fg)' : inactivePats.length > 0 ? 'var(--fg-muted)' : 'var(--fg-subtle)' }}
          >
            <IconArchive size={13} />
            {showInactive ? ' Ver ativos' : inactivePats.length > 0 ? ` ${inactivePats.length} inativos` : ' Inativos'}
          </button>
          {!showInactive && (
            <button className="btn btn-primary" onClick={() => setNewPatientOpen(true)}>
              <IconPlus size={13} /> Novo paciente
            </button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      {filterOpen && !showInactive && (
        <div style={{
          display: 'flex', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap',
          padding: '16px 18px', marginBottom: 20,
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="eyebrow">Status</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {([
                { key: 'all' as const, label: 'Todos', color: undefined },
                { key: 'ontrack' as const, label: 'On-track', color: 'var(--sage)' },
                { key: 'warning' as const, label: 'Atenção', color: 'var(--amber)' },
                { key: 'danger' as const, label: 'Crítico', color: 'var(--coral)' },
              ]).map(f => (
                <button
                  key={f.key}
                  onClick={() => { setStatusF(f.key); setPage(0); }}
                  style={{
                    padding: '5px 10px', borderRadius: 5, fontSize: 12,
                    border: statusF === f.key ? '1px solid var(--fg)' : '1px solid var(--border)',
                    background: statusF === f.key ? 'var(--surface-2)' : 'transparent',
                    display: 'flex', alignItems: 'center', gap: 5, color: 'var(--fg)', cursor: 'pointer',
                  }}
                >
                  {f.color && <span style={{ width: 6, height: 6, borderRadius: '50%', background: f.color }} />}
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {activeFilters > 0 && (
            <button
              onClick={() => { setStatusF('all'); setQ(''); setPage(0); }}
              style={{ fontSize: 12, color: 'var(--fg-muted)', padding: '5px 0', marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ✕ Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {showInactive && filtered.length === 0 && (
        <div style={{ padding: '60px 0', textAlign: 'center', fontSize: 13, color: 'var(--fg-subtle)' }}>
          Nenhum paciente inativo no momento.
        </div>
      )}

      {/* Patient list */}
      {(!showInactive || filtered.length > 0) && (
        mode === 'table' || showInactive ? (
          <PatientTable
            patients={paged}
            onOpen={handleOpen}
            onToggleActive={toggleActive}
          />
        ) : (
          <PatientGrid
            patients={paged}
            onOpen={handleOpen}
            onToggleActive={toggleActive}
          />
        )
      )}

      <Pagination currentPage={page} totalPages={pages} onPageChange={setPage} />

      {/* Modals */}
      <NewPatientModal
        open={newPatientOpen}
        onClose={() => setNewPatientOpen(false)}
        onSave={(data) => {
          const newId = `p${patientsList.length + 1}`;
          const initials = data.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
          setPatientsList(prev => [...prev, {
            id: newId,
            name: data.name,
            initials,
            age: 30,
            objective: data.objective || 'Saúde geral',
            status: 'ontrack' as PatientStatus,
            adherence: 80,
            weight: 70,
            weightDelta: 0,
            tag: '01 semanas',
          }]);
          setNewPatientOpen(false);
        }}
      />
      {editingPatient && (
        <EditPatientModal
          patient={editingPatient}
          open={!!editingPatient}
          onClose={() => setEditingPatient(null)}
          onSave={saveEdit}
        />
      )}
      {togglingPatient && (
        <TogglePatientModal
          name={togglingPatient.name}
          activating={togglingPatient.active === false}
          onClose={() => setTogglingPatient(null)}
          onConfirm={confirmToggle}
        />
      )}
    </div>
  );
}