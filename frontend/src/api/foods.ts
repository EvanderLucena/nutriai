import { apiClient } from './client';
import type { FoodListApiResponse, FoodApiResponse } from '../types/food';

export interface ListFoodsParams {
  page?: number;
  size?: number;
  search?: string;
  category?: string;
}

export interface CreateFoodRequest {
  type: string;
  name: string;
  category: string;
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
  portions?: Array<{ name: string; grams: number }> | null;
}

export interface UpdateFoodRequest extends Partial<CreateFoodRequest> {}

export async function listFoods(params: ListFoodsParams = {}): Promise<FoodListApiResponse> {
  const response = await apiClient.get<FoodListApiResponse>('/foods', { params });
  return response.data;
}

export async function createFood(data: CreateFoodRequest): Promise<FoodApiResponse> {
  const response = await apiClient.post<FoodApiResponse>('/foods', data);
  return response.data;
}

export async function updateFood(id: string, data: UpdateFoodRequest): Promise<FoodApiResponse> {
  const response = await apiClient.patch<FoodApiResponse>(`/foods/${id}`, data);
  return response.data;
}

export async function deleteFood(id: string): Promise<void> {
  await apiClient.delete(`/foods/${id}`);
}