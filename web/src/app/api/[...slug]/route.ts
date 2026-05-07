import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { logger } from '@/lib/logger';

// Force dynamic rendering to ensure route is always handled
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Ensure all HTTP methods are handled
export const dynamicParams = true;

// In development, default to localhost if env var not set
// In production, use environment variable or production fallback
const isDevelopment = process.env.NODE_ENV !== 'production';
const backendUrl = process.env.BACKEND_URL || 
                   process.env.NEXT_PUBLIC_API_BASE_URL || 
                   (isDevelopment ? 'http://localhost:5000' : 'https://vssyl-server-235369681725.us-central1.run.app');

function redactedHeaderSnapshot(headers: Headers): Record<string, string> {
  const snapshot: Record<string, string> = {};
  headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (
      lower === 'authorization' ||
      lower === 'cookie' ||
      lower === 'set-cookie' ||
      lower === 'x-impersonation-token'
    ) {
      snapshot[key] = value ? '[redacted]' : '';
    } else {
      snapshot[key] = value;
    }
  });
  return snapshot;
}

async function handler(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const url = `${backendUrl}${pathname}${search}`;
  
  void logger.debug('API proxy request', {
    operation: 'api_proxy',
    context: {
      method: req.method,
      pathname,
      search,
      backendUrl,
      fullUrl: url,
    },
  });

  const isDriveFileDownload =
    req.method === 'GET' &&
    pathname.includes('/drive/files/') &&
    (pathname.includes('/download') || /\/drive\/files\/[^/]+$/.test(pathname));

  if (isDriveFileDownload) {
    void logger.debug('API proxy file download request', {
      operation: 'api_proxy',
      context: {
        method: req.method,
        pathname,
        fullUrl: url,
        backendUrl,
      },
    });
  }

  const isSchedulingAvailabilityPost =
    req.method === 'POST' && pathname.includes('/scheduling/me/availability');

  if (isSchedulingAvailabilityPost) {
    void logger.debug('API proxy scheduling availability POST at handler entry', {
      operation: 'api_proxy',
      context: {
        method: req.method,
        pathname,
        search,
        url,
        backendUrl,
      },
    });
  }



  // Clone headers and add authorization
  const headers = new Headers(req.headers);
  const impersonationCookie = req.cookies.get('vssyl_impersonation')?.value;
  let authToken = req.headers.get('authorization');
  
  // Check for token in query parameters (for file preview with direct URLs)
  if (!authToken) {
    const urlParams = new URLSearchParams(search);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      authToken = `Bearer ${tokenParam}`;
    }
  }
  
  if (!authToken) {
    // If no Authorization header from the client, try to read the NextAuth session token
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const accessToken = (token as any)?.accessToken as string | undefined;
    if (accessToken) {
      authToken = `Bearer ${accessToken}`;
    }
  }

  if (authToken) {
    headers.set('authorization', authToken);
    void logger.debug('API proxy auth header set', {
      operation: 'api_proxy',
      context: {
        hasToken: true,
        tokenLength: authToken.length,
        pathname,
      },
    });
  } else {
    void logger.debug('API proxy no auth token for path', {
      operation: 'api_proxy',
      context: { pathname },
    });
  }

  if (impersonationCookie && !pathname.startsWith('/api/admin-portal')) {
    headers.set('x-impersonation-token', impersonationCookie);
  }

  try {
    // Handle request body for non-GET/HEAD/DELETE requests BEFORE building fetch options
    // DELETE requests should never have a body
    let requestBody: BodyInit | undefined;
    let contentType: string | null = null;
    
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'DELETE') {
      contentType = req.headers.get('content-type');
      
      if (contentType?.includes('multipart/form-data')) {
        // For file uploads with multipart/form-data:
        // We need to pass the stream directly and preserve the boundary
        // Don't modify the content-type header - it contains the boundary parameter
        requestBody = req.body as BodyInit;
      } else if (contentType?.includes('application/json') || contentType?.includes('application/x-www-form-urlencoded')) {
        // For JSON and form-urlencoded, read the body as text and pass it
        const bodyText = await req.text();
        // Only set body if it's not empty
        if (bodyText && bodyText.trim().length > 0) {
          requestBody = bodyText;
          // Ensure Content-Type is preserved
          if (contentType) {
            headers.set('content-type', contentType);
          }
          // Remove any existing content-length header - let fetch set it automatically
          headers.delete('content-length');
          void logger.debug('API proxy request body', {
            operation: 'api_proxy',
            context: {
              pathname,
              bodyLength: bodyText.length,
              bodyPreview: bodyText.substring(0, 200),
              contentType,
              hasBody: !!bodyText,
            },
          });
        }
      } else if (req.body) {
        // For other body types, try to pass the stream directly
        requestBody = req.body as BodyInit;
      }
    }

    // Build fetch options with all headers and body
    // Use Headers object directly - fetch should handle it correctly in Node.js environment
    const headersForFetch: HeadersInit = headers;

    const fetchOptions: RequestInit & { duplex?: string } = {
      method: req.method,
      headers: headersForFetch,
      redirect: 'manual'
    };

    // Set body if we have one
    if (requestBody) {
      fetchOptions.body = requestBody;
      // Node.js 18+ requires duplex option for all POST requests with a body
      // Set it for multipart/form-data (file uploads) and any other body types
      if (contentType?.includes('multipart/form-data') || req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        fetchOptions.duplex = 'half';
      }
    }

    if (isSchedulingAvailabilityPost) {
      const debugHeaders =
        headersForFetch instanceof Headers
          ? redactedHeaderSnapshot(headersForFetch)
          : headersForFetch;
      void logger.debug('API proxy scheduling availability POST before fetch', {
        operation: 'api_proxy',
        context: {
          url,
          method: fetchOptions.method,
          headers: debugHeaders,
          bodyType: typeof requestBody,
          bodyLength: requestBody
            ? typeof requestBody === 'string'
              ? requestBody.length
              : 'stream'
            : 0,
          hasBody: !!requestBody,
          contentType: headers.get('content-type'),
          authorization: headers.get('authorization') ? 'present' : 'missing',
          backendUrl,
        },
      });
    }

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const isAIQuery = pathname.includes('/api/ai/twin') || pathname.includes('/api/ai/chat') || pathname.includes('/api/business-ai/') || pathname.includes('/api/ai/edit-image') || pathname.includes('/api/ai/generate-image');
    const timeoutDuration = contentType?.includes('multipart/form-data') || isAIQuery ? 120000 : 30000; // 2 min for uploads/AI/image operations, 30 sec for others
    const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
    
    // Add signal to fetch options if not already present
    if (!fetchOptions.signal) {
      fetchOptions.signal = controller.signal;
    }

    let response: Response;
    try {
      response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      const isAborted = fetchError instanceof Error && fetchError.name === 'AbortError';
      
      void logger.error('API proxy fetch failed', {
        operation: 'api_proxy',
        context: {
          errorMessage,
          isAborted,
          url,
          backendUrl,
          pathname,
        },
      });
      
      if (isAborted) {
        throw new Error(`Request timeout after ${timeoutDuration / 1000} seconds`);
      }
      throw fetchError;
    }

    // Log 404 responses to help debug
    if (response.status === 404) {
      const responseText = await response.clone().text().catch(() => 'Unable to read response');
      void logger.error('API proxy backend returned 404', {
        operation: 'api_proxy',
        context: {
          url,
          pathname,
          status: response.status,
          responseText: responseText.substring(0, 200),
          backendUrl,
          hasAuth: !!authToken,
          isDownloadRequest: isDriveFileDownload,
        },
      });
    }

    void logger.debug('API proxy response', {
      operation: 'api_proxy',
      context: {
        status: response.status,
        statusText: response.statusText,
        pathname,
        hasAuth: !!authToken,
        backendUrl,
      },
    });

    if (response.status === 401 || response.status === 403) {
      void logger.warn('API proxy authentication error', {
        operation: 'api_proxy',
        context: {
          status: response.status,
          pathname,
          hasAuthToken: !!authToken,
          tokenLength: authToken?.length,
          backendUrl,
        },
      });
    }

    if (response.status >= 500) {
      void logger.error('API proxy upstream server error', {
        operation: 'api_proxy',
        context: {
          status: response.status,
          statusText: response.statusText,
          pathname,
          backendUrl,
        },
      });
    }

    // For file downloads, we need to preserve the content properly
    // Handle both /download and direct file access
    if (pathname.includes('/drive/files/') && req.method === 'GET' && 
        (pathname.includes('/download') || pathname.match(/\/drive\/files\/[^/]+$/))) {
      const buffer = await response.arrayBuffer();
      return new NextResponse(buffer, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }

    return response;
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('API proxy handler error', {
      operation: 'api_proxy',
      error: { message: err.message, stack: err.stack },
      context: {
        url,
        method: req.method,
        pathname,
        hasAuthToken: !!authToken,
        backendUrl,
      },
    });
    
    // Determine error type and appropriate status code
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        statusCode = 503; // Service unavailable
        errorMessage = 'Backend service unavailable';
      } else if (error.message.includes('timeout')) {
        statusCode = 504; // Gateway timeout
        errorMessage = 'Request timeout';
      } else if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
        statusCode = 503; // Service unavailable
        errorMessage = 'Backend service unavailable';
      }
    }
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Proxy error', 
        message: errorMessage,
        path: pathname,
        status: statusCode
      }), 
      { 
        status: statusCode,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler; 