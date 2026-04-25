import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useClinicalUIStore } from './clinicalStore';

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
    invalidateQueries: vi.fn(),
  })),
}));

describe('useClinicalUIStore', () => {
  beforeEach(() => {
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
});
