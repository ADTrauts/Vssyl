import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://vssyl-server-235369681725.us-central1.run.app';

async function handler(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const url = `${backendUrl}${pathname}${search}`;
  
  console.log('API Proxy - Request:', {
    method: req.method,
    pathname,
    search,
    backendUrl,
    fullUrl: url
  });
  


  // Clone headers and add authorization
  const headers = new Headers(req.headers);
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
    console.log('API Proxy - Setting auth header:', { 
      hasToken: !!authToken, 
      tokenLength: authToken?.length,
      path: pathname 
    });
  } else {
    console.log('API Proxy - No auth token found for path:', pathname);
  }

  try {
    const fetchOptions: RequestInit & { duplex?: string } = {
      method: req.method,
      headers: headers,
      redirect: 'manual'
    };

    // Add body and duplex option for non-GET/HEAD requests
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOptions.body = req.body;
      fetchOptions.duplex = 'half'; // Required for Node.js 18+ when sending body
    }

    const response = await fetch(url, fetchOptions);

    // For file downloads, we need to preserve the content properly
    if (pathname.includes('/drive/files/') && req.method === 'GET') {
      const buffer = await response.arrayBuffer();
      return new NextResponse(buffer, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }

    return response;
  } catch (error) {
    console.error('API proxy error:', error);
    return new NextResponse('Proxy error', { status: 500 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler; 