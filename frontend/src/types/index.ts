export type { PatientStatus, ObjectiveOption, MacroValues, MacroTarget, Patient, BiometricEntry, SkinfoldEntry as SkinfoldEntryType, SkinfoldData, PerimetryMeasure, PerimetryData, TimelineMacro, TimelineEvent, DetailedPatient } from './patient';
export { OBJECTIVE_LABELS, OBJECTIVE_KEYS, REVERSE_OBJECTIVE_LABELS, mapPatientFromApi } from './patient';
export type { FoodType, FoodCategory, FoodPer100, FoodPortion, Food, FoodPortionResponse, FoodApiResponse, FoodListApiResponse } from './food';
export { FOOD_CATEGORIES, mapFoodFromApi } from './food';
export type { MealFood, MealOption, MealSlot, PlanExtra, MealPlan } from './plan';
export type { SkinfoldEntry, SkinfoldData as BiometrySkinfoldData, PerimetryMeasure as BiometryPerimetryMeasure, PerimetryData as BiometryPerimetryData } from './biometry';

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  errors?: FieldError[];
  message?: string;
  status?: number;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
  db: string;
}

// Auth types
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'NUTRITIONIST' | 'ADMIN';
  onboardingCompleted: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  crn: string;
  crnRegional: string;
  specialty?: string;
  whatsapp?: string;
  terms: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface MeResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  crn: string;
  crnRegional: string;
  specialty: string | null;
  whatsapp: string | null;
  onboardingCompleted: boolean;
  trialEndsAt: string;
  subscriptionTier: string;
  patientLimit: number;
}