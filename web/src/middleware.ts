import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

/**
 * Server-side gate for admin routes. Unauthenticated users are sent to sign-in (NextAuth).
 * Authenticated non-admin users are redirected to /forbidden instead of the login page.
 */
export default withAuth(
  function middleware(req) {
    if (req.nextUrl.pathname.startsWith('/admin-portal')) {
      const role = req.nextauth.token?.role;
      if (role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/forbidden', req.url));
      }
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname.startsWith('/admin-portal')) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/admin-portal/:path*'],
};
