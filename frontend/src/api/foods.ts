import { apiClient } from './client';
import type { FoodListApiResponse, FoodApiResponse } from '../types/food';

import type { FoodTypeKey, FoodCategoryKey } from '../types/food';

export interface ListFoodsParams {
  page?: number;
  size?: number;
  search?: string;
  category?: FoodCategoryKey;
}

export interface CreateFoodRequest {
  type: FoodTypeKey;
  name: string;
  category: FoodCategoryKey;
  per100Kcal?: number | null;
  per100Prot?: number | null;
  per100Carb?: number | null;
  per100Fat?: number | null;
  per100Fiber?: number | null;
  presetGrams?: number | null;
  presetKcal?: number | null;
  presetProt?: number | null;
  presetCarb?: number | null;
  presetFat?: number | null;
  portionLabel?: string | null;
  basedOn?: string | null;
  portions?: Array<{ name: string; grams: number }> | null;
}

export interface UpdateFoodRequest extends Partial<CreateFoodRequest> {}

export async function listFoods(params: ListFoodsParams = {}): Promise<FoodListApiResponse> {
  const response = await apiClient.get<{ success: boolean; data: FoodListApiResponse }>('/foods', { params });
  return response.data.data;
}

export async function createFood(data: CreateFoodRequest): Promise<FoodApiResponse> {
  const response = await apiClient.post<{ success: boolean; data: FoodApiResponse }>('/foods', data);
  return response.data.data;
}

export async function updateFood(id: string, data: UpdateFoodRequest): Promise<FoodApiResponse> {
  const response = await apiClient.patch<{ success: boolean; data: FoodApiResponse }>(`/foods/${id}`, data);
  return response.data.data;
}

export async function deleteFood(id: string): Promise<void> {
  await apiClient.delete(`/foods/${id}`);
}