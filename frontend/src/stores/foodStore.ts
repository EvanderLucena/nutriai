import { create } from 'zustand';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as foodApi from '../api/foods';
import type { FoodCategory, FoodCategoryKey } from '../types/food';
import { mapFoodFromApi } from '../types/food';
import { useToastStore } from './toastStore';

// Zustand store for client-side UI state (filters, modals, selection)
interface FoodUIState {
  searchQuery: string;
  categoryFilter: FoodCategory;
  currentPage: number;
  pageSize: number;
  createModalOpen: boolean;
  editingFoodId: string | null;
  setSearchQuery: (q: string) => void;
  setCategoryFilter: (c: FoodCategory) => void;
  setCurrentPage: (p: number) => void;
  setCreateModalOpen: (open: boolean) => void;
  setEditingFoodId: (id: string | null) => void;
}

export const useFoodUIStore = create<FoodUIState>()((set) => ({
  searchQuery: '',
  categoryFilter: 'Todos',
  currentPage: 0,
  pageSize: 12,
  createModalOpen: false,
  editingFoodId: null,
  setSearchQuery: (q) => set({ searchQuery: q, currentPage: 0 }),
  setCategoryFilter: (c) => set({ categoryFilter: c, currentPage: 0 }),
  setCurrentPage: (p) => set({ currentPage: p }),
  setCreateModalOpen: (open) => set({ createModalOpen: open }),
  setEditingFoodId: (id) => set({ editingFoodId: id }),
}));

// TanStack Query hook for food catalog with server-side search/filter/pagination
export function useFoodCatalog() {
  const { searchQuery, categoryFilter, currentPage, pageSize } = useFoodUIStore();

  return useQuery({
    queryKey: ['foods', searchQuery, categoryFilter, currentPage, pageSize],
    queryFn: async () => {
      const response = await foodApi.listFoods({
        page: currentPage,
        size: pageSize,
        search: searchQuery || undefined,
        category: categoryFilter !== 'Todos' ? (categoryFilter as FoodCategoryKey) : undefined,
      });
      return {
        content: response.data.content.map(mapFoodFromApi),
        page: response.data.page,
        size: response.data.size,
        total: response.data.total,
      };
    },
    retry: 2,
    staleTime: 30_000,
  });
}

// TanStack Query hook for food search (used in AddFoodModal)
export function useFoodSearch(query: string) {
  return useQuery({
    queryKey: ['foods', 'search', query],
    queryFn: async () => {
      if (!query) return [];
      const response = await foodApi.listFoods({
        search: query,
        page: 0,
        size: 10,
      });
      return response.data.content.map(mapFoodFromApi);
    },
    enabled: !!query,
    staleTime: 10_000,
  });
}

// Mutation hook for create food
export function useCreateFood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: foodApi.createFood,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods'] });
    },
    onError: () => {
      useToastStore.getState().showError('Erro ao criar alimento — tente novamente');
    },
  });
}

// Mutation hook for update food
export function useUpdateFood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: foodApi.UpdateFoodRequest }) =>
      foodApi.updateFood(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods'] });
    },
    onError: () => {
      useToastStore.getState().showError('Erro ao atualizar alimento — tente novamente');
    },
  });
}

// Mutation hook for delete food
export function useDeleteFood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: foodApi.deleteFood,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods'] });
    },
    onError: () => {
      useToastStore.getState().showError('Erro ao excluir alimento — tente novamente');
    },
  });
}