export type { PatientStatus, MacroValues, MacroTarget, Patient, BiometricEntry, SkinfoldEntry as SkinfoldEntryType, SkinfoldData, PerimetryMeasure, PerimetryData, TimelineMacro, TimelineEvent, DetailedPatient } from './patient';
export type { FoodType, FoodCategory, FoodPer100, FoodPortion, Food } from './food';
export type { MealFood, MealOption, MealSlot, PlanExtra } from './plan';
export type { SkinfoldEntry, SkinfoldData as BiometrySkinfoldData, PerimetryMeasure as BiometryPerimetryMeasure, PerimetryData as BiometryPerimetryData } from './biometry';

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  errors?: string[];
  message?: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
  db: string;
}