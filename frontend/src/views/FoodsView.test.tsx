import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FoodsView } from './FoodsView';
import type { Food } from '../types/food';

vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

const mockFood1: Food = {
  id: 'f1',
  name: 'Aveia em flocos',
  category: 'Carboidrato',
  unit: 'GRAMAS',
  referenceAmount: 100,
  kcal: 389,
  prot: 17,
  carb: 66,
  fat: 7,
  fiber: 11,
  prep: '',
  portionLabel: '1 colher de sopa · 15g',
  used: 3,
};

const mockFood2: Food = {
  id: 'f2',
  name: 'Frango grelhado',
  category: 'Proteína',
  unit: 'GRAMAS',
  referenceAmount: 100,
  kcal: 165,
  prot: 31,
  carb: 0,
  fat: 3.6,
  fiber: 0,
  prep: 'grelhado',
  portionLabel: '1 filé pequeno · 100g',
  used: 5,
};

const mockFoodData = {
  content: [mockFood1, mockFood2],
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
    expect(screen.getByText('Frango grelhado')).toBeInTheDocument();
  });

  it('renders macro values for foods', () => {
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

  it('renders reference amount for foods', () => {
    render(<FoodsView />);
    expect(screen.getAllByText(/por 100g/).length).toBeGreaterThanOrEqual(1);
  });
});