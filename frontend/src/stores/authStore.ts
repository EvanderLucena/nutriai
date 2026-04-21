import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authService from '../api/auth';
import type { AuthUser, SignupRequest, MeResponse } from '../types';

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;

  // Auth actions
  signup: (data: SignupRequest) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<string>;
  clearError: () => void;

  // Initialize from stored state
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,

      signup: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.signup(data);
          set({
            isAuthenticated: true,
            user: response.user,
            accessToken: response.accessToken,
            isLoading: false,
          });
        } catch (err: unknown) {
          const message = (err as { message?: string })?.message || 'Erro ao criar conta.';
          set({
            isLoading: false,
            error: message,
          });
          throw err;
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login({ email, password });
          set({
            isAuthenticated: true,
            user: response.user,
            accessToken: response.accessToken,
            isLoading: false,
          });
        } catch (err: unknown) {
          const message = (err as { message?: string })?.message || 'Credenciais inválidas.';
          set({
            isAuthenticated: false,
            user: null,
            accessToken: null,
            isLoading: false,
            error: message,
          });
          throw err;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch {
          // Even if logout API call fails, clear local state
        }
        set({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          error: null,
        });
      },

      refreshAuth: async () => {
        try {
          const response = await authService.refreshAuth();
          set({
            accessToken: response.accessToken,
            user: response.user,
            isAuthenticated: true,
          });
          return response.accessToken;
        } catch {
          set({
            isAuthenticated: false,
            user: null,
            accessToken: null,
          });
          throw new Error('Session expired');
        }
      },

      clearError: () => set({ error: null }),

      initializeAuth: async () => {
        // Clean up old mock auth key
        const oldAuth = localStorage.getItem('nutriai.auth');
        if (oldAuth === 'true') {
          localStorage.removeItem('nutriai.auth');
        }

        const token = get().accessToken;
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }
        try {
          const user: MeResponse = await authService.getCurrentUser();
          set({
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role as AuthUser['role'],
              onboardingCompleted: user.onboardingCompleted,
            },
            isAuthenticated: true,
          });
        } catch {
          // Access token might be expired, try refresh
          try {
            await get().refreshAuth();
            // refreshAuth already set state
          } catch {
            set({ isAuthenticated: false, user: null, accessToken: null });
          }
        }
      },
    }),
    {
      name: 'nutriai-auth',
      // Only persist user info and isAuthenticated — NOT accessToken (stored in memory)
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    },
  ),
);