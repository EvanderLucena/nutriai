import { create } from 'zustand';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as planApi from '../api/plans';
import type { MealPlan, MealFood } from '../types/plan';
import { useToastStore } from './toastStore';

// Save status type
export type SaveStatus = 'saved' | 'saving' | 'error';

// Zustand store for client-side UI state
interface PlanUIState {
  activeMealId: string | null;
  activeOptionIndex: number;
  addFoodModalOpen: boolean;
  addMealModalOpen: boolean;
  pendingDeleteMealId: string | null;
  pendingDeleteItem: { mealId: string; optionId: string; itemId: string; name: string } | null;
  saveStatus: SaveStatus;
  setActiveMealId: (id: string | null) => void;
  setActiveOptionIndex: (idx: number) => void;
  setAddFoodModalOpen: (open: boolean) => void;
  setAddMealModalOpen: (open: boolean) => void;
  setPendingDeleteMealId: (id: string | null) => void;
  setPendingDeleteItem: (item: PlanUIState['pendingDeleteItem']) => void;
  setSaveStatus: (status: SaveStatus) => void;
}

export const usePlanUIStore = create<PlanUIState>()((set) => ({
  activeMealId: null,
  activeOptionIndex: 0,
  addFoodModalOpen: false,
  addMealModalOpen: false,
  pendingDeleteMealId: null,
  pendingDeleteItem: null,
  saveStatus: 'saved',
  setActiveMealId: (id) => set({ activeMealId: id, activeOptionIndex: 0 }),
  setActiveOptionIndex: (idx) => set({ activeOptionIndex: idx }),
  setAddFoodModalOpen: (open) => set({ addFoodModalOpen: open }),
  setAddMealModalOpen: (open) => set({ addMealModalOpen: open }),
  setPendingDeleteMealId: (id) => set({ pendingDeleteMealId: id }),
  setPendingDeleteItem: (item) => set({ pendingDeleteItem: item }),
  setSaveStatus: (status) => set({ saveStatus: status }),
}));

// Helper: update save status with auto-clear error after 3 seconds
function withSaveStatus(
  queryClient: ReturnType<typeof useQueryClient>,
  patientId: string,
) {
  return {
    onMutate: () => {
      usePlanUIStore.getState().setSaveStatus('saving');
    },
    onError: () => {
      usePlanUIStore.getState().setSaveStatus('error');
      useToastStore.getState().showError('Erro ao salvar plano — tente novamente');
      setTimeout(() => {
        usePlanUIStore.getState().setSaveStatus('saved');
      }, 3000);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['plan', patientId] });
    },
  };
}

// TanStack Query hook for plan data
export function usePlan(patientId: string | null) {
  return useQuery({
    queryKey: ['plan', patientId],
    queryFn: () => {
      if (!patientId) throw new Error('Patient ID is required');
      return planApi.getPlan(patientId);
    },
    enabled: !!patientId,
    staleTime: 0,
  });
}

// Mutation hooks for plan operations

export function useUpdatePlan(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: planApi.UpdatePlanRequest) => planApi.updatePlan(patientId, data),
    onMutate: async (data) => {
      usePlanUIStore.getState().setSaveStatus('saving');
      // Optimistic update
      const previousPlan = queryClient.getQueryData<MealPlan>(['plan', patientId]);
      if (previousPlan) {
        queryClient.setQueryData(['plan', patientId], { ...previousPlan, ...data });
      }
      return { previousPlan };
    },
    onError: (_, __, context) => {
      if (context?.previousPlan) {
        queryClient.setQueryData(['plan', patientId], context.previousPlan);
      }
      usePlanUIStore.getState().setSaveStatus('error');
      setTimeout(() => usePlanUIStore.getState().setSaveStatus('saved'), 3000);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['plan', patientId] });
    },
    onSuccess: () => {
      usePlanUIStore.getState().setSaveStatus('saved');
    },
  });
}

export function useAddMealSlot(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: planApi.AddMealSlotRequest) => planApi.addMealSlot(patientId, data),
    ...withSaveStatus(queryClient, patientId),
    onSuccess: () => {
      usePlanUIStore.getState().setSaveStatus('saved');
    },
  });
}

export function useDeleteMealSlot(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mealId: string) => planApi.deleteMealSlot(patientId, mealId),
    ...withSaveStatus(queryClient, patientId),
    onSuccess: () => {
      usePlanUIStore.getState().setSaveStatus('saved');
    },
  });
}

export function useUpdateMealSlot(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mealId, data }: { mealId: string; data: planApi.UpdateMealSlotRequest }) =>
      planApi.updateMealSlot(patientId, mealId, data),
    ...withSaveStatus(queryClient, patientId),
    onSuccess: () => {
      usePlanUIStore.getState().setSaveStatus('saved');
    },
  });
}

export function useAddOption(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mealId, data }: { mealId: string; data: planApi.AddOptionRequest }) =>
      planApi.addOption(patientId, mealId, data),
    ...withSaveStatus(queryClient, patientId),
    onSuccess: () => {
      usePlanUIStore.getState().setSaveStatus('saved');
    },
  });
}

export function useDeleteOption(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mealId, optionId }: { mealId: string; optionId: string }) =>
      planApi.deleteOption(patientId, mealId, optionId),
    ...withSaveStatus(queryClient, patientId),
    onSuccess: () => {
      usePlanUIStore.getState().setSaveStatus('saved');
    },
  });
}

export function useUpdateOption(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mealId, optionId, data }: { mealId: string; optionId: string; data: planApi.UpdateOptionRequest }) =>
      planApi.updateOption(patientId, mealId, optionId, data),
    ...withSaveStatus(queryClient, patientId),
    onSuccess: () => {
      usePlanUIStore.getState().setSaveStatus('saved');
    },
  });
}

export function useAddFoodItem(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mealId, optionId, data }: { mealId: string; optionId: string; data: planApi.AddFoodItemRequest }) =>
      planApi.addFoodItem(patientId, mealId, optionId, data),
    onMutate: ({ mealId, optionId, data }) => {
      usePlanUIStore.getState().setSaveStatus('saving');
      // Optimistic add — show item with placeholder macros
      const previousPlan = queryClient.getQueryData<MealPlan>(['plan', patientId]);
      if (previousPlan) {
        const updatedPlan = { ...previousPlan };
        const meal = updatedPlan.meals.find((m) => m.id === mealId);
        if (meal) {
          const option = meal.options.find((o) => o.id === optionId);
          if (option) {
            const placeholderItem: MealFood = {
              id: `temp-${Date.now()}`,
              foodId: data.foodId,
              foodName: '',
              qty: data.qty,
              grams: data.grams,
              prep: '-',
              kcal: 0,
              prot: 0,
              carb: 0,
              fat: 0,
            };
            option.items = [...option.items, placeholderItem];
            queryClient.setQueryData(['plan', patientId], updatedPlan);
          }
        }
      }
      return { previousPlan };
    },
    onError: (_, __, context) => {
      if (context?.previousPlan) {
        queryClient.setQueryData(['plan', patientId], context.previousPlan);
      }
      usePlanUIStore.getState().setSaveStatus('error');
      setTimeout(() => usePlanUIStore.getState().setSaveStatus('saved'), 3000);
    },
    onSuccess: () => {
      usePlanUIStore.getState().setSaveStatus('saved');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['plan', patientId] });
    },
  });
}

export function useUpdateFoodItem(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mealId, optionId, itemId, data }: { mealId: string; optionId: string; itemId: string; data: planApi.UpdateFoodItemRequest }) =>
      planApi.updateFoodItem(patientId, mealId, optionId, itemId, data),
    onMutate: ({ mealId, optionId, itemId, data }) => {
      usePlanUIStore.getState().setSaveStatus('saving');
      // Optimistic update
      const previousPlan = queryClient.getQueryData<MealPlan>(['plan', patientId]);
      if (previousPlan) {
        const updatedPlan = { ...previousPlan, meals: previousPlan.meals.map((m) => {
          if (m.id !== mealId) return m;
          return {
            ...m,
            options: m.options.map((o) => {
              if (o.id !== optionId) return o;
              return {
                ...o,
                items: o.items.map((it) => {
                  if (it.id !== itemId) return it;
                  return { ...it, ...data };
                }),
              };
            }),
          };
        })};
        queryClient.setQueryData(['plan', patientId], updatedPlan);
      }
      return { previousPlan };
    },
    onError: (_, __, context) => {
      if (context?.previousPlan) {
        queryClient.setQueryData(['plan', patientId], context.previousPlan);
      }
      usePlanUIStore.getState().setSaveStatus('error');
      setTimeout(() => usePlanUIStore.getState().setSaveStatus('saved'), 3000);
    },
    onSuccess: () => {
      usePlanUIStore.getState().setSaveStatus('saved');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['plan', patientId] });
    },
  });
}

export function useDeleteFoodItem(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mealId, optionId, itemId }: { mealId: string; optionId: string; itemId: string }) =>
      planApi.deleteFoodItem(patientId, mealId, optionId, itemId),
    ...withSaveStatus(queryClient, patientId),
    onSuccess: () => {
      usePlanUIStore.getState().setSaveStatus('saved');
    },
  });
}

export function useAddExtra(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: planApi.AddExtraRequest) => planApi.addExtra(patientId, data),
    ...withSaveStatus(queryClient, patientId),
    onSuccess: () => {
      usePlanUIStore.getState().setSaveStatus('saved');
    },
  });
}

export function useUpdateExtra(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ extraId, data }: { extraId: string; data: planApi.UpdateExtraRequest }) =>
      planApi.updateExtra(patientId, extraId, data),
    ...withSaveStatus(queryClient, patientId),
    onSuccess: () => {
      usePlanUIStore.getState().setSaveStatus('saved');
    },
  });
}

export function useDeleteExtra(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (extraId: string) => planApi.deleteExtra(patientId, extraId),
    ...withSaveStatus(queryClient, patientId),
    onSuccess: () => {
      usePlanUIStore.getState().setSaveStatus('saved');
    },
  });
}