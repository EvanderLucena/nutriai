export interface SkinfoldEntry {
  name: string;
  value: number;
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