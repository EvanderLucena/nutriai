import * as React from 'react';
import { useNavigate } from 'react-router';
import { usePatients } from '../stores/patientStore';
import { useAuthStore } from '../stores/authStore';
import { useDashboard } from '../stores/clinicalStore';
import { mapPatientFromApi } from '../types/patient';
import { KPI } from '../components/KPI';
import type { Patient } from '../types/patient';

function PatientCard({ p, onNavigate }: { p: Patient; onNavigate: (id: string) => void }) {
  const statusColors: Record<string, string> = {
    ontrack: 'var(--sage)',
    warning: 'var(--amber)',
    danger: 'var(--coral)',
  };
  const statusLabels: Record<string, string> = {
    ontrack: 'No caminho',
    warning: 'Atenção',
    danger: 'Crítico',
  };

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
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'var(--surface-2)',
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            fontWeight: 600,
            position: 'relative',
            flexShrink: 0,
          }}
        >
          {p.initials}
          <span
            style={{
              position: 'absolute',
              bottom: -1,
              right: -1,
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: statusColors[p.status] || 'var(--fg-subtle)',
              boxShadow: '0 0 0 3px var(--surface)',
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {p.name}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>
            {p.objective} · {p.age}A
          </div>
        </div>
        <div className={`chip ${p.status}`} style={{ padding: '2px 6px' }}>
          <span
            style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: statusColors[p.status],
              marginRight: 4,
            }}
          />
          {statusLabels[p.status]}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 8,
        }}
      >
        <div>
          <div className="eyebrow">Adesão 7d</div>
          <div
            className="mono tnum"
            style={{
              fontSize: 22,
              fontWeight: 500,
              color:
                p.status === 'ontrack'
                  ? 'var(--sage-dim)'
                  : p.status === 'warning'
                    ? 'var(--carb)'
                    : 'var(--coral-dim)',
            }}
          >
            {p.adherence}%
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11.5,
          color: 'var(--fg-muted)',
          paddingTop: 10,
          borderTop: '1px solid var(--border)',
        }}
      >
        <span className="mono tnum">
          {p.weight}kg · {p.weightDelta > 0 ? '+' : ''}
          {p.weightDelta.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

const PAGE_SIZE = 8;

export function HomeView() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError } = usePatients();
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
  } = useDashboard();
  const activePats = React.useMemo(() => (data?.content ?? []).map(mapPatientFromApi), [data]);
  const patientSlice = activePats.slice(0, PAGE_SIZE);

  const handleNavigate = (id: string) => {
    navigate(`/patient/${id}`);
  };

  const kpis = dashboardData?.kpis;
  const onTrack = kpis?.onTrackPatients ?? activePats.filter((p) => p.status === 'ontrack').length;
  const warning =
    kpis?.attentionPatients ?? activePats.filter((p) => p.status === 'warning').length;
  const danger = kpis?.criticalPatients ?? activePats.filter((p) => p.status === 'danger').length;
  const avgAdherence =
    kpis?.averageAdherence ??
    (activePats.length > 0
      ? Math.round(activePats.reduce((sum, p) => sum + p.adherence, 0) / activePats.length)
      : 0);
  const patientCountText = `${activePats.length} ${activePats.length === 1 ? 'paciente' : 'pacientes'}`;
  const headerDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  if (isLoading || isDashboardLoading) {
    return <div className="page">Carregando painel...</div>;
  }

  if (isError || isDashboardError) {
    return <div className="page">Erro ao carregar dados do painel.</div>;
  }

  if (!kpis || activePats.length === 0) {
    return (
      <div className="page">
        <h1 className="serif" style={{ fontSize: 34, margin: 0, fontWeight: 400 }}>
          Sem dados agregados disponíveis
        </h1>
        <p style={{ color: 'var(--fg-muted)', marginTop: 10 }}>
          Assim que houver pacientes e eventos clínicos, o resumo da carteira aparecerá aqui.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div className="eyebrow">{headerDate}</div>
          <h1
            className="serif"
            style={{
              fontSize: 34,
              margin: '4px 0 0',
              letterSpacing: '-0.02em',
              fontWeight: 400,
              whiteSpace: 'nowrap',
            }}
          >
            Bom dia, {user?.name?.split(' ')[0] || 'nutricionista'}.
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
          <div className="chip ontrack">
            <span
              style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--sage)',
                marginRight: 4,
              }}
            />
            {onTrack} on-track
          </div>
          <div className="chip warning">
            <span
              style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--amber)',
                marginRight: 4,
              }}
            />
            {warning} atenção
          </div>
          <div className="chip danger">
            <span
              style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--coral)',
                marginRight: 4,
              }}
            />
            {danger} crítico
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div
        className="home-kpi-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
          marginBottom: 18,
        }}
      >
        <KPI
          label="Pacientes ativos"
          value={String(kpis?.activePatients ?? data?.totalElements ?? 0)}
          sub={patientCountText}
        />
        <KPI label="Adesão média" value={`${avgAdherence}%`} sub="média da carteira" />
        <KPI
          label="Avaliados 30d"
          value={String(kpis?.assessedInLast30Days ?? 0)}
          sub="últimos 30 dias"
        />
        <KPI
          label="Sem registro há >3 dias"
          value={String(danger)}
          sub="contato recomendado"
          danger
        />
      </div>

      {/* Patient grid */}
      <div className="divider">
        <span>Sua carteira · {isLoading ? '...' : patientCountText}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {patientSlice.map((p) => (
          <PatientCard key={p.id} p={p} onNavigate={handleNavigate} />
        ))}
      </div>
    </div>
  );
}
