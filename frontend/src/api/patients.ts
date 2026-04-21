import { apiClient } from './client';
import type { PatientApiResponse, PatientListApiResponse } from '../types/patient';

export interface CreatePatientRequest {
  name: string;
  age?: number;
  objective: string;
  weight?: number;
}

export interface UpdatePatientRequest {
  name?: string;
  age?: number;
  objective?: string;
  status?: string;
  weight?: number;
  weightDelta?: number;
  adherence?: number;
  tag?: string;
}

interface ListParams {
  page?: number;
  size?: number;
  search?: string;
  status?: string;
  objective?: string;
  active?: boolean;
}

export async function listPatients(params: ListParams = {}): Promise<PatientListApiResponse> {
  const response = await apiClient.get<PatientListApiResponse>('/patients', { params });
  return response.data;
}

export async function createPatient(data: CreatePatientRequest): Promise<PatientApiResponse> {
  const response = await apiClient.post<PatientApiResponse>('/patients', data);
  return response.data;
}

export async function getPatient(id: string): Promise<PatientApiResponse> {
  const response = await apiClient.get<PatientApiResponse>(`/patients/${id}`);
  return response.data;
}

export async function updatePatient(id: string, data: UpdatePatientRequest): Promise<PatientApiResponse> {
  const response = await apiClient.patch<PatientApiResponse>(`/patients/${id}`, data);
  return response.data;
}

export async function deactivatePatient(id: string): Promise<PatientApiResponse> {
  const response = await apiClient.patch<PatientApiResponse>(`/patients/${id}/deactivate`);
  return response.data;
}

export async function reactivatePatient(id: string): Promise<PatientApiResponse> {
  const response = await apiClient.patch<PatientApiResponse>(`/patients/${id}/reactivate`);
  return response.data;
}
