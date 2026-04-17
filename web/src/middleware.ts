import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

/**
 * - /admin-portal/*: requires session; non-ADMIN → /forbidden; unauthenticated → sign-in.
 * - /profile/*: requires session.
 * - /business/*: requires session (create, workspace, profile, etc.).
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
        const path = req.nextUrl.pathname;
        if (path.startsWith('/admin-portal') || path.startsWith('/profile')) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/admin-portal/:path*', '/profile/:path*', '/business/:path*'],
};
