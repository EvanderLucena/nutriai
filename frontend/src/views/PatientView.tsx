import { useState } from 'react';
import { useParams } from 'react-router';
import { ANA } from '../data/ana';
import { usePatient } from '../stores/patientStore';
import { mapPatientFromApi } from '../types/patient';
import type { DetailedPatient, MacroTarget } from '../types/patient';
import { IconEdit, IconPlus } from '../components/icons';
import { EditPatientModal, Timeline, NewBiometryModal, MultiLineChart } from '../components/patient';
import { MacroRings, WeekBars, LineChart } from '../components/viz';
import { PlansView } from './PlansView';

type Tab = 'today' | 'plan' | 'biometry' | 'insights' | 'history';

export function PatientView() {
  const { id } = useParams();
  const { data: apiData, isLoading } = usePatient(id ?? null);
  const [tab, setTab] = useState<Tab>('today');
  const [editOpen, setEditOpen] = useState(false);

  const mappedApiData = apiData ? mapPatientFromApi(apiData) : null;

  const patient: DetailedPatient = {
    ...ANA,
    ...(mappedApiData ? {
      id: mappedApiData.id,
      name: mappedApiData.name,
      initials: mappedApiData.initials,
      age: mappedApiData.age,
      birthDate: mappedApiData.birthDate ?? ANA.birthDate,
      sex: mappedApiData.sex ?? ANA.sex,
      heightCm: mappedApiData.heightCm ?? ANA.height,
      whatsapp: mappedApiData.whatsapp ?? ANA.whatsapp,
      objective: mappedApiData.objective,
      status: mappedApiData.status,
      adherence: mappedApiData.adherence,
      weight: mappedApiData.weight,
      weightDelta: mappedApiData.weightDelta,
      tag: mappedApiData.tag,
      active: mappedApiData.active,
    } : {}),
  };

  if (isLoading) {
    return (
      <div className="page" style={{ maxWidth: 'none', padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--fg-subtle)', fontSize: 14 }}>Carregando paciente...</p>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 'none', padding: 0 }}>
      <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--border)' }}>
        <div className="patient-header-row" style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <div style={{
            width: 68, height: 68, borderRadius: '50%',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            display: 'grid', placeItems: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 600,
            position: 'relative', flexShrink: 0,
          }}>
            {patient.initials}
            <span style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 18, height: 18, borderRadius: '50%',
              background: patient.status === 'ontrack' ? 'var(--sage)' : patient.status === 'warning' ? 'var(--amber)' : 'var(--coral)',
              border: '3px solid var(--bg)',
            }} />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div className="eyebrow">Paciente · {patient.id.toUpperCase()} · acompanhamento desde {patient.since}</div>
            <h1 className="serif" style={{ fontSize: 36, margin: '4px 0 6px', fontWeight: 400, letterSpacing: '-0.02em' }}>
              {patient.name}
            </h1>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12.5, color: 'var(--fg-muted)', alignItems: 'center' }}>
              <span>{patient.age} anos · {patient.sex === 'F' ? 'Feminino' : 'Masculino'}</span>
              <span>·</span>
              <span>{patient.heightCm ?? patient.height} cm · {patient.biometry[patient.biometry.length - 1].weight} kg</span>
              <span>·</span>
              <span style={{ color: 'var(--fg)' }}>{patient.objective}</span>
              <button
                className="btn btn-ghost"
                style={{ fontSize: 11.5, padding: '3px 8px', marginLeft: 4 }}
                onClick={() => setEditOpen(true)}
              >
                <IconEdit size={11} /> Editar
              </button>
            </div>
          </div>
          <div className="patient-header-stats-row" style={{ display: 'flex', gap: 20, alignItems: 'center', flexShrink: 0 }}>
            <HeaderStat label="Adesão 7d" value={`${patient.adherence}%`} status={patient.status} />
            <div className="patient-header-dividers" style={{ width: 1, height: 44, background: 'var(--border)' }} />
            <HeaderStat label="Peso" value="64.2 kg" sub="-1.6 kg / 30d" good />
            <div className="patient-header-dividers" style={{ width: 1, height: 44, background: 'var(--border)' }} />
            <HeaderStat label="% gordura" value="22.8%" sub="11 abr" />
          </div>
        </div>

        <div className="patient-tab-row" style={{ display: 'flex', gap: 2, marginTop: 20, borderBottom: '1px solid var(--border)', marginBottom: -21 }}>
          {([
            { k: 'today' as Tab, label: 'Hoje' },
            { k: 'plan' as Tab, label: 'Plano' },
            { k: 'biometry' as Tab, label: 'Biometria' },
            { k: 'insights' as Tab, label: 'Inteligência' },
            { k: 'history' as Tab, label: 'Histórico' },
          ]).map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              style={{
                padding: '10px 14px',
                fontSize: 13,
                color: tab === t.k ? 'var(--fg)' : 'var(--fg-muted)',
                fontWeight: tab === t.k ? 600 : 400,
                borderBottom: tab === t.k ? '2px solid var(--fg)' : '2px solid transparent',
                marginBottom: -1,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {tab === 'today' && <TodayTab patient={patient} onSetTab={setTab} />}
      {tab === 'plan' && <PlansView patientId={id!} />}
      {tab === 'biometry' && <BiometryTab patient={patient} />}
      {tab === 'insights' && <InsightsTab />}
      {tab === 'history' && <HistoryTab />}

      {editOpen && (
        <EditPatientModal
          patient={patient}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}

function TodayTab({ patient, onSetTab }: { patient: DetailedPatient; onSetTab: (t: Tab) => void }) {
  const reportedMacrosToday: MacroTarget = patient.macrosToday;

  return (
    <div>
      <div style={{ padding: '24px 28px' }}>
        <div className="today-cards-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>
          {/* LEFT: Plano do dia */}
          <div className="card">
            <div className="card-h">
              <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--fg)', flexShrink: 0 }} />
              <div className="title">Plano do dia</div>
              <div className="spacer" />
              <button className="btn btn-ghost" style={{ fontSize: 11.5, padding: '4px 8px' }} onClick={() => onSetTab('plan')}>
                <IconEdit size={11} /> Editar
              </button>
            </div>
            <div className="card-b">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                <div className="eyebrow">META DIÁRIA</div>
                <div className="mono tnum" style={{ fontSize: 14, color: 'var(--fg-muted)' }}>6 refeições</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="eyebrow">KCAL</div>
                  <div className="mono tnum" style={{ fontSize: 20, fontWeight: 500, marginTop: 2 }}>{patient.macrosToday.kcal.target.toLocaleString('pt-BR')}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="eyebrow">PROTEÍNA</div>
                  <div className="mono tnum" style={{ fontSize: 20, fontWeight: 500, color: 'var(--sage-dim)', marginTop: 2 }}>{patient.macrosToday.prot.target}g</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="eyebrow">CARBOIDRATO</div>
                  <div className="mono tnum" style={{ fontSize: 20, fontWeight: 500, color: 'var(--carb)', marginTop: 2 }}>{patient.macrosToday.carb.target}g</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="eyebrow">GORDURA</div>
                  <div className="mono tnum" style={{ fontSize: 20, fontWeight: 500, color: 'var(--sky)', marginTop: 2 }}>{patient.macrosToday.fat.target}g</div>
                </div>
              </div>
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                <span className="mono" style={{ fontSize: 10, letterSpacing: '0.06em', color: 'var(--fg-subtle)', marginRight: 6 }}>OBSERVAÇÕES</span>
                Evitar lactose · preferir proteína magra à noite · carne vermelha máx 2×/semana
              </div>
            </div>
          </div>

          {/* RIGHT: Consumo reportado */}
          <div className="card">
            <div className="card-h">
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--lime-dim)', boxShadow: '0 0 0 3px rgba(156,191,43,0.2)', flexShrink: 0 }} />
              <div className="title">Consumo reportado</div>
              <div className="spacer" />
              <div className="chip ai"><span className="d" />4 registros</div>
            </div>
            <div className="card-b">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                <div className="eyebrow">EXTRAÍDO ATÉ AGORA · 14:28</div>
                <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-subtle)', letterSpacing: '0.06em' }}>VIA WHATSAPP</div>
              </div>
              <MacroRings macros={reportedMacrosToday} size={64} />
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
                <span className="mono" style={{ fontSize: 10, letterSpacing: '0.06em', color: 'var(--fg-subtle)', marginRight: 6 }}>NOTA</span>
                Macros estimados pela IA a partir do texto do paciente. Edite qualquer registro se houver erro de extração.
              </div>
            </div>
          </div>
        </div>

        {/* Weekly adherence */}
        <div className="card" style={{ marginBottom: 22 }}>
          <div className="card-h">
            <div className="title">Adesão semanal</div>
            <div className="sub">SEG — DOM</div>
          </div>
          <div className="card-b">
            <WeekBars values={patient.weekMacroFill} height={42} />
          </div>
        </div>

        {/* Timeline */}
        <div className="card">
          <div className="card-h">
            <div className="title">Refeições reportadas · hoje</div>
            <div className="sub">SOMENTE REGISTROS DO PACIENTE</div>
            <div className="spacer" />
            <div style={{ fontSize: 11, color: 'var(--fg-muted)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--lime-dim)' }} /> Extraído via WhatsApp
            </div>
          </div>
          <div className="card-b tight">
            <Timeline items={patient.timeline} />
          </div>
        </div>
      </div>
    </div>
  );
}

function HeaderStat({ label, value, sub, status, good }: {
  label: string;
  value: string;
  sub?: string;
  status?: string;
  good?: boolean;
}) {
  const color = status === 'ontrack' ? 'var(--sage-dim)' : status === 'warning' ? 'var(--carb)' : status === 'danger' ? 'var(--coral-dim)' : good ? 'var(--sage-dim)' : 'var(--fg)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 68, whiteSpace: 'nowrap' }}>
      <div className="eyebrow">{label}</div>
      <div className="mono tnum" style={{ fontSize: 20, fontWeight: 500, color, letterSpacing: '-0.02em', marginTop: 2 }}>{value}</div>
      {sub && <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-subtle)', letterSpacing: '0.04em' }}>{sub}</div>}
    </div>
  );
}

function BiometryTab({ patient }: { patient: DetailedPatient }) {
  const last = patient.biometry[patient.biometry.length - 1];
  const [metric, setMetric] = useState('all');
  const [newEvalOpen, setNewEvalOpen] = useState(false);

  const metricCfg: Record<string, { label: string; unit?: string; color?: string }> = {
    all: { label: 'Todas' },
    weight: { label: 'Peso', unit: 'kg', color: 'var(--ink-contrast)' },
    fat: { label: 'Gordura', unit: '%', color: 'var(--carb)' },
    lean: { label: 'Massa', unit: 'kg', color: 'var(--sage-dim)' },
    water: { label: 'Água', unit: '%', color: 'var(--sky)' },
  };

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Última avaliação */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="biometry-latest-grid" style={{ padding: '18px 22px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 20, alignItems: 'center' }}>
          <div>
            <div className="eyebrow">ÚLTIMA AVALIAÇÃO</div>
            <div className="serif" style={{ fontSize: 22, margin: '4px 0 0', letterSpacing: '-0.01em' }}>{last.date} 2026 · {last.method}</div>
          </div>
          <div className="biometry-latest-cells" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20, paddingLeft: 20, borderLeft: '1px solid var(--border)' }}>
            <BioCell label="Peso" value={last.weight} unit="kg" />
            <BioCell label="% Gordura" value={last.fat} unit="%" delta={-1.3} good />
            <BioCell label="Massa magra" value={last.lean} unit="kg" delta={0.6} good />
            <BioCell label="% Água" value={last.water} unit="%" />
            <BioCell label="Gordura visceral" value={last.visceral} sub="nível" />
          </div>
          <button className="btn btn-primary" onClick={() => setNewEvalOpen(true)}><IconPlus size={13} /> Nova avaliação</button>
        </div>
      </div>

      {/* Evolução chart */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-h">
          <div className="title">Evolução · 4 avaliações</div>
          <div className="sub">21 MAR → 11 ABR</div>
          <div className="spacer" />
          <div className="seg" style={{ height: 26 }}>
            {Object.keys(metricCfg).map((k) => (
              <button key={k} className={metric === k ? 'active' : ''} onClick={() => setMetric(k)}>{metricCfg[k].label}</button>
            ))}
          </div>
        </div>
        <div className="card-b">
          {metric === 'all' ? (
            <MultiLineChart data={patient.biometry} metrics={[
              { key: 'weight', color: 'var(--ink-contrast)', label: 'Peso', unit: 'kg' },
              { key: 'fat', color: 'var(--carb)', label: 'Gordura', unit: '%' },
              { key: 'lean', color: 'var(--sage-dim)', label: 'Massa', unit: 'kg' },
              { key: 'water', color: 'var(--sky)', label: 'Água', unit: '%' },
            ]} />
          ) : (
            <LineChart data={patient.biometry.map(({ date, weight, fat, lean, water, visceral, bmr }) => ({ date, weight, fat, lean, water, visceral, bmr }))} width={900} height={200} yKey={metric} color={metricCfg[metric].color} fill="rgba(11,12,10,0.05)" unit={metricCfg[metric].unit || ''} />
          )}
        </div>
      </div>

      {/* Dobras cutâneas + Perimetria */}
      <div className="biometry-charts-grid" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div className="card-h">
            <div className="title">Dobras cutâneas</div>
            <div className="sub">PROTOCOLO POLLOCK 7 · ADIPÔMETRO</div>
            <div className="spacer" />
            <div className="mono" style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{patient.skinfolds.date}</div>
          </div>
          <div className="card-b">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {patient.skinfolds.folds.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 6 }}>
                  <div style={{ flex: 1, fontSize: 12.5 }}>{f.name}</div>
                  <div className="mono tnum" style={{ fontSize: 15, fontWeight: 600 }}>{f.value}<span style={{ fontSize: 10, color: 'var(--fg-subtle)', marginLeft: 3 }}>mm</span></div>
                  <div className="mono tnum" style={{ fontSize: 11, minWidth: 36, textAlign: 'right', color: f.delta < 0 ? 'var(--sage-dim)' : f.delta > 0 ? 'var(--coral)' : 'var(--fg-subtle)' }}>
                    {f.delta > 0 ? '+' : ''}{f.delta > 0 || f.delta < 0 ? f.delta.toFixed(0) : '—'}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <div>
                <div className="eyebrow">SOMATÓRIO 7 DOBRAS</div>
                <div className="mono tnum" style={{ fontSize: 20, fontWeight: 500, marginTop: 3 }}>114 <span style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>mm</span></div>
              </div>
              <div>
                <div className="eyebrow">DENSIDADE CORPORAL</div>
                <div className="mono tnum" style={{ fontSize: 20, fontWeight: 500, marginTop: 3 }}>1,048 <span style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>g/mL</span></div>
              </div>
              <div>
                <div className="eyebrow">% GORDURA (SIRI)</div>
                <div className="mono tnum" style={{ fontSize: 20, fontWeight: 500, marginTop: 3, color: 'var(--carb)' }}>22,8%</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <div className="title">Perimetria</div>
            <div className="sub">CIRCUNFERÊNCIAS · CM</div>
            <div className="spacer" />
            <div className="mono" style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{patient.perimetry.date}</div>
          </div>
          <div className="card-b tight">
            {patient.perimetry.measures.map((m, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16, padding: '12px 18px', borderBottom: i === patient.perimetry.measures.length - 1 ? 'none' : '1px solid var(--border)', alignItems: 'center' }}>
                <div style={{ fontSize: 13 }}>{m.name}</div>
                <div className="mono tnum" style={{ fontSize: 14, fontWeight: 500 }}>{m.value} <span style={{ fontSize: 10, color: 'var(--fg-subtle)' }}>cm</span></div>
                <div className="mono tnum" style={{ fontSize: 11, width: 48, textAlign: 'right', color: m.delta < 0 ? 'var(--sage-dim)' : m.delta > 0 ? 'var(--fg-muted)' : 'var(--fg-subtle)' }}>
                  {m.delta > 0 ? '+' : ''}{m.delta.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Histórico de avaliações */}
      <div className="card">
        <div className="card-h">
          <div className="title">Histórico de avaliações</div>
          <div className="sub">APPEND-ONLY · AUDITORIA CLÍNICA</div>
        </div>
        <div className="biometry-table-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr', padding: '10px 18px', borderBottom: '1px solid var(--border)', gap: 12 }}>
          {['Data', 'Método', 'Peso', '% Gordura', 'Magra', '% Água', 'TMB'].map((h, i) => (
            <div key={i} className="eyebrow" style={{ fontSize: 10 }}>{h}</div>
          ))}
        </div>
        {[...patient.biometry].reverse().map((b, i, arr) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr', padding: '12px 18px', borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--border)', gap: 12, alignItems: 'center' }}>
            <div className="mono" style={{ fontSize: 12, color: 'var(--fg)' }}>{b.date} 2026</div>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{b.method}</div>
            <div className="mono tnum" style={{ fontSize: 12.5, fontWeight: 500 }}>{b.weight} kg</div>
            <div className="mono tnum" style={{ fontSize: 12, color: 'var(--carb)' }}>{b.fat}%</div>
            <div className="mono tnum" style={{ fontSize: 12, color: 'var(--sage-dim)' }}>{b.lean} kg</div>
            <div className="mono tnum" style={{ fontSize: 12, color: 'var(--sky)' }}>{b.water}%</div>
            <div className="mono tnum" style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{b.bmr} kcal</div>
          </div>
        ))}
      </div>
      {newEvalOpen && <NewBiometryModal onClose={() => setNewEvalOpen(false)} />}
    </div>
  );
}

function BioCell({ label, value, unit, sub, delta, good }: {
  label: string;
  value: number;
  unit?: string;
  sub?: string;
  delta?: number;
  good?: boolean;
}) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 3 }}>
        <div className="mono tnum" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em' }}>{value}</div>
        {unit && <div style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>{unit}</div>}
      </div>
      {delta !== undefined && (
        <div className="mono tnum" style={{ fontSize: 10.5, color: good ? 'var(--sage-dim)' : 'var(--fg-muted)', marginTop: 1 }}>
          {delta > 0 ? '+' : ''}{delta} vs. anterior
        </div>
      )}
      {sub && <div className="mono" style={{ fontSize: 10, color: 'var(--fg-subtle)', marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function InsightsTab() {
  return (
    <div style={{ padding: '24px 28px' }}>
      <div className="card">
        <div className="card-h">
          <div className="title">Padrões observados no consumo</div>
          <div className="sub">ÚLTIMOS 14 DIAS</div>
          <div className="spacer" />
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-subtle)', letterSpacing: '0.06em' }}>APENAS DADOS EXTRAÍDOS</div>
        </div>
        <div className="card-b">
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              'Horários de maior frequência de registro: 07:00–09:00 e 12:00–13:30',
              'Proteína média por refeição: 28g (desvio padrão 6g)',
              'Hidratação raramente reportada — apenas 2 registros nos últimos 7 dias',
              'Frequência de lanches reportados no período da tarde vem caindo nas últimas 2 semanas',
            ].map((t, i) => (
              <li key={i} style={{ fontSize: 13.5, display: 'flex', gap: 12, color: 'var(--fg)' }}>
                <span style={{ color: 'var(--lime-dim)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>0{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

interface HistoryEntry {
  time: string;
  meal: string;
  items: string[];
  macros: { kcal: number; prot: number; carb: number; fat: number };
}

interface HistoryDay {
  date: string;
  entries: HistoryEntry[];
}

const MOCK_HISTORY: HistoryDay[] = [
  { date: '17 abr', entries: [
    { time: '12:48', meal: 'Almoço', items: ['Frango grelhado ~150g', 'Arroz integral', 'Salada'], macros: { kcal: 620, prot: 48, carb: 62, fat: 18 } },
    { time: '10:05', meal: 'Lanche manhã', items: ['Banana + pasta de amendoim'], macros: { kcal: 210, prot: 5, carb: 28, fat: 10 } },
    { time: '07:14', meal: 'Café da manhã', items: ['Omelete 2 ovos', 'Pão integral', 'Café preto'], macros: { kcal: 380, prot: 26, carb: 28, fat: 16 } },
  ]},
  { date: '16 abr', entries: [
    { time: '19:55', meal: 'Jantar', items: ['Tilápia assada', 'Batata-doce', 'Brócolis'], macros: { kcal: 490, prot: 40, carb: 38, fat: 14 } },
    { time: '12:30', meal: 'Almoço', items: ['Carne moída refogada', 'Arroz', 'Feijão', 'Salada'], macros: { kcal: 680, prot: 42, carb: 70, fat: 22 } },
    { time: '07:20', meal: 'Café da manhã', items: ['Iogurte natural', 'Granola', 'Morango'], macros: { kcal: 310, prot: 18, carb: 38, fat: 8 } },
  ]},
  { date: '15 abr', entries: [
    { time: '20:10', meal: 'Jantar', items: ['Omelete 3 ovos', 'Queijo branco', 'Tomate'], macros: { kcal: 420, prot: 34, carb: 6, fat: 28 } },
    { time: '15:40', meal: 'Lanche tarde', items: ['Mix de castanhas 30g'], macros: { kcal: 185, prot: 5, carb: 6, fat: 17 } },
    { time: '12:55', meal: 'Almoço', items: ['Frango desfiado', 'Macarrão integral', 'Molho de tomate'], macros: { kcal: 590, prot: 44, carb: 58, fat: 16 } },
    { time: '07:05', meal: 'Café da manhã', items: ['Whey protein baunilha', 'Aveia', 'Banana'], macros: { kcal: 430, prot: 32, carb: 54, fat: 8 } },
  ]},
  { date: '14 abr', entries: [
    { time: '19:30', meal: 'Jantar', items: ['Salmão grelhado', 'Purê de batata-doce', 'Aspargos'], macros: { kcal: 530, prot: 38, carb: 40, fat: 20 } },
    { time: '12:40', meal: 'Almoço', items: ['Frango grelhado', 'Arroz integral', 'Feijão'], macros: { kcal: 610, prot: 46, carb: 60, fat: 18 } },
    { time: '07:18', meal: 'Café da manhã', items: ['Pão integral', 'Ovo mexido', 'Queijo'], macros: { kcal: 360, prot: 22, carb: 30, fat: 14 } },
  ]},
];

const HISTORY_PAGE_SIZE = 7;

function HistoryTab() {
  const today = '2026-04-17';
  const [dateFrom, setDateFrom] = useState('2026-04-10');
  const [dateTo, setDateTo] = useState(today);
  const [quickRange, setQuickRange] = useState('7d');
  const [histPage, setHistPage] = useState(0);

  const applyQuick = (r: string) => {
    setQuickRange(r);
    const days: Record<string, number> = { '7d': 7, '14d': 14, '30d': 30 };
    const d = new Date(today);
    d.setDate(d.getDate() - days[r] + 1);
    setDateFrom(d.toISOString().slice(0, 10));
    setDateTo(today);
  };

  const displayed = MOCK_HISTORY;
  const histPages = Math.max(1, Math.ceil(displayed.length / HISTORY_PAGE_SIZE));

  const totalEntries = displayed.reduce((s, d) => s + d.entries.length, 0);
  const totalKcal = displayed.reduce((s, d) => s + d.entries.reduce((ss, e) => ss + e.macros.kcal, 0), 0);

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div className="eyebrow">Registros extraídos · append-only</div>
          <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 2 }}>
            <span className="mono tnum" style={{ fontWeight: 600, color: 'var(--fg)' }}>{totalEntries}</span> refeições ·&nbsp;
            <span className="mono tnum" style={{ fontWeight: 600, color: 'var(--fg)' }}>{totalKcal.toLocaleString('pt-BR')}</span> kcal total
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="seg" style={{ height: 28 }}>
            {['7d', '14d', '30d'].map((r) => (
              <button key={r} className={quickRange === r ? 'active' : ''} onClick={() => applyQuick(r)}>{r}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setQuickRange(''); }}
              style={{ padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 5, fontSize: 12, background: 'var(--surface)', color: 'var(--fg)', fontFamily: 'var(--font-mono)' }} />
            <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>→</span>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setQuickRange(''); }}
              style={{ padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 5, fontSize: 12, background: 'var(--surface)', color: 'var(--fg)', fontFamily: 'var(--font-mono)' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {displayed.map((day, di) => {
          const dayKcal = day.entries.reduce((s, e) => s + e.macros.kcal, 0);
          return (
            <div key={di} className="card">
              <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{day.date}</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span className="mono tnum" style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>{day.entries.length} refeições</span>
                  <span className="mono tnum" style={{ fontSize: 11.5, color: 'var(--fg)' }}>{dayKcal} kcal</span>
                </div>
              </div>
              {day.entries.map((e, ei) => (
                <div key={ei} className="history-entry-grid" style={{
                  display: 'grid', gridTemplateColumns: '70px 1fr auto',
                  gap: 14, padding: '12px 18px',
                  borderBottom: ei < day.entries.length - 1 ? '1px solid var(--border)' : 'none',
                  alignItems: 'start',
                }}>
                  <div>
                    <div className="mono tnum" style={{ fontSize: 13, fontWeight: 600 }}>{e.time}</div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--fg-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>{e.meal}</div>
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {e.items.map((it, j) => (
                      <li key={j} style={{ fontSize: 13, color: 'var(--fg)', display: 'flex', gap: 6 }}>
                        <span style={{ color: 'var(--fg-subtle)' }}>·</span>{it}
                      </li>
                    ))}
                  </ul>
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', columnGap: 8, rowGap: 1, fontSize: 11.5, textAlign: 'right' }}>
                    <span style={{ color: 'var(--fg-muted)' }}>kcal</span><span className="mono tnum" style={{ fontWeight: 600 }}>{e.macros.kcal}</span>
                    <span style={{ color: 'var(--fg-muted)' }}>prot</span><span className="mono tnum">{e.macros.prot}g</span>
                    <span style={{ color: 'var(--fg-muted)' }}>carb</span><span className="mono tnum">{e.macros.carb}g</span>
                    <span style={{ color: 'var(--fg-muted)' }}>gord</span><span className="mono tnum">{e.macros.fat}g</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {histPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <div className="mono" style={{ fontSize: 11.5, color: 'var(--fg-subtle)', letterSpacing: '0.04em' }}>
            Dias {histPage * HISTORY_PAGE_SIZE + 1}–{Math.min((histPage + 1) * HISTORY_PAGE_SIZE, displayed.length)} de {displayed.length}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-ghost" disabled={histPage === 0} onClick={() => setHistPage((p) => p - 1)} style={{ opacity: histPage === 0 ? 0.35 : 1 }}>← Anterior</button>
            <button className="btn btn-ghost" disabled={histPage === histPages - 1} onClick={() => setHistPage((p) => p + 1)} style={{ opacity: histPage === histPages - 1 ? 0.35 : 1 }}>Próximo →</button>
          </div>
        </div>
      )}
    </div>
  );
}