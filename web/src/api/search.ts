import { SearchFilters, SearchResult, SearchSuggestion } from 'shared/types/search';

// Helper function to make authenticated API calls
async function apiCall<T>(
  endpoint: string, 
  options: RequestInit = {}, 
  token?: string
): Promise<T> {
  const url = `/api/search${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

// Search API functions
export const searchAPI = {
  // Perform global search
  search: async (query: string, filters?: SearchFilters, token?: string): Promise<SearchResult[]> => {
    const response = await apiCall<{ success: boolean; results: SearchResult[] }>(
      '/',
      {
        method: 'POST',
        body: JSON.stringify({ query, filters }),
      },
      token
    );
    return response.results;
  },

  // Get search suggestions
  getSuggestions: async (query: string, token?: string): Promise<SearchSuggestion[]> => {
    const response = await apiCall<{ success: boolean; suggestions: SearchSuggestion[] }>(
      `/suggestions?q=${encodeURIComponent(query)}`,
      {
        method: 'GET',
      },
      token
    );
    return response.suggestions;
  },
}; 