import { getSession, signOut } from 'next-auth/react';

// Use relative URLs to go through Next.js API proxy instead of direct backend calls
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || '';

export interface ApiError extends Error {
  status?: number;
  isAuthError?: boolean;
}

// Helper function to make authenticated API calls with proper error handling
export async function authenticatedApiCall<T>(
  endpoint: string, 
  options: RequestInit = {}, 
  token?: string
): Promise<T> {
  const session = token ? null : await getSession();
  const accessToken = token || session?.accessToken;
  
  if (!accessToken) {
    const error = new Error('No authentication token available') as ApiError;
    error.isAuthError = true;
    throw error;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  // Debug logging to help troubleshoot API routing
  console.log('API Call Debug:', {
    endpoint,
    API_BASE_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    finalUrl: url,
    isRelative: !url.startsWith('http')
  });
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // Handle authentication errors (401, 403)
    if (response.status === 401 || response.status === 403) {
      console.log('Authentication error detected:', response.status, errorData);
      
      // Only handle client-side redirects here
      // Server-side redirects should be handled by the calling component
      if (typeof window !== 'undefined') {
        // Small delay to allow the error to be logged
        setTimeout(() => {
          signOut({ callbackUrl: '/auth/login' });
        }, 100);
      }
      
      const error = new Error('Session expired. Please log in again.') as ApiError;
      error.status = response.status;
      error.isAuthError = true;
      throw error;
    }
    
    // Handle other errors
    const error = new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`) as ApiError;
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  return data;
}

// Helper function for business API calls specifically
export async function businessApiCall<T>(
  endpoint: string, 
  options: RequestInit = {}, 
  token?: string
): Promise<T> {
  return authenticatedApiCall<T>(`/api/business${endpoint}`, options, token);
} 