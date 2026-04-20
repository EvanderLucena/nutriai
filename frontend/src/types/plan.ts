import type { MacroTarget } from './patient';

export interface MealFood {
  food: string;
  qty: string;
  prep: string;
  kcal: number;
  prot: number;
  carb: number;
  fat: number;
}

export interface MealOption {
  name: string;
  items: MealFood[];
}

export interface MealSlot {
  id: string;
  label: string;
  time: string;
  kcal: number;
  prot: number;
  carb: number;
  fat: number;
}

export interface PlanExtra {
  id: string;
  name: string;
  quantity: string;
  macros: MacroTarget;
}