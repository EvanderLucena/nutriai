import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { usePatients } from '../stores/patientStore';
import { mapPatientFromApi } from '../types/patient';
import { AGGREGATE } from '../data/aggregate';
import { KPI } from '../components/KPI';
import { IconPlus, IconChevronR } from '../components/icons';
import { useNavigationStore } from '../stores/navigationStore';
import type { Patient } from '../types/patient';

function PatientCard({ p, onNavigate }: { p: Patient; onNavigate: (id: string) => void }) {
  const statusColors: Record<string, string> = { ontrack: 'var(--sage)', warning: 'var(--amber)', danger: 'var(--coral)' };
  const statusLabels: Record<string, string> = { ontrack: 'No caminho', warning: 'Atenção', danger: 'Crítico' };

  return (
    <div
      className="card"
      style={{ cursor: 'pointer', padding: 16, transition: 'border-color 0.12s' }}
      onClick={() => onNavigate(p.id)}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-2)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div
          style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'var(--surface-2)', display: 'grid', placeItems: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600,
            position: 'relative', flexShrink: 0,
          }}
        >
          {p.initials}
          <span style={{
            position: 'absolute', bottom: -1, right: -1,
            width: 10, height: 10, borderRadius: '50%',
            background: statusColors[p.status] || 'var(--fg-subtle)',
            boxShadow: '0 0 0 3px var(--surface)',
          }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>{p.objective} · {p.age}A</div>
        </div>
        <div
          className={`chip ${p.status}`}
          style={{ padding: '2px 6px' }}
        >
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: statusColors[p.status], marginRight: 4 }} />
          {statusLabels[p.status]}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
        <div>
          <div className="eyebrow">Adesão 7d</div>
          <div
            className="mono tnum"
            style={{
              fontSize: 22, fontWeight: 500,
              color: p.status === 'ontrack' ? 'var(--sage-dim)' : p.status === 'warning' ? 'var(--carb)' : 'var(--coral-dim)',
            }}
          >
            {p.adherence}%
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--fg-muted)', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
        <span className="mono tnum">{p.weight}kg · {p.weightDelta > 0 ? '+' : ''}{p.weightDelta.toFixed(1)}</span>
      </div>
    </div>
  );
}

const PAGE_SIZE = 8;

export function HomeView() {
  const { setActivePatientId, setView } = useNavigationStore();
  const navigate = useNavigate();
  const { data, isLoading } = usePatients();
  const activePats = useMemo(() => (data?.content ?? []).map(mapPatientFromApi), [data]);
  const patientSlice = activePats.slice(0, PAGE_SIZE);

  const handleNavigate = (id: string) => {
    setActivePatientId(id);
    setView('patient');
    navigate(`/patient/${id}`);
  };

  const statusColors: Record<string, string> = { ontrack: 'var(--sage)', warning: 'var(--amber)', danger: 'var(--coral)' };

  const events = activePats.slice(0, 6).map((p, i) => ({
    time: ['14:28', '13:50', '12:05', '10:40', '09:14', '08:02'][i] || '07:30',
    who: p.name,
    whoId: p.id,
    status: p.status,
    text: 'Refeição',
    tag: `${p.adherence}% adesão`,
  }));

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div className="eyebrow">Quarta-feira · 17 abril 2026</div>
          <h1 className="serif" style={{ fontSize: 34, margin: '4px 0 0', letterSpacing: '-0.02em', fontWeight: 400, whiteSpace: 'nowrap' }}>
            Bom dia, Helena.
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
          <div className="chip ontrack"><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--sage)', marginRight: 4 }} />{AGGREGATE.onTrack} on-track</div>
          <div className="chip warning"><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--amber)', marginRight: 4 }} />{AGGREGATE.warning} atenção</div>
          <div className="chip danger"><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--coral)', marginRight: 4 }} />{AGGREGATE.danger} crítico</div>
          <button className="btn btn-primary" onClick={() => { /* New patient modal would open here */ }} style={{ marginLeft: 8 }}>
            <IconPlus size={13} /> Novo paciente
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="home-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
        <KPI
          label="Pacientes ativos"
          value={String(data?.totalElements ?? 0)}
          sub="+2 esta semana"
          sparklineData={[44, 45, 46, 47, 46, 48, 48]}
          trend="up"
        />
        <KPI
          label="Adesão média"
          value={`${AGGREGATE.avgAdherence}%`}
          sub={`${AGGREGATE.avgAdherenceWoW > 0 ? '+' : ''}${AGGREGATE.avgAdherenceWoW}pp vs. semana passada`}
          sparklineData={[78, 79, 80, 81, 80, 82, 82]}
          trend="up"
        />
        <KPI
          label="Refeições registradas"
          value="127"
          sub="via WhatsApp"
        />
        <KPI
          label="Sem registro há >3 dias"
          value={String(AGGREGATE.danger)}
          sub="contato recomendado"
          danger
        />
      </div>

      {/* Activity — extracted data */}
      <div className="card">
        <div className="card-h">
          <div className="title">Refeições reportadas · hoje</div>
          <div className="sub">EXTRAÍDO VIA WHATSAPP</div>
          <div style={{ flex: 1 }} />
          <div className="chip ai"><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--lime-dim)', marginRight: 4 }} />AO VIVO</div>
        </div>
        <div style={{ padding: 0 }}>
          {events.map((ev, i) => (
            <div
              key={i}
              style={{
                display: 'grid', gridTemplateColumns: '60px 14px 1fr', alignItems: 'center', gap: 12,
                padding: '12px 18px', borderBottom: i < events.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer',
              }}
              onClick={() => handleNavigate(ev.whoId)}
            >
              <div className="mono tnum" style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>{ev.time}</div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColors[ev.status] }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13.5, marginBottom: 2 }}>
                    <span style={{ fontWeight: 600 }}>{ev.who}</span>
                    <span style={{ color: 'var(--fg-muted)' }}> — {ev.text}</span>
                  </div>
                  <div className="mono tnum" style={{ fontSize: 10.5, color: 'var(--fg-subtle)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {ev.tag}
                  </div>
                </div>
                <IconChevronR size={14} style={{ color: 'var(--fg-subtle)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Patient grid */}
      <div className="divider"><span>Sua carteira · {isLoading ? '...' : `${activePats.length} pacientes`}</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {patientSlice.map(p => (
          <PatientCard key={p.id} p={p} onNavigate={handleNavigate} />
        ))}
      </div>
    </div>
  );
}