export type FoodType = 'base' | 'preset';

export type FoodCategory =
  | 'Todos'
  | 'Proteína'
  | 'Carboidrato'
  | 'Gordura'
  | 'Vegetal'
  | 'Fruta'
  | 'Bebida'
  | 'Outro';

export interface FoodPer100 {
  kcal: number;
  prot: number;
  carb: number;
  fat: number;
  fiber: number;
}

export interface FoodPortion {
  name: string;
  grams: number;
}

export interface Food {
  id: string;
  type: FoodType;
  name: string;
  category: string;
  per100?: FoodPer100;
  portions?: FoodPortion[];
  portionLabel?: string;
  grams?: number;
  nutrition?: { kcal: number; prot: number; carb: number; fat: number };
  basedOn?: string;
  used: number;
}

export const FOOD_CATEGORIES: FoodCategory[] = [
  'Todos',
  'Proteína',
  'Carboidrato',
  'Gordura',
  'Vegetal',
  'Fruta',
  'Bebida',
  'Outro',
];