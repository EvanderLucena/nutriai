import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMutation } from '@tanstack/react-query';
import { useCreatePatient, usePatientUIStore } from './patientStore';

const showErrorMock = vi.fn();

vi.mock('../api/patients', () => ({
  listPatients: vi.fn(),
  createPatient: vi.fn(),
  getPatient: vi.fn(),
  updatePatient: vi.fn(),
  deactivatePatient: vi.fn(),
  reactivatePatient: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn((_options) => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
  })),
}));

vi.mock('./toastStore', () => ({
  useToastStore: {
    getState: () => ({
      showError: showErrorMock,
    }),
  },
}));

describe('usePatientUIStore', () => {
  beforeEach(() => {
    showErrorMock.mockReset();
    vi.mocked(useMutation).mockClear();
    usePatientUIStore.setState({
      searchQuery: '',
      statusFilter: 'all',
      objectiveFilter: 'all',
      currentPage: 0,
      pageSize: 10,
      newPatientModalOpen: false,
      editingPatientId: null,
      togglingPatientId: null,
    });
  });

  describe('searchQuery', () => {
    it('sets search query', () => {
      usePatientUIStore.getState().setSearchQuery('Ana');
      expect(usePatientUIStore.getState().searchQuery).toBe('Ana');
    });

    it('resets page to 0 when search query changes', () => {
      usePatientUIStore.setState({ currentPage: 3 });
      usePatientUIStore.getState().setSearchQuery('Carlos');
      expect(usePatientUIStore.getState().currentPage).toBe(0);
    });
  });

  describe('statusFilter', () => {
    it('sets status filter', () => {
      usePatientUIStore.getState().setStatusFilter('ontrack');
      expect(usePatientUIStore.getState().statusFilter).toBe('ontrack');
    });

    it('resets page to 0 when status filter changes', () => {
      usePatientUIStore.setState({ currentPage: 2 });
      usePatientUIStore.getState().setStatusFilter('warning');
      expect(usePatientUIStore.getState().currentPage).toBe(0);
    });

    it('accepts inactive status', () => {
      usePatientUIStore.getState().setStatusFilter('inactive');
      expect(usePatientUIStore.getState().statusFilter).toBe('inactive');
    });
  });

  describe('objectiveFilter', () => {
    it('sets objective filter', () => {
      usePatientUIStore.getState().setObjectiveFilter('EMAGRECIMENTO');
      expect(usePatientUIStore.getState().objectiveFilter).toBe('EMAGRECIMENTO');
    });

    it('resets page to 0 when objective filter changes', () => {
      usePatientUIStore.setState({ currentPage: 5 });
      usePatientUIStore.getState().setObjectiveFilter('HIPERTROFIA');
      expect(usePatientUIStore.getState().currentPage).toBe(0);
    });
  });

  describe('currentPage', () => {
    it('sets current page', () => {
      usePatientUIStore.getState().setCurrentPage(3);
      expect(usePatientUIStore.getState().currentPage).toBe(3);
    });
  });

  describe('modal state', () => {
    it('opens new patient modal', () => {
      usePatientUIStore.getState().setNewPatientModalOpen(true);
      expect(usePatientUIStore.getState().newPatientModalOpen).toBe(true);
    });

    it('closes new patient modal', () => {
      usePatientUIStore.setState({ newPatientModalOpen: true });
      usePatientUIStore.getState().setNewPatientModalOpen(false);
      expect(usePatientUIStore.getState().newPatientModalOpen).toBe(false);
    });

    it('sets editing patient id', () => {
      usePatientUIStore.getState().setEditingPatientId('p1');
      expect(usePatientUIStore.getState().editingPatientId).toBe('p1');
    });

    it('clears editing patient id with null', () => {
      usePatientUIStore.setState({ editingPatientId: 'p1' });
      usePatientUIStore.getState().setEditingPatientId(null);
      expect(usePatientUIStore.getState().editingPatientId).toBeNull();
    });

    it('sets toggling patient id', () => {
      usePatientUIStore.getState().setTogglingPatientId('p3');
      expect(usePatientUIStore.getState().togglingPatientId).toBe('p3');
    });
  });

  describe('initial state', () => {
    it('has correct default values', () => {
      const state = usePatientUIStore.getState();
      expect(state.searchQuery).toBe('');
      expect(state.statusFilter).toBe('all');
      expect(state.objectiveFilter).toBe('all');
      expect(state.currentPage).toBe(0);
      expect(state.pageSize).toBe(10);
      expect(state.newPatientModalOpen).toBe(false);
      expect(state.editingPatientId).toBeNull();
      expect(state.togglingPatientId).toBeNull();
    });
  });

  describe('useCreatePatient', () => {
    it('shows LGPD validation error returned by API', () => {
      useCreatePatient();

      const mutationOptions = vi.mocked(useMutation).mock.calls.at(-1)?.[0] as
        | { onError?: (error: unknown) => void }
        | undefined;

      mutationOptions?.onError?.({
        success: false,
        message: 'Erro de validação',
        errors: [{ field: 'terms', message: 'Consentimento LGPD é obrigatório' }],
        data: null,
        status: 400,
      });

      expect(showErrorMock).toHaveBeenCalledWith('Consentimento LGPD é obrigatório');
    });
  });
});
