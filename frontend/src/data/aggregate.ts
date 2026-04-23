export interface Alert {
  level: 'danger' | 'warning';
  patient: string;
  text: string;
  ts: string;
}

export interface Pattern {
  title: string;
  body: string;
}

export const AGGREGATE = {
  active: 48,
  onTrack: 31,
  warning: 12,
  danger: 5,
  avgAdherence: 82,
  avgAdherenceWoW: 3,
  avgRetention: 87,
  alerts: [
    { level: 'danger' as const, patient: 'Carla Moreira', text: '5 dias consecutivos sem reportar consumo. Risco de abandono.', ts: 'há 2h' },
    { level: 'danger' as const, patient: 'Luana Ferreira', text: 'Adesão caiu de 72% para 48% nas últimas 2 semanas.', ts: 'há 3h' },
    { level: 'warning' as const, patient: 'Marcos Vieira', text: 'Glicemia de jejum reportada: 118 mg/dL (acima da meta).', ts: 'ontem' },
    { level: 'warning' as const, patient: 'Diogo Campos', text: 'Peso aumentou 0.4 kg com adesão estável — reavaliar macros.', ts: 'ontem' },
  ] as Alert[],
  patterns: [
    { title: 'Finais de semana', body: '68% da carteira apresenta desvio ≥20% em macros nos sábados e domingos, concentrado em carboidratos simples à noite.' },
    { title: 'Lanche da tarde', body: 'Refeição com menor adesão média (71%). Substituições fora do plano em 42% dos casos — barras industrializadas lideram.' },
    { title: 'Hidratação reportada', body: 'Apenas 23% dos pacientes reportam hidratação diariamente via WhatsApp. Considerar prompt automático da IA.' },
  ] as Pattern[],
};