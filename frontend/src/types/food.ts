export type FoodTypeKey = 'BASE' | 'PRESET';
export type FoodType = 'base' | 'preset';

export const FOOD_TYPE_KEYS: FoodTypeKey[] = ['BASE', 'PRESET'];

export const FOOD_TYPE_LABELS: Record<FoodTypeKey, string> = {
  BASE: 'Base (por 100g)',
  PRESET: 'Preset (porção pronta)',
};

export type FoodCategoryKey = 'PROTEINA' | 'CARBOIDRATO' | 'GORDURA' | 'VEGETAL' | 'FRUTA' | 'BEBIDA' | 'OUTRO';
export type FoodCategory = 'Todos' | FoodCategoryKey;

export const FOOD_CATEGORY_KEYS: FoodCategoryKey[] = [
  'PROTEINA',
  'CARBOIDRATO',
  'GORDURA',
  'VEGETAL',
  'FRUTA',
  'BEBIDA',
  'OUTRO',
];

export const FOOD_CATEGORY_LABELS: Record<FoodCategoryKey, string> = {
  PROTEINA: 'Proteína',
  CARBOIDRATO: 'Carboidrato',
  GORDURA: 'Gordura',
  VEGETAL: 'Vegetal',
  FRUTA: 'Fruta',
  BEBIDA: 'Bebida',
  OUTRO: 'Outro',
};

export const REVERSE_CATEGORY_LABELS: Record<string, FoodCategoryKey> = Object.fromEntries(
  Object.entries(FOOD_CATEGORY_LABELS).map(([k, v]) => [v, k as FoodCategoryKey])
) as Record<string, FoodCategoryKey>;

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

export const FOOD_CATEGORIES: FoodCategory[] = ['Todos', ...FOOD_CATEGORY_KEYS];

// API response types

export interface FoodPortionResponse {
  id: string;
  name: string;
  grams: number;
}

export interface FoodApiResponse {
  id: string;
  type: string;
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
  basedOn: string | null;
  portions: FoodPortionResponse[];
  usedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FoodListApiResponse {
  content: FoodApiResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

function normalizeType(raw: string): FoodType {
  return raw.toUpperCase() === 'BASE' ? 'base' : 'preset';
}

function normalizeCategoryLabel(raw: string): string {
  return FOOD_CATEGORY_LABELS[raw as FoodCategoryKey] || raw;
}

export function mapFoodFromApi(api: FoodApiResponse): Food {
  const foodType = normalizeType(api.type);
  const categoryLabel = normalizeCategoryLabel(api.category);
  if (foodType === 'base') {
    return {
      id: api.id,
      type: 'base',
      name: api.name,
      category: categoryLabel,
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
      category: categoryLabel,
      portionLabel: api.portionLabel ?? '',
      grams: api.presetGrams ?? 0,
      nutrition: {
        kcal: api.presetKcal ?? 0,
        prot: api.presetProt ?? 0,
        carb: api.presetCarb ?? 0,
        fat: api.presetFat ?? 0,
      },
      basedOn: api.basedOn ?? '',
      used: api.usedCount,
    };
  }
}