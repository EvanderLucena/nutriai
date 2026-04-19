import axios from 'axios';
import type { ApiResponse } from '../types';

/**
 * Axios instance configured for NutriAI backend API.
 * Base URL points to /api/v1 — proxied to backend:8080 in dev via Vite proxy.
 */
export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — auth token placeholder (real auth added in Phase 3)
apiClient.interceptors.request.use(
  (config) => {
    // TODO: Phase 3 — attach JWT token from auth store
    // const token = useAuthStore.getState().token;
    // if (token) { config.headers.Authorization = `Bearer ${token}`; }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — normalize API error shape
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response) {
      const apiError: ApiResponse<null> = {
        success: false,
        data: null,
        errors: error.response.data?.errors || [error.message],
        message: error.response.data?.message || error.message,
      };
      return Promise.reject(apiError);
    }
    return Promise.reject(error);
  },
);