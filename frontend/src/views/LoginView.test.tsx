import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginView } from './LoginView';

// Mock react-router and auth store
vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

vi.mock('../stores/authStore', () => ({
  useAuthStore: () => vi.fn(),
}));

describe('LoginView - Disabled Submit Button', () => {
  it('submit button is disabled when email and password are empty', () => {
    render(<LoginView />);

    const submitButton = screen.getByRole('button', { name: /entrar/i });
    expect(submitButton).toBeDisabled();
  });

  it('submit button is disabled when email is filled but password is empty', () => {
    render(<LoginView />);

    const emailInput = screen.getByPlaceholderText(/seu@email/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(submitButton).toBeDisabled();
  });

  it('submit button is enabled when both email and password have values', () => {
    render(<LoginView />);

    const emailInput = screen.getByPlaceholderText(/seu@email/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(submitButton).not.toBeDisabled();
  });

  it('submit button has opacity 0.45 when disabled', () => {
    render(<LoginView />);

    const submitButton = screen.getByRole('button', { name: /entrar/i });
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveStyle({ opacity: 0.45 });
  });
});