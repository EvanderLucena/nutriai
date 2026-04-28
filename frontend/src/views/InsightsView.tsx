import { useMemo } from 'react';
import { usePatients } from '../stores/patientStore';
import { mapPatientFromApi } from '../types/patient';

function AggStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>
        {label}
      </div>
      <div
        className="mono tnum"
        style={{ fontSize: 30, fontWeight: 500, letterSpacing: '-0.02em' }}
      >
        {value}
      </div>
    </div>
  );
}

function LegendItem({
  color,
  label,
  value,
  delta,
}: {
  color: string;
  label: string;
  value: string;
  delta?: string;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '12px 1fr auto',
        gap: 10,
        alignItems: 'center',
      }}
    >
      <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        {delta && (
          <div className="mono" style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>
            {delta}
          </div>
        )}
      </div>
      <div className="mono tnum" style={{ fontSize: 14, fontWeight: 500 }}>
        {value}
      </div>
    </div>
  );
}

export function InsightsView() {
  const { data, isLoading, isError } = usePatients();
  const activePats = useMemo(() => (data?.content ?? []).map(mapPatientFromApi), [data]);
  const onTrack = activePats.filter((p) => p.status === 'ontrack').length;
  const warning = activePats.filter((p) => p.status === 'warning').length;
  const danger = activePats.filter((p) => p.status === 'danger').length;
  const total = activePats.length;

  if (isLoading) {
    return <div className="page">Carregando insights...</div>;
  }

  if (isError) {
    return <div className="page">Erro ao carregar insights.</div>;
  }

  if (total === 0) {
    return (
      <div className="page">
        <h1 className="serif" style={{ fontSize: 38, margin: '4px 0 6px', fontWeight: 400 }}>
          Sem dados para insights
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--fg-muted)' }}>
          Cadastre pacientes e registros clínicos para liberar análises agregadas.
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ marginBottom: 20 }}>
        <div className="eyebrow">Análise agregada · {activePats.length} pacientes</div>
        <h1
          className="serif"
          style={{ fontSize: 38, margin: '4px 0 6px', fontWeight: 400, letterSpacing: '-0.02em' }}
        >
          Panorama da sua carteira.
        </h1>
        <div style={{ fontSize: 13.5, color: 'var(--fg-muted)', maxWidth: 720, lineHeight: 1.55 }}>
          Dados agregados e anônimos de consumo e biometria extraídos pela IA. Sem conteúdo de
          conversas individuais.
        </div>
      </div>

      <div
        className="insights-stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
          marginBottom: 16,
        }}
      >
        <AggStat label="Pacientes na carteira" value={total} />
        <AggStat label="No caminho" value={onTrack} />
        <AggStat label="Atenção" value={warning} />
        <AggStat label="Crítico" value={danger} />
      </div>

      <div className="divider">
        <span>Limite atual dos dados</span>
      </div>
      <div className="card">
        <div className="card-b">
          <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
            Nesta tranche, removemos insights textuais fixos para evitar interpretações enganosas. O
            próximo corte conectará os padrões a dados clínicos reais.
          </p>
        </div>
      </div>

      <div className="divider">
        <span>Distribuição atual da carteira</span>
      </div>
      <div className="card">
        <div className="card-b" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <LegendItem color="var(--sage)" label="On-track" value={`${onTrack} pacientes`} />
          <LegendItem color="var(--amber)" label="Atenção" value={`${warning} pacientes`} />
          <LegendItem color="var(--coral)" label="Crítico" value={`${danger} pacientes`} />
        </div>
      </div>
    </div>
  );
}
