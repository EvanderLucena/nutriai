import { create } from 'zustand';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as dashboardApi from '../api/dashboard';
import * as biometryApi from '../api/biometry';
import type {
  CreateBiometryAssessmentRequest,
  UpdateBiometryAssessmentRequest,
} from '../types/patient';
import { useToastStore } from './toastStore';
import { resolveMutationErrorMessage } from './patientStore';

interface ClinicalUIState {
  selectedHistoryEpisodeId: string | null;
  selectedChartMetric: 'weight' | 'bodyFat' | 'leanMass';
  biometryModalOpen: boolean;
  setSelectedHistoryEpisodeId: (id: string | null) => void;
  setSelectedChartMetric: (metric: ClinicalUIState['selectedChartMetric']) => void;
  setBiometryModalOpen: (open: boolean) => void;
}

export const useClinicalUIStore = create<ClinicalUIState>()((set) => ({
  selectedHistoryEpisodeId: null,
  selectedChartMetric: 'weight',
  biometryModalOpen: false,
  setSelectedHistoryEpisodeId: (id) => set({ selectedHistoryEpisodeId: id }),
  setSelectedChartMetric: (metric) => set({ selectedChartMetric: metric }),
  setBiometryModalOpen: (open) => set({ biometryModalOpen: open }),
}));

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getDashboard,
    staleTime: 30_000,
  });
}

export function usePatientBiometry(patientId: string | null) {
  return useQuery({
    queryKey: ['patient-biometry', patientId],
    queryFn: () => {
      if (!patientId) throw new Error('Patient ID is required');
      return biometryApi.listBiometryAssessments(patientId);
    },
    enabled: !!patientId,
  });
}

export function useCreateBiometry(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBiometryAssessmentRequest) =>
      biometryApi.createBiometryAssessment(patientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-biometry', patientId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      useToastStore
        .getState()
        .showError(
          resolveMutationErrorMessage(error, 'Erro ao salvar avaliação — tente novamente'),
        );
    },
  });
}

export function useUpdateBiometry(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assessmentId,
      data,
    }: {
      assessmentId: string;
      data: UpdateBiometryAssessmentRequest;
    }) => biometryApi.updateBiometryAssessment(patientId, assessmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-biometry', patientId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      useToastStore
        .getState()
        .showError(
          resolveMutationErrorMessage(error, 'Erro ao atualizar avaliação — tente novamente'),
        );
    },
  });
}

export function usePatientHistoryEpisodes(patientId: string | null) {
  return useQuery({
    queryKey: ['patient-history', patientId],
    queryFn: () => {
      if (!patientId) throw new Error('Patient ID is required');
      return biometryApi.listHistoryEpisodes(patientId);
    },
    enabled: !!patientId,
  });
}

export function useHistoricalEpisode(patientId: string | null, episodeId: string | null) {
  return useQuery({
    queryKey: ['patient-history', patientId, episodeId],
    queryFn: () => {
      if (!patientId || !episodeId) throw new Error('Patient ID and Episode ID are required');
      return biometryApi.getHistorySnapshot(patientId, episodeId);
    },
    enabled: !!patientId && !!episodeId,
  });
}
