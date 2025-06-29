import axios, { AxiosError, AxiosInstance } from 'axios';
import { ApiError } from '@/lib/types';

// Create axios instances for each service
const createApiClient = (baseURL: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor
  client.interceptors.request.use(
    (config) => {
      // Add auth token if available
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiError>) => {
      if (error.response) {
        // Server responded with error
        const apiError: ApiError = {
          message: error.response.data?.message || 'An error occurred',
          code: error.response.data?.code || 'UNKNOWN_ERROR',
          details: error.response.data?.details || {},
        };
        
        // Handle specific status codes
        if (error.response.status === 401) {
          // Redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            window.location.href = '/auth/login';
          }
        }
        
        return Promise.reject(apiError);
      } else if (error.request) {
        // Request made but no response
        return Promise.reject({
          message: 'Network error. Please check your connection.',
          code: 'NETWORK_ERROR',
        } as ApiError);
      } else {
        // Something else happened
        return Promise.reject({
          message: error.message || 'An unexpected error occurred',
          code: 'CLIENT_ERROR',
        } as ApiError);
      }
    }
  );

  return client;
};

// Service clients
export const propertyApi = createApiClient(
  process.env.NEXT_PUBLIC_PROPERTY_SERVICE_URL || 'http://localhost:8081'
);

export const bookingApi = createApiClient(
  process.env.NEXT_PUBLIC_BOOKING_SERVICE_URL || 'http://localhost:8082'
);

export const searchApi = createApiClient(
  process.env.NEXT_PUBLIC_SEARCH_SERVICE_URL || 'http://localhost:8083'
);

export const userApi = createApiClient(
  process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:8084'
);

// Helper function for handling API responses
export async function handleApiResponse<T>(
  promise: Promise<{ data: T }>
): Promise<T> {
  try {
    const response = await promise;
    return response.data;
  } catch (error) {
    throw error as ApiError;
  }
}