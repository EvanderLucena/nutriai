import { create } from 'zustand';

type AuthViewType = 'landing' | 'login' | 'signup' | null;

interface AuthState {
  isAuthenticated: boolean;
  authView: AuthViewType;
  login: () => void;
  logout: () => void;
  setAuthView: (view: AuthViewType) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: localStorage.getItem('nutriai.auth') === 'true',
  authView: null as AuthViewType,
  login: () => {
    localStorage.setItem('nutriai.auth', 'true');
    set({ isAuthenticated: true, authView: null });
  },
  logout: () => {
    localStorage.removeItem('nutriai.auth');
    set({ isAuthenticated: false, authView: 'landing' });
  },
  setAuthView: (view) => set({ authView: view }),
}));