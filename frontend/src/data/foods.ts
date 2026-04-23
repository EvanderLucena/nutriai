import type { Food } from '../types/food';

export const FOODS_CATALOG: Food[] = [
  { id: 'f1', name: 'Arroz integral cozido', category: 'Carboidrato', unit: 'GRAMAS', referenceAmount: 100, kcal: 124, prot: 2.6, carb: 25, fat: 1, fiber: 2.7, prep: 'cozido', portionLabel: '1 concha · 80g', used: 38 },
  { id: 'f2', name: 'Frango desfiado cozido', category: 'Proteína', unit: 'GRAMAS', referenceAmount: 100, kcal: 165, prot: 31, carb: 0, fat: 3.6, fiber: 0, prep: 'cozido e desfiado', portionLabel: '1 filé pequeno · 100g', used: 52 },
  { id: 'f3', name: 'Batata-doce cozida', category: 'Carboidrato', unit: 'GRAMAS', referenceAmount: 100, kcal: 86, prot: 1.6, carb: 20, fat: 0.1, fiber: 3, prep: 'cozida', portionLabel: '1 unidade média · 180g', used: 29 },
  { id: 'f4', name: 'Ovo de galinha inteiro', category: 'Proteína', unit: 'UNIDADE', referenceAmount: 1, kcal: 143, prot: 13, carb: 0.7, fat: 9.5, fiber: 0, prep: 'cozido', portionLabel: '1 unidade · ~50g', used: 47 },
  { id: 'f5', name: 'Azeite extra-virgem', category: 'Gordura', unit: 'ML', referenceAmount: 100, kcal: 884, prot: 0, carb: 0, fat: 100, fiber: 0, prep: '', portionLabel: '1 colher de sopa · 13ml', used: 61 },
  { id: 'f6', name: 'Banana prata', category: 'Fruta', unit: 'UNIDADE', referenceAmount: 1, kcal: 98, prot: 1.3, carb: 26, fat: 0.1, fiber: 2, prep: '', portionLabel: '1 unidade média · ~120g', used: 33 },
  { id: 'f7', name: 'Brócolis cozido', category: 'Vegetal', unit: 'GRAMAS', referenceAmount: 100, kcal: 35, prot: 2.4, carb: 7, fat: 0.4, fiber: 3.3, prep: 'cozido no vapor', portionLabel: '1 xícara · 90g', used: 22 },
  { id: 'f8', name: 'Salmão grelhado', category: 'Proteína', unit: 'GRAMAS', referenceAmount: 100, kcal: 208, prot: 22, carb: 0, fat: 13, fiber: 0, prep: 'grelhado', portionLabel: '1 posta média · 150g', used: 18 },
  { id: 'f9', name: 'Feijão carioca cozido', category: 'Carboidrato', unit: 'GRAMAS', referenceAmount: 100, kcal: 77, prot: 4.8, carb: 14, fat: 0.5, fiber: 8, prep: 'cozido', portionLabel: '1 concha média · 90g', used: 41 },
  { id: 'f10', name: 'Queijo branco', category: 'Proteína', unit: 'GRAMAS', referenceAmount: 100, kcal: 240, prot: 18, carb: 3, fat: 17, fiber: 0, prep: '', portionLabel: '1 fatia · 30g', used: 14 },
  { id: 'f11', name: 'Aveia em flocos', category: 'Carboidrato', unit: 'GRAMAS', referenceAmount: 100, kcal: 389, prot: 17, carb: 66, fat: 7, fiber: 11, prep: '', portionLabel: '1 colher de sopa · 15g', used: 27 },
  { id: 'f12', name: 'Tofu firme', category: 'Proteína', unit: 'GRAMAS', referenceAmount: 100, kcal: 144, prot: 17, carb: 3, fat: 8, fiber: 2, prep: '', portionLabel: '1 fatia · 80g', used: 9 },
  { id: 'p1', name: 'Omelete 2 ovos + queijo branco', category: 'Proteína', unit: 'UNIDADE', referenceAmount: 1, kcal: 358, prot: 34, carb: 2, fat: 22, fiber: 0, prep: 'frito com azeite', portionLabel: '1 unidade · ~130g', used: 25 },
  { id: 'p2', name: 'Mix castanhas', category: 'Gordura', unit: 'GRAMAS', referenceAmount: 100, kcal: 617, prot: 17, carb: 18, fat: 54, fiber: 8, prep: '', portionLabel: '1 porção · 30g', used: 31 },
  { id: 'p3', name: 'Whey protein baunilha', category: 'Proteína', unit: 'GRAMAS', referenceAmount: 100, kcal: 400, prot: 80, carb: 10, fat: 5, fiber: 0, prep: 'misturado com água', portionLabel: '1 scoop · 30g', used: 19 },
  { id: 'p4', name: 'Iogurte natural integral', category: 'Proteína', unit: 'GRAMAS', referenceAmount: 100, kcal: 61, prot: 3.2, carb: 4.7, fat: 3.3, fiber: 0, prep: '', portionLabel: '1 pote · 170g', used: 12 },
];

export const FOOD_CATEGORIES = ['Todos', 'Proteína', 'Carboidrato', 'Gordura', 'Vegetal', 'Fruta', 'Bebida', 'Outro'] as const;