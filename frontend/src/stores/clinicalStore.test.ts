import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMutation } from '@tanstack/react-query';
import { useClinicalUIStore, useCreateBiometry, useUpdateBiometry } from './clinicalStore';

const invalidateQueriesMock = vi.fn();

vi.mock('../api/dashboard', () => ({
  getDashboard: vi.fn(),
}));

vi.mock('../api/biometry', () => ({
  listBiometryAssessments: vi.fn(),
  createBiometryAssessment: vi.fn(),
  updateBiometryAssessment: vi.fn(),
  listHistoryEpisodes: vi.fn(),
  getHistorySnapshot: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: invalidateQueriesMock,
  })),
}));

describe('useClinicalUIStore', () => {
  beforeEach(() => {
    invalidateQueriesMock.mockReset();
    vi.mocked(useMutation).mockClear();
    useClinicalUIStore.setState({
      selectedHistoryEpisodeId: null,
      selectedChartMetric: 'weight',
      biometryModalOpen: false,
    });
  });

  describe('selectedHistoryEpisodeId', () => {
    it('sets selected history episode id', () => {
      useClinicalUIStore.getState().setSelectedHistoryEpisodeId('ep-1');
      expect(useClinicalUIStore.getState().selectedHistoryEpisodeId).toBe('ep-1');
    });

    it('clears selected history episode id', () => {
      useClinicalUIStore.getState().setSelectedHistoryEpisodeId('ep-1');
      useClinicalUIStore.getState().setSelectedHistoryEpisodeId(null);
      expect(useClinicalUIStore.getState().selectedHistoryEpisodeId).toBeNull();
    });
  });

  describe('selectedChartMetric', () => {
    it('sets chart metric to weight', () => {
      useClinicalUIStore.getState().setSelectedChartMetric('weight');
      expect(useClinicalUIStore.getState().selectedChartMetric).toBe('weight');
    });

    it('sets chart metric to bodyFat', () => {
      useClinicalUIStore.getState().setSelectedChartMetric('bodyFat');
      expect(useClinicalUIStore.getState().selectedChartMetric).toBe('bodyFat');
    });

    it('sets chart metric to leanMass', () => {
      useClinicalUIStore.getState().setSelectedChartMetric('leanMass');
      expect(useClinicalUIStore.getState().selectedChartMetric).toBe('leanMass');
    });
  });

  describe('biometryModalOpen', () => {
    it('opens biometry modal', () => {
      useClinicalUIStore.getState().setBiometryModalOpen(true);
      expect(useClinicalUIStore.getState().biometryModalOpen).toBe(true);
    });

    it('closes biometry modal', () => {
      useClinicalUIStore.getState().setBiometryModalOpen(true);
      useClinicalUIStore.getState().setBiometryModalOpen(false);
      expect(useClinicalUIStore.getState().biometryModalOpen).toBe(false);
    });
  });

  describe('biometry mutations', () => {
    it('invalidates biometry, history, and dashboard queries after creating an assessment', () => {
      useCreateBiometry('patient-1');

      const mutationOptions = vi.mocked(useMutation).mock.calls.at(-1)?.[0] as
        | { onSuccess?: () => void }
        | undefined;

      mutationOptions?.onSuccess?.();

      expect(invalidateQueriesMock).toHaveBeenCalledWith({
        queryKey: ['patient-biometry', 'patient-1'],
      });
      expect(invalidateQueriesMock).toHaveBeenCalledWith({
        queryKey: ['patient-history', 'patient-1'],
      });
      expect(invalidateQueriesMock).toHaveBeenCalledWith({
        queryKey: ['dashboard'],
      });
    });

    it('invalidates biometry, history, and dashboard queries after updating an assessment', () => {
      useUpdateBiometry('patient-1');

      const mutationOptions = vi.mocked(useMutation).mock.calls.at(-1)?.[0] as
        | { onSuccess?: () => void }
        | undefined;

      mutationOptions?.onSuccess?.();

      expect(invalidateQueriesMock).toHaveBeenCalledWith({
        queryKey: ['patient-biometry', 'patient-1'],
      });
      expect(invalidateQueriesMock).toHaveBeenCalledWith({
        queryKey: ['patient-history', 'patient-1'],
      });
      expect(invalidateQueriesMock).toHaveBeenCalledWith({
        queryKey: ['dashboard'],
      });
    });
  });
});
