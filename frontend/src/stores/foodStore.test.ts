import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFoodUIStore } from './foodStore';

vi.mock('../api/foods', () => ({
  listFoods: vi.fn(),
  createFood: vi.fn(),
  updateFood: vi.fn(),
  deleteFood: vi.fn(),
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

describe('useFoodUIStore', () => {
  beforeEach(() => {
    useFoodUIStore.setState({
      searchQuery: '',
      categoryFilter: 'Todos',
      currentPage: 0,
      pageSize: 12,
      createModalOpen: false,
      editingFoodId: null,
    });
  });

  describe('initial state', () => {
    it('has correct default values', () => {
      const state = useFoodUIStore.getState();
      expect(state.searchQuery).toBe('');
      expect(state.categoryFilter).toBe('Todos');
      expect(state.currentPage).toBe(0);
      expect(state.pageSize).toBe(12);
      expect(state.createModalOpen).toBe(false);
      expect(state.editingFoodId).toBeNull();
    });
  });

  describe('searchQuery', () => {
    it('sets search query', () => {
      useFoodUIStore.getState().setSearchQuery('Arroz');
      expect(useFoodUIStore.getState().searchQuery).toBe('Arroz');
    });

    it('resets page to 0 when search query changes', () => {
      useFoodUIStore.setState({ currentPage: 3 });
      useFoodUIStore.getState().setSearchQuery('Feijão');
      expect(useFoodUIStore.getState().currentPage).toBe(0);
    });
  });

  describe('categoryFilter', () => {
    it('sets category filter', () => {
      useFoodUIStore.getState().setCategoryFilter('PROTEINA');
      expect(useFoodUIStore.getState().categoryFilter).toBe('PROTEINA');
    });

    it('resets page to 0 when category filter changes', () => {
      useFoodUIStore.setState({ currentPage: 2 });
      useFoodUIStore.getState().setCategoryFilter('CARBOIDRATO');
      expect(useFoodUIStore.getState().currentPage).toBe(0);
    });
  });

  describe('currentPage', () => {
    it('sets current page', () => {
      useFoodUIStore.getState().setCurrentPage(1);
      expect(useFoodUIStore.getState().currentPage).toBe(1);
    });
  });

  describe('modal state', () => {
    it('opens create modal', () => {
      useFoodUIStore.getState().setCreateModalOpen(true);
      expect(useFoodUIStore.getState().createModalOpen).toBe(true);
    });

    it('closes create modal', () => {
      useFoodUIStore.setState({ createModalOpen: true });
      useFoodUIStore.getState().setCreateModalOpen(false);
      expect(useFoodUIStore.getState().createModalOpen).toBe(false);
    });

    it('sets editing food id', () => {
      useFoodUIStore.getState().setEditingFoodId('f1');
      expect(useFoodUIStore.getState().editingFoodId).toBe('f1');
    });

    it('clears editing food id with null', () => {
      useFoodUIStore.setState({ editingFoodId: 'f1' });
      useFoodUIStore.getState().setEditingFoodId(null);
      expect(useFoodUIStore.getState().editingFoodId).toBeNull();
    });
  });
});