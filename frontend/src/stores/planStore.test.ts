import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePlanUIStore } from './planStore';

vi.mock('../api/plans', () => ({
  getPlan: vi.fn(),
  updatePlan: vi.fn(),
  addMealSlot: vi.fn(),
  updateMealSlot: vi.fn(),
  deleteMealSlot: vi.fn(),
  addOption: vi.fn(),
  updateOption: vi.fn(),
  deleteOption: vi.fn(),
  addFoodItem: vi.fn(),
  updateFoodItem: vi.fn(),
  deleteFoodItem: vi.fn(),
  addExtra: vi.fn(),
  updateExtra: vi.fn(),
  deleteExtra: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    getQueryData: vi.fn(),
    setQueryData: vi.fn(),
  })),
}));

describe('usePlanUIStore', () => {
  beforeEach(() => {
    usePlanUIStore.setState({
      activeMealId: null,
      activeOptionIndex: 0,
      addFoodModalOpen: false,
      addMealModalOpen: false,
      pendingDeleteMealId: null,
      pendingDeleteItem: null,
      saveStatus: 'saved',
    });
  });

  describe('initial state', () => {
    it('has correct default values', () => {
      const state = usePlanUIStore.getState();
      expect(state.activeMealId).toBeNull();
      expect(state.activeOptionIndex).toBe(0);
      expect(state.addFoodModalOpen).toBe(false);
      expect(state.addMealModalOpen).toBe(false);
      expect(state.pendingDeleteMealId).toBeNull();
      expect(state.pendingDeleteItem).toBeNull();
      expect(state.saveStatus).toBe('saved');
    });
  });

  describe('activeMealId', () => {
    it('sets active meal id', () => {
      usePlanUIStore.getState().setActiveMealId('meal-1');
      expect(usePlanUIStore.getState().activeMealId).toBe('meal-1');
    });

    it('resets active option index when meal changes', () => {
      usePlanUIStore.setState({ activeOptionIndex: 3 });
      usePlanUIStore.getState().setActiveMealId('meal-2');
      expect(usePlanUIStore.getState().activeOptionIndex).toBe(0);
    });

    it('clears active meal id with null', () => {
      usePlanUIStore.setState({ activeMealId: 'meal-1' });
      usePlanUIStore.getState().setActiveMealId(null);
      expect(usePlanUIStore.getState().activeMealId).toBeNull();
    });
  });

  describe('activeOptionIndex', () => {
    it('sets active option index', () => {
      usePlanUIStore.getState().setActiveOptionIndex(2);
      expect(usePlanUIStore.getState().activeOptionIndex).toBe(2);
    });
  });

  describe('modal state', () => {
    it('opens add food modal', () => {
      usePlanUIStore.getState().setAddFoodModalOpen(true);
      expect(usePlanUIStore.getState().addFoodModalOpen).toBe(true);
    });

    it('closes add food modal', () => {
      usePlanUIStore.setState({ addFoodModalOpen: true });
      usePlanUIStore.getState().setAddFoodModalOpen(false);
      expect(usePlanUIStore.getState().addFoodModalOpen).toBe(false);
    });

    it('opens add meal modal', () => {
      usePlanUIStore.getState().setAddMealModalOpen(true);
      expect(usePlanUIStore.getState().addMealModalOpen).toBe(true);
    });

    it('closes add meal modal', () => {
      usePlanUIStore.setState({ addMealModalOpen: true });
      usePlanUIStore.getState().setAddMealModalOpen(false);
      expect(usePlanUIStore.getState().addMealModalOpen).toBe(false);
    });
  });

  describe('save status', () => {
    it('starts as saved', () => {
      expect(usePlanUIStore.getState().saveStatus).toBe('saved');
    });

    it('transitions from saved to saving', () => {
      usePlanUIStore.getState().setSaveStatus('saving');
      expect(usePlanUIStore.getState().saveStatus).toBe('saving');
    });

    it('transitions from saving to saved', () => {
      usePlanUIStore.setState({ saveStatus: 'saving' });
      usePlanUIStore.getState().setSaveStatus('saved');
      expect(usePlanUIStore.getState().saveStatus).toBe('saved');
    });

    it('transitions from saving to error', () => {
      usePlanUIStore.setState({ saveStatus: 'saving' });
      usePlanUIStore.getState().setSaveStatus('error');
      expect(usePlanUIStore.getState().saveStatus).toBe('error');
    });

    it('can return to saved from error', () => {
      usePlanUIStore.setState({ saveStatus: 'error' });
      usePlanUIStore.getState().setSaveStatus('saved');
      expect(usePlanUIStore.getState().saveStatus).toBe('saved');
    });
  });

  describe('pending delete', () => {
    it('sets pending delete meal id', () => {
      usePlanUIStore.getState().setPendingDeleteMealId('meal-1');
      expect(usePlanUIStore.getState().pendingDeleteMealId).toBe('meal-1');
    });

    it('clears pending delete meal id with null', () => {
      usePlanUIStore.setState({ pendingDeleteMealId: 'meal-1' });
      usePlanUIStore.getState().setPendingDeleteMealId(null);
      expect(usePlanUIStore.getState().pendingDeleteMealId).toBeNull();
    });

    it('sets pending delete item', () => {
      const item = { mealId: 'm1', optionId: 'o1', itemId: 'i1', name: 'Banana' };
      usePlanUIStore.getState().setPendingDeleteItem(item);
      expect(usePlanUIStore.getState().pendingDeleteItem).toEqual(item);
    });

    it('clears pending delete item with null', () => {
      usePlanUIStore.setState({ pendingDeleteItem: { mealId: 'm1', optionId: 'o1', itemId: 'i1', name: 'Banana' } });
      usePlanUIStore.getState().setPendingDeleteItem(null);
      expect(usePlanUIStore.getState().pendingDeleteItem).toBeNull();
    });
  });
});