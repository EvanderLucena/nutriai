// API response types matching backend shape

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

// Patient status enum
export type PatientStatus = 'ontrack' | 'warning' | 'danger';

// Navigation view types
export type ViewType = 'home' | 'patients' | 'patient' | 'foods' | 'insights';

// Auth view types
export type AuthViewType = 'landing' | 'login' | 'signup' | null;