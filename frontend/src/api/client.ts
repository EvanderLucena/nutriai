import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
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
  withCredentials: true, // IMPORTANT: send cookies (refresh token) with every request
});

// Request interceptor — attach JWT access token from auth store
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle 401 by attempting refresh
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: unknown) => void }> = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry auth endpoints (login/signup/refresh already failed)
      if (originalRequest.url?.startsWith('auth/login') ||
          originalRequest.url?.startsWith('auth/signup') ||
          originalRequest.url?.startsWith('auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await useAuthStore.getState().refreshAuth();
        failedQueue.forEach(({ resolve }) => resolve(newToken));
        failedQueue = [];
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        failedQueue.forEach(({ reject }) => reject(refreshError));
        failedQueue = [];
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Normalize error response
    if (axios.isAxiosError(error) && error.response?.data) {
      const data = error.response.data;
      const apiError: ApiResponse<null> & { errors?: import('../types').FieldError[] } = {
        success: false,
        data: null,
        errors: Array.isArray(data?.errors) ? data.errors : [],
        message: data?.message || error.message,
        status: error.response.status,
      };
      return Promise.reject(apiError);
    }
    return Promise.reject(error);
  },
);