export interface MealFood {
  id: string;
  foodId: string | null;
  foodName: string;
  referenceAmount: number;
  unit: string;
  prep: string;
  kcal: number;
  prot: number;
  carb: number;
  fat: number;
}

export interface MealOption {
  id: string;
  name: string;
  items: MealFood[];
}

export interface MealSlot {
  id: string;
  label: string;
  time: string;
  options: MealOption[];
}

export interface PlanExtra {
  id: string;
  name: string;
  quantity: string;
  kcal: number;
  prot: number;
  carb: number;
  fat: number;
}

export interface MealPlan {
  id: string;
  episodeId: string;
  title: string;
  notes: string;
  kcalTarget: number;
  protTarget: number;
  carbTarget: number;
  fatTarget: number;
  meals: MealSlot[];
  extras: PlanExtra[];
  createdAt: string;
  updatedAt: string;
}