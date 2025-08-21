const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export interface ApiError extends Error {
  status?: number;
  isAuthError?: boolean;
}

// Helper function to make authenticated API calls from server-side code
export async function serverAuthenticatedApiCall<T>(
  endpoint: string, 
  options: RequestInit = {}, 
  token: string
): Promise<T> {
  if (!token) {
    const error = new Error('No authentication token available') as ApiError;
    error.isAuthError = true;
    throw error;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // Handle authentication errors (401, 403)
    if (response.status === 401 || response.status === 403) {
      console.log('Server-side authentication error detected:', response.status, errorData);
      
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

// Helper function for business API calls specifically from server-side
export async function serverBusinessApiCall<T>(
  endpoint: string, 
  options: RequestInit = {}, 
  token: string
): Promise<T> {
  return serverAuthenticatedApiCall<T>(`/api/business${endpoint}`, options, token);
} 