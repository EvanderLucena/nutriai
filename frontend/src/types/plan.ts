export interface MealFood {
  id: string;
  foodId: string | null;     // nullable — D-10: survives catalog deletion
  foodName: string;           // frozen display name
  qty: string;                // free text "1 unidade"
  grams: number;              // numeric for calculation
  prep: string;               // "grelhado"
  kcal: number;               // frozen macro
  prot: number;               // frozen macro
  carb: number;               // frozen macro
  fat: number;                // frozen macro
}

export interface MealOption {
  id: string;
  name: string;               // "Opção 1 · Clássico"
  items: MealFood[];
}

export interface MealSlot {
  id: string;
  label: string;              // "Café da manhã"
  time: string;               // "07:00"
  options: MealOption[];
}

export interface PlanExtra {
  id: string;
  name: string;
  quantity: string;            // "350ml · lata"
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