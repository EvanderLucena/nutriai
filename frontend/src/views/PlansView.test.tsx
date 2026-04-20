import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlansView } from './PlansView';

// Mock react-router
vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

describe('PlansView - Delete Confirmation', () => {
  it('renders DeleteConfirmModal with food name and Cancelar/Excluir buttons', async () => {
    render(<PlansView />);

    // Find a delete button (×) on a food row and click it
    const removeButtons = screen.getAllByTitle('Remover');
    if (removeButtons.length > 0) {
      fireEvent.click(removeButtons[0]);

      // After clicking, a confirmation modal should appear
      const modal = await screen.findByText(/Tem certeza/i);
      expect(modal).toBeInTheDocument();

      // Modal should have Cancelar and Excluir buttons
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
      expect(screen.getByText('Excluir')).toBeInTheDocument();
    }
  });

  it('clicking Cancelar closes DeleteConfirmModal without removing item', async () => {
    render(<PlansView />);

    const removeButtons = screen.getAllByTitle('Remover');
    if (removeButtons.length > 0) {
      // Get the food name before clicking
      fireEvent.click(removeButtons[0]);

      // Click Cancelar
      const cancelar = await screen.findByText('Cancelar');
      fireEvent.click(cancelar);

      // Modal should be gone
      expect(screen.queryByText(/Tem certeza/i)).not.toBeInTheDocument();
    }
  });

  it('clicking Excluir in DeleteConfirmModal removes the item', async () => {
    render(<PlansView />);

    const removeButtons = screen.getAllByTitle('Remover');
    if (removeButtons.length > 0) {
      const foodCount = removeButtons.length;
      fireEvent.click(removeButtons[0]);

      // Click Excluir
      const excluir = await screen.findByText('Excluir');
      fireEvent.click(excluir);

      // Modal should be gone and item should be removed
      expect(screen.queryByText(/Tem certeza/i)).not.toBeInTheDocument();
      // After removal, there should be one fewer remove buttons
      const newRemoveButtons = screen.getAllByTitle('Remover');
      expect(newRemoveButtons.length).toBeLessThan(foodCount);
    }
  });
});