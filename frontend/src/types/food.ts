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

// API response types

export interface FoodPortionResponse {
  id: string;
  name: string;
  grams: number;
}

export interface FoodApiResponse {
  id: string;
  type: FoodType;
  name: string;
  category: string;
  per100Kcal: number | null;
  per100Prot: number | null;
  per100Carb: number | null;
  per100Fat: number | null;
  per100Fiber: number | null;
  presetGrams: number | null;
  presetKcal: number | null;
  presetProt: number | null;
  presetCarb: number | null;
  presetFat: number | null;
  portionLabel: string | null;
  portions: FoodPortionResponse[];
  usedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FoodListApiResponse {
  success: boolean;
  data: {
    content: FoodApiResponse[];
    page: number;
    size: number;
    total: number;
  };
}

export function mapFoodFromApi(api: FoodApiResponse): Food {
  if (api.type === 'base') {
    return {
      id: api.id,
      type: 'base',
      name: api.name,
      category: api.category,
      per100: {
        kcal: api.per100Kcal ?? 0,
        prot: api.per100Prot ?? 0,
        carb: api.per100Carb ?? 0,
        fat: api.per100Fat ?? 0,
        fiber: api.per100Fiber ?? 0,
      },
      portions: api.portions.map((p) => ({ name: p.name, grams: p.grams })),
      used: api.usedCount,
    };
  } else {
    return {
      id: api.id,
      type: 'preset',
      name: api.name,
      category: api.category,
      portionLabel: api.portionLabel ?? '',
      grams: api.presetGrams ?? 0,
      nutrition: {
        kcal: api.presetKcal ?? 0,
        prot: api.presetProt ?? 0,
        carb: api.presetCarb ?? 0,
        fat: api.presetFat ?? 0,
      },
      basedOn: api.portionLabel ?? '',
      used: api.usedCount,
    };
  }
}