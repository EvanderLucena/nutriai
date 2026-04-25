import { apiClient } from './client';
import type { DashboardData } from '../types/patient';

export async function getDashboard(): Promise<DashboardData> {
  const response = await apiClient.get<{ success: boolean; data: DashboardData }>('/dashboard');
  return response.data.data;
}
