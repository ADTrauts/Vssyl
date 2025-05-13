import { NextRequest } from 'next/server';
import { API_BASE_URL } from './api';
import { getToken } from 'next-auth/jwt';

export async function proxyRequest(
  req: NextRequest,
  endpoint: string,
  options: RequestInit = {}
) {
  // Remove any existing base URL from the endpoint
  const cleanEndpoint = endpoint.replace(API_BASE_URL, '');
  
  // Ensure endpoint starts with a slash
  const normalizedEndpoint = cleanEndpoint.startsWith('/') ? cleanEndpoint : `/${cleanEndpoint}`;
  
  const url = `${API_BASE_URL}${normalizedEndpoint}`;
  
  const headers = new Headers(req.headers);
  
  // Remove host header as it will be set by the fetch API
  headers.delete('host');
  
  // Get the auth token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  // Add auth header if we have a token
  if (token?.accessToken) {
    headers.set('Authorization', `Bearer ${token.accessToken}`);
  }
  
  // Don't set content-type for multipart form data - let the browser set it
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('content-type', 'application/json');
  }

  // Remove content-length header for FormData
  if (options.body instanceof FormData) {
    headers.delete('content-length');
  }

  try {
    // Create the request options
    const requestOptions: RequestInit = {
      ...options,
      headers,
      credentials: 'include',
    };

    // If it's a FormData body, we need to pass it as is
    if (options.body instanceof FormData) {
      requestOptions.body = options.body;
    }

    const response = await fetch(url, requestOptions);

    // Clone the response to avoid body being disturbed
    const clonedResponse = response.clone();
    
    // Get the content type
    const contentType = response.headers.get('content-type');
    
    // Handle different response types
    if (contentType?.includes('application/json')) {
      const data = await clonedResponse.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else {
      // For non-JSON responses, try to extract error information
      const text = await clonedResponse.text();
      console.error('Non-JSON response received:', {
        status: response.status,
        contentType,
        text: text.substring(0, 200), // Log first 200 chars
        url,
      });

      // Return a proper JSON error response
      return new Response(
        JSON.stringify({ 
          message: 'Server returned an invalid response',
          status: response.status,
          contentType,
        }),
        { 
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 