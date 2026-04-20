export type PatientStatus = 'ontrack' | 'warning' | 'danger';

export interface MacroValues {
  target: number;
  actual: number;
}

export interface MacroTarget {
  kcal: MacroValues;
  prot: MacroValues;
  carb: MacroValues;
  fat: MacroValues;
}

export interface Patient {
  id: string;
  name: string;
  initials: string;
  age: number;
  objective: string;
  status: PatientStatus;
  adherence: number;
  weight: number;
  weightDelta: number;
  tag: string;
  active?: boolean;
}

export interface BiometricEntry {
  date: string;
  method: string;
  weight: number;
  fat: number;
  lean: number;
  water: number;
  visceral: number;
  bmr: number;
}

export interface SkinfoldEntry {
  name: string;
  value: number;
  delta: number;
}

export interface SkinfoldData {
  date: string;
  method: string;
  folds: SkinfoldEntry[];
}

export interface PerimetryMeasure {
  name: string;
  value: number;
  delta: number;
}

export interface PerimetryData {
  date: string;
  measures: PerimetryMeasure[];
}

export interface TimelineMacro {
  kcal: number;
  prot: number;
  carb: number;
  fat: number;
}

export interface TimelineEvent {
  time: string;
  meal: string;
  label: string;
  kind: 'plan' | 'log' | 'pending' | 'upcoming';
  items: string[];
  macros: TimelineMacro;
  status?: PatientStatus | 'pending';
  adherence?: number | null;
  aiNote?: string;
  hasMessage?: boolean;
  offPlan?: boolean;
}

export interface DetailedPatient extends Patient {
  sex: string;
  height: number;
  since: string;
  macrosToday: MacroTarget;
  biometry: BiometricEntry[];
  skinfolds: SkinfoldData;
  perimetry: PerimetryData;
  weekAdherence: number[];
  weekMacroFill: number[];
  timeline: TimelineEvent[];
  aiSummary: string;
}