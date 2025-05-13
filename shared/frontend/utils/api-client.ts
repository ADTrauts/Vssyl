import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { getSession } from 'next-auth/react';

// API Error Types
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export interface ApiResponse<T> {
  data: T;
  error?: ApiError;
  status?: number;
}

// API Client Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request Interceptor
api.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    
    if (session?.serverToken) {
      config.headers.Authorization = `Bearer ${session.serverToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Methods
export const apiClient: AxiosInstance = api;

export const apiMethods = {
  get: async <T>(url: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.get<T>(url, { params });
      return { data: response.data, status: response.status };
    } catch (error) {
      if (error instanceof AxiosError) {
        const apiError: ApiError = {
          message: error.response?.data?.message || error.message,
          code: error.code,
          status: error.response?.status,
          details: error.response?.data,
        };
        return { data: {} as T, error: apiError, status: error.response?.status ?? 500 };
      }
      return { 
        data: {} as T, 
        error: { 
          message: 'An unexpected error occurred',
          code: 'UNKNOWN_ERROR',
          status: 500,
        }, 
        status: 500 
      };
    }
  },

  post: async <T>(url: string, data?: unknown): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.post<T>(url, data);
      return { data: response.data, status: response.status };
    } catch (error) {
      if (error instanceof AxiosError) {
        const apiError: ApiError = {
          message: error.response?.data?.message || error.message,
          code: error.code,
          status: error.response?.status,
          details: error.response?.data,
        };
        return { data: {} as T, error: apiError, status: error.response?.status ?? 500 };
      }
      return { 
        data: {} as T, 
        error: { 
          message: 'An unexpected error occurred',
          code: 'UNKNOWN_ERROR',
          status: 500,
        }, 
        status: 500 
      };
    }
  },

  put: async <T>(url: string, data?: unknown): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.put<T>(url, data);
      return { data: response.data, status: response.status };
    } catch (error) {
      if (error instanceof AxiosError) {
        const apiError: ApiError = {
          message: error.response?.data?.message || error.message,
          code: error.code,
          status: error.response?.status,
          details: error.response?.data,
        };
        return { data: {} as T, error: apiError, status: error.response?.status ?? 500 };
      }
      return { 
        data: {} as T, 
        error: { 
          message: 'An unexpected error occurred',
          code: 'UNKNOWN_ERROR',
          status: 500,
        }, 
        status: 500 
      };
    }
  },

  delete: async <T>(url: string): Promise<ApiResponse<T>> => {
    try {
      const response = await apiClient.delete<T>(url);
      return { data: response.data, status: response.status };
    } catch (error) {
      if (error instanceof AxiosError) {
        return { data: {} as T, error: { message: error.message, code: error.code, status: error.response?.status }, status: error.response?.status ?? 500 };
      }
      return { data: {} as T, error: { message: 'Unknown error occurred' }, status: 500 };
    }
  },
};

export default apiMethods; 