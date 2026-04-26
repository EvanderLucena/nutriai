import { apiClient } from './client';
import type { DashboardData, PatientStatus } from '../types/patient';

interface DashboardApiResponse {
  kpis: DashboardData['kpis'];
  recentEvaluations: Array<{
    patientId: string;
    patientName: string;
    initials?: string | null;
    assessmentDate: string;
    weight: number;
    bodyFatPercent: number;
    status: string;
  }>;
}

function normalizeStatus(status: string): PatientStatus {
  switch ((status || '').toUpperCase()) {
    case 'ONTRACK':
      return 'ontrack';
    case 'WARNING':
      return 'warning';
    case 'DANGER':
      return 'danger';
    default:
      return 'warning';
  }
}

function buildInitials(name: string): string {
  return (name ?? '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export async function getDashboard(): Promise<DashboardData> {
  const response = await apiClient.get<{ success: boolean; data: DashboardApiResponse }>(
    '/dashboard',
  );
  const payload = response.data.data;

  return {
    ...payload,
    recentEvaluations: payload.recentEvaluations.map((ev) => ({
      ...ev,
      initials: ev.initials?.trim() ? ev.initials : buildInitials(ev.patientName),
      status: normalizeStatus(ev.status),
    })),
  };
}
