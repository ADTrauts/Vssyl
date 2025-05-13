interface FetchOptions extends RequestInit {
  handleError?: boolean;
}

export async function fetchWithHandling<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const { handleError = true, ...fetchOptions } = options;
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (handleError) {
      console.error('API request failed:', error);
      throw error;
    }
    return null as T;
  }
}

export async function get(url: string, options: FetchOptions = {}) {
  return fetchWithHandling(url, { ...options, method: 'GET' });
}

export async function post(url: string, data: any, options: FetchOptions = {}) {
  return fetchWithHandling(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function put(url: string, data: any, options: FetchOptions = {}) {
  return fetchWithHandling(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function del(url: string, options: FetchOptions = {}) {
  return fetchWithHandling(url, { ...options, method: 'DELETE' });
} 