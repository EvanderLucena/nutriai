import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FoodsView } from './FoodsView';
import type { Food } from '../types/food';

vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

const mockBaseFood: Food = {
  id: 'f1',
  type: 'base',
  name: 'Aveia em flocos',
  category: 'Carboidrato',
  per100: { kcal: 389, prot: 17, carb: 66, fat: 7, fiber: 11 },
  portions: [{ name: '1 xícara', grams: 40 }],
  used: 3,
};

const mockPresetFood: Food = {
  id: 'f2',
  type: 'preset',
  name: 'Frango grelhado 100g',
  category: 'Proteína',
  portionLabel: '1 porção · 100g',
  grams: 100,
  nutrition: { kcal: 165, prot: 31, carb: 0, fat: 4 },
  basedOn: 'Frango',
  used: 5,
};

const mockFoodData = {
  content: [mockBaseFood, mockPresetFood],
  page: 0,
  size: 12,
  total: 2,
};

vi.mock('../stores/foodStore', () => ({
  useFoodUIStore: () => ({
    searchQuery: '',
    categoryFilter: 'Todos',
    currentPage: 0,
    pageSize: 12,
    createModalOpen: false,
    editingFoodId: null,
    setSearchQuery: vi.fn(),
    setCategoryFilter: vi.fn(),
    setCurrentPage: vi.fn(),
    setCreateModalOpen: vi.fn(),
    setEditingFoodId: vi.fn(),
  }),
  useFoodCatalog: () => ({
    data: mockFoodData,
    isLoading: false,
  }),
  useCreateFood: () => ({ mutate: vi.fn() }),
  useUpdateFood: () => ({ mutate: vi.fn() }),
  useDeleteFood: () => ({ mutate: vi.fn() }),
}));

describe('FoodsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page heading "Alimentos"', () => {
    render(<FoodsView />);
    expect(screen.getByText('Alimentos')).toBeInTheDocument();
  });

  it('renders eyebrow text for catalog', () => {
    render(<FoodsView />);
    expect(screen.getByText(/Catálogo pessoal/)).toBeInTheDocument();
  });

  it('renders search input with placeholder', () => {
    render(<FoodsView />);
    expect(screen.getByPlaceholderText('Buscar no catálogo…')).toBeInTheDocument();
  });

  it('renders "Novo alimento" button', () => {
    render(<FoodsView />);
    expect(screen.getByRole('button', { name: /novo alimento/i })).toBeInTheDocument();
  });

  it('renders food names from catalog data', () => {
    render(<FoodsView />);
    expect(screen.getByText('Aveia em flocos')).toBeInTheDocument();
    expect(screen.getByText('Frango grelhado 100g')).toBeInTheDocument();
  });

  it('renders BASE chip for base-type foods', () => {
    render(<FoodsView />);
    expect(screen.getByText('BASE')).toBeInTheDocument();
  });

  it('renders PRESET chip for preset-type foods', () => {
    render(<FoodsView />);
    expect(screen.getByText('PRESET')).toBeInTheDocument();
  });

  it('renders macro values for base food (per 100g)', () => {
    render(<FoodsView />);
    expect(screen.getByText('389')).toBeInTheDocument();
  });

  it('renders "Novo alimento" button as clickable', () => {
    render(<FoodsView />);
    const btn = screen.getByRole('button', { name: /novo alimento/i });
    expect(btn).toBeEnabled();
  });

  it('renders category filter dropdown', () => {
    render(<FoodsView />);
    const select = document.querySelector('select');
    expect(select).toBeInTheDocument();
  });

  it('renders portion pills for base foods with portions', () => {
    render(<FoodsView />);
    expect(screen.getByText('1 xícara')).toBeInTheDocument();
  });
});