import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useNavigationStore } from '../../stores/navigationStore';
import { PATIENTS } from '../../data/patients';
import { IconSearch, IconHome, IconUsers, IconMeal, IconInsight } from '../icons';
import type { PatientStatus } from '../../types/patient';

interface NavItem {
  id: string;
  path: string;
  label: string;
  Icon: React.FC<{ size?: number; className?: string; color?: string; style?: React.CSSProperties }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', path: '/home', label: 'Visão geral', Icon: IconHome, badge: 'HOJE' },
  { id: 'patients', path: '/patients', label: 'Pacientes', Icon: IconUsers },
  { id: 'foods', path: '/foods', label: 'Alimentos', Icon: IconMeal },
  { id: 'insights', path: '/insights', label: 'Inteligência', Icon: IconInsight },
];

const STATUS_FILTERS: { key: PatientStatus | 'all'; label: string; dot?: string }[] = [
  { key: 'all', label: 'TODOS' },
  { key: 'ontrack', label: '', dot: 'var(--sage)' },
  { key: 'warning', label: '', dot: 'var(--amber)' },
  { key: 'danger', label: '', dot: 'var(--coral)' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setView, setActivePatientId, statusFilter, setStatusFilter, sidebarOpen } = useNavigationStore();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    let list = PATIENTS;
    if (statusFilter !== 'all') list = list.filter((p) => p.status === statusFilter);
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
    return list;
  }, [q, statusFilter]);

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
      <div className="sidebar-header">
        <div className="brand-row">
          <div className="brand-name">Nutri<span style={{ color: 'var(--lime-dim)' }}>AI</span></div>
          <div className="brand-tag mono">v2.4</div>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          Dra. Helena Viana · CRN-3 24781
        </div>
      </div>

      <div className="search">
        <IconSearch size={14} />
        <input placeholder="Buscar paciente, plano, alimento…" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="kbd">⌘K</span>
      </div>

      <div className="nav-section-label">Workspace</div>
      <div className="nav-list">
        {NAV_ITEMS.map((it) => (
          <button
            key={it.id}
            className={`nav-item ${location.pathname.startsWith(it.path) ? 'active' : ''}`}
            onClick={() => { setView(it.id as 'home' | 'patients' | 'foods' | 'insights'); navigate(it.path); }}
          >
            <it.Icon size={15} />
            <span>{it.label}</span>
            {'badge' in it && it.badge && <span className="count">{it.badge}</span>}
            {it.id === 'patients' && <span className="count">{PATIENTS.length}</span>}
          </button>
        ))}
      </div>

      <div className="nav-section-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 18 }}>
        <span>Pacientes ativos</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              title={f.key}
              style={{
                padding: f.key === 'all' ? '2px 6px' : '4px',
                borderRadius: 4,
                border: `1px solid ${statusFilter === f.key ? 'var(--fg)' : 'var(--border)'}`,
                background: statusFilter === f.key ? 'var(--surface-2)' : 'transparent',
                fontSize: 9,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'var(--fg-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: f.key === 'all' ? 0 : 18,
                minHeight: 18,
                cursor: 'pointer',
              }}
            >
              {f.key === 'all' ? 'TODOS' : <span style={{ width: 6, height: 6, borderRadius: 999, background: f.dot, display: 'block' }} />}
            </button>
          ))}
        </div>
      </div>

      <div className="patient-quick">
        {filtered.map((p) => (
          <div
            key={p.id}
            className={`pq-item ${location.pathname === `/patient/${p.id}` ? 'active' : ''}`}
            onClick={() => {
              setActivePatientId(p.id);
              setView('patient');
              navigate(`/patient/${p.id}`);
            }}
          >
            <span className={`pq-status ${p.status}`} />
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div className="pq-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
              <div className="pq-meta" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.objective.toUpperCase()}</div>
            </div>
            <div className="pq-meta tnum" style={{ flexShrink: 0 }}>{p.adherence}%</div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ padding: 16, fontSize: 12, color: 'var(--fg-subtle)' }}>Nenhum paciente neste filtro.</div>}
      </div>
    </aside>
  );
}