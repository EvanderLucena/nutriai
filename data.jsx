// Mock data — PT-BR, clinical tone
const PATIENTS = [
  { id: "p1", name: "Ana Beatriz Lopes", initials: "AL", age: 34, objective: "Hipertrofia", status: "ontrack", adherence: 92, weight: 64.2, weightDelta: +0.3, tag: "04 semanas" },
  { id: "p2", name: "Marcos Vieira", initials: "MV", age: 52, objective: "Controle glicêmico", status: "warning", adherence: 71, weight: 88.1, weightDelta: -0.8, tag: "12 semanas" },
  { id: "p3", name: "Carla Moreira", initials: "CM", age: 28, objective: "Emagrecimento", status: "danger", adherence: 54, weight: 78.4, weightDelta: +1.2, tag: "08 semanas" },
  { id: "p4", name: "Rafael Tonioli", initials: "RT", age: 41, objective: "Performance esportiva", status: "ontrack", adherence: 88, weight: 74.5, weightDelta: -0.2, tag: "16 semanas" },
  { id: "p5", name: "Juliana Prado", initials: "JP", age: 36, objective: "Reeducação alimentar", status: "ontrack", adherence: 85, weight: 69.0, weightDelta: -0.5, tag: "06 semanas" },
  { id: "p6", name: "Diogo Campos", initials: "DC", age: 47, objective: "Emagrecimento", status: "warning", adherence: 66, weight: 94.7, weightDelta: +0.4, tag: "10 semanas" },
  { id: "p7", name: "Isabela Nunes", initials: "IN", age: 31, objective: "Hipertrofia", status: "ontrack", adherence: 90, weight: 58.8, weightDelta: +0.6, tag: "07 semanas" },
  { id: "p8", name: "Bruno Sá", initials: "BS", age: 39, objective: "Controle pressão", status: "warning", adherence: 74, weight: 81.2, weightDelta: -0.1, tag: "20 semanas" },
  { id: "p9", name: "Luana Ferreira", initials: "LF", age: 26, objective: "Emagrecimento", status: "danger", adherence: 48, weight: 82.9, weightDelta: +0.9, tag: "14 semanas" },
  { id: "p10", name: "Pedro Henrique", initials: "PH", age: 29, objective: "Hipertrofia", status: "ontrack", adherence: 94, weight: 76.3, weightDelta: +0.4, tag: "05 semanas" },
  { id: "p11", name: "Fernanda Aguiar", initials: "FA", age: 44, objective: "Reeducação alimentar", status: "warning", adherence: 68, weight: 72.1, weightDelta: -0.3, tag: "09 semanas" },
  { id: "p12", name: "Tiago Barros", initials: "TB", age: 35, objective: "Performance esportiva", status: "ontrack", adherence: 87, weight: 79.4, weightDelta: 0, tag: "11 semanas" }
];

// Ana's full detail
const ANA = {
  id: "p1",
  name: "Ana Beatriz Lopes",
  initials: "AL",
  age: 34,
  sex: "F",
  height: 168,
  objective: "Hipertrofia com manutenção de % gordura",
  since: "21 mar 2026",
  status: "ontrack",
  adherence: 92,
  macrosToday: {
    kcal: { target: 2200, actual: 1680 },
    prot: { target: 140, actual: 108 },
    carb: { target: 250, actual: 182 },
    fat:  { target:  70, actual:  54 }
  },
  biometry: [
    { date: "21 mar", method: "Bioimpedância", weight: 65.8, fat: 24.1, lean: 42.9, water: 52.1, visceral: 6, bmr: 1420 },
    { date: "28 mar", method: "Adipômetro",    weight: 65.2, fat: 23.6, lean: 43.1, water: 52.4, visceral: 6, bmr: 1428 },
    { date: "04 abr", method: "Bioimpedância", weight: 64.6, fat: 23.2, lean: 43.3, water: 52.8, visceral: 5, bmr: 1435 },
    { date: "11 abr", method: "Adipômetro",    weight: 64.2, fat: 22.8, lean: 43.5, water: 53.1, visceral: 5, bmr: 1440 }
  ],
  // Dobras cutâneas (mm) — protocolo Pollock 7 dobras
  skinfolds: {
    date: "11 abr", method: "Adipômetro Cescorf",
    folds: [
      { name: "Tríceps", value: 16 },
      { name: "Subescapular", value: 14 },
      { name: "Peitoral", value: 8 },
      { name: "Axilar média", value: 12 },
      { name: "Supra-ilíaca", value: 18 },
      { name: "Abdominal", value: 22 },
      { name: "Coxa", value: 24 }
    ]
  },
  // Perimetria (circunferências, cm)
  perimetry: {
    date: "11 abr",
    measures: [
      { name: "Cintura",      value: 74.5, delta: -1.5 },
      { name: "Quadril",      value: 96.0, delta: -0.5 },
      { name: "Braço",        value: 28.5, delta: +0.8 },
      { name: "Coxa",         value: 55.0, delta: +0.3 },
      { name: "Panturrilha",  value: 35.5, delta: +0.2 }
    ]
  },
  weekAdherence: [ 88, 94, 81, 90, 95, 78, 92 ], // Seg..Dom
  weekMacroFill: [ 0.92, 0.96, 0.84, 0.91, 0.97, 0.82, 0.93 ],
  timeline: [
    { time: "07:14", meal: "Café da manhã", label: "Prescrito — Opção 1", kind: "plan", items: ["Omelete 2 ovos + queijo branco", "1 fatia pão integral", "Café preto"], macros: { kcal: 380, prot: 26, carb: 28, fat: 16 }, status: "ontrack", adherence: 98 },
    { time: "10:05", meal: "Lanche manhã", label: "Paciente reportou via WhatsApp", kind: "log", items: ["1 banana + pasta de amendoim (1 colher)"], macros: { kcal: 210, prot: 5, carb: 28, fat: 10 }, status: "ontrack", adherence: 94, aiNote: "Reportado 35 min após o horário sugerido. Macros dentro da margem." },
    { time: "12:48", meal: "Almoço", label: "Paciente reportou via WhatsApp", kind: "log", items: ["Frango grelhado ~150g", "Arroz integral 4 col.", "Salada com azeite"], macros: { kcal: 620, prot: 48, carb: 62, fat: 18 }, status: "ontrack", adherence: 96, aiNote: "Combinação próxima da Opção 1 prescrita. Carbo levemente abaixo.", hasMessage: true },
    { time: "15:30", meal: "Lanche tarde", label: "Prescrito — não reportado", kind: "pending", items: ["Iogurte natural + granola + frutas vermelhas"], macros: { kcal: 240, prot: 14, carb: 32, fat: 6 }, status: "warning", adherence: null },
    { time: "16:22", meal: "Extra", label: "Registrado pela IA", kind: "log", items: ["Barra de cereal (marca Trio)"], macros: { kcal: 140, prot: 3, carb: 24, fat: 3 }, status: "warning", adherence: 62, aiNote: "Não consta no plano. IA sugeriu reduzir carbo no jantar.", hasMessage: true, offPlan: true },
    { time: "19:40", meal: "Jantar", label: "Sugerido 19:30 — Opção 2", kind: "upcoming", items: ["Salmão ~130g", "Purê de batata-doce", "Brócolis refogado"], macros: { kcal: 530, prot: 36, carb: 42, fat: 22 }, status: "pending" }
  ],
  aiSummary: `Ana manteve adesão de 92% na última semana, com consistência no café da manhã e almoço. Padrão recorrente: lanches da tarde são frequentemente substituídos por opções fora do plano (barras industrializadas) 3× na semana — impacto de ~110 kcal/dia em carboidrato simples. Biometria indica redução de 0,4 pp em % gordura e ganho de 0,2 kg em massa magra nos últimos 14 dias, compatível com o objetivo de hipertrofia. Recomendo revisar a Opção 2 do lanche tarde — mais prática e portátil — para reduzir desvio.`
};

// Aggregate insights
const AGGREGATE = {
  active: 48,
  onTrack: 31,
  warning: 12,
  danger: 5,
  avgAdherence: 82,
  avgAdherenceWoW: +3,
  avgRetention: 87,
  alerts: [
    { level: "danger", patient: "Carla Moreira", text: "5 dias consecutivos sem reportar consumo. Risco de abandono.", ts: "há 2h" },
    { level: "danger", patient: "Luana Ferreira", text: "Adesão caiu de 72% para 48% nas últimas 2 semanas.", ts: "há 3h" },
    { level: "warning", patient: "Marcos Vieira", text: "Glicemia de jejum reportada: 118 mg/dL (acima da meta).", ts: "ontem" },
    { level: "warning", patient: "Diogo Campos", text: "Peso aumentou 0.4 kg com adesão estável — reavaliar macros.", ts: "ontem" }
  ],
  patterns: [
    { title: "Finais de semana", body: "68% da carteira apresenta desvio ≥20% em macros nos sábados e domingos, concentrado em carboidratos simples à noite." },
    { title: "Lanche da tarde", body: "Refeição com menor adesão média (71%). Substituições fora do plano em 42% dos casos — barras industrializadas lideram." },
    { title: "Hidratação reportada", body: "Apenas 23% dos pacientes reportam hidratação diariamente via WhatsApp. Considerar prompt automático da IA." }
  ]
};

Object.assign(window, { PATIENTS, ANA, AGGREGATE });
