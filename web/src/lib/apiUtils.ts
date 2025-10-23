import { getSession, signOut } from 'next-auth/react';

// Use relative URLs to go through Next.js API proxy instead of direct backend calls
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://vssyl-server-235369681725.us-central1.run.app';

export interface ApiError extends Error {
  status?: number;
  isAuthError?: boolean;
}

// Helper function to make authenticated API calls with automatic token refresh
export async function authenticatedApiCall<T>(
  endpoint: string, 
  options: RequestInit = {}, 
  token?: string
): Promise<T> {
  let session = token ? null : await getSession();
  let accessToken = token || session?.accessToken;
  
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
  
  const makeRequest = async (token: string): Promise<Response> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    headers.Authorization = `Bearer ${token}`;

    return fetch(url, {
      ...options,
      headers,
    });
  };

  let response = await makeRequest(accessToken);

  // If we get a 401/403 and we're using NextAuth (not a direct token), try to refresh
  if ((response.status === 401 || response.status === 403) && !token) {
    console.log('Authentication error detected, attempting token refresh...', {
      status: response.status,
      endpoint,
      hasToken: !!accessToken,
      tokenLength: accessToken?.length
    });
    
    try {
      // Get a fresh session (NextAuth will automatically refresh if needed)
      const refreshedSession = await getSession();
      
      if (refreshedSession?.accessToken && refreshedSession.accessToken !== accessToken) {
        console.log('Token refreshed successfully, retrying request...', {
          oldTokenLength: accessToken?.length,
          newTokenLength: refreshedSession.accessToken?.length
        });
        accessToken = refreshedSession.accessToken;
        response = await makeRequest(accessToken);
      } else {
        console.log('Token refresh failed or no new token available', {
          hasRefreshedSession: !!refreshedSession,
          hasNewToken: !!refreshedSession?.accessToken,
          tokensMatch: refreshedSession?.accessToken === accessToken
        });
      }
    } catch (refreshError) {
      console.error('Error during token refresh:', refreshError);
      // Continue with the original response to let the error handling below deal with it
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // Handle authentication errors (401, 403)
    if (response.status === 401 || response.status === 403) {
      console.log('Authentication error after refresh attempt:', {
        status: response.status,
        endpoint,
        errorData,
        hasToken: !!accessToken,
        tokenLength: accessToken?.length
      });
      
      // If refresh failed, the session is completely expired
      const error = new Error('Session expired. Please refresh the page to log in again.') as ApiError;
      error.status = response.status;
      error.isAuthError = true;
      throw error;
    }
    
    // Handle server errors (500)
    if (response.status >= 500) {
      console.error('Server error:', {
        status: response.status,
        endpoint,
        errorData
      });
      
      const error = new Error('Server error. Please try again later.') as ApiError;
      error.status = response.status;
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