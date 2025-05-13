import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req });
    
    if (!token) {
      return NextResponse.next();
    }

    try {
      // Verify user still exists in database
      const user = await prisma.user.findUnique({
        where: { id: token.sub },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        // User no longer exists, redirect to login
        return NextResponse.redirect(new URL('/login', req.url));
      }

      // Add user data to request headers for API routes
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-user-id', user.id);
      requestHeaders.set('x-user-email', user.email);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      console.error('Middleware error:', error);
      return NextResponse.next();
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    '/drive/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/api/protected/:path*',
  ],
}; 