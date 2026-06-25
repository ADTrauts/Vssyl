import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

/**
 * - /admin-portal/*: requires session; non-ADMIN → /forbidden; unauthenticated → sign-in.
 * - /profile/*: requires session.
 * - /business/*: requires session (create, workspace, profile, etc.).
 */
export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname;

    if (pathname === '/admin/governance') {
      return NextResponse.redirect(new URL('/admin-portal/governance', req.url));
    }
    if (pathname === '/admin/retention') {
      return NextResponse.redirect(new URL('/admin-portal/retention', req.url));
    }
    if (pathname === '/admin-portal/test-impersonation' || pathname === '/admin-portal/impersonation-test') {
      return NextResponse.redirect(new URL('/admin-portal/impersonate', req.url));
    }
    if (pathname === '/admin-portal/ai-learning') {
      return NextResponse.redirect(new URL('/admin-portal/ai-pipeline', req.url));
    }
    if (pathname === '/admin-portal/ai-context') {
      const dest = new URL('/admin-portal/ai-pipeline/diagnostics', req.url);
      req.nextUrl.searchParams.forEach((value, key) => {
        dest.searchParams.set(key, value);
      });
      return NextResponse.redirect(dest);
    }

    if (pathname.startsWith('/admin-portal')) {
      const role = req.nextauth.token?.role;
      if (role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/forbidden', req.url));
      }
    }

    if (pathname.startsWith('/admin')) {
      const role = req.nextauth.token?.role;
      if (!req.nextauth.token) {
        return NextResponse.redirect(new URL('/auth/login', req.url));
      }
      if (role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (path.startsWith('/admin-portal') || path.startsWith('/admin') || path.startsWith('/profile')) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/admin-portal/:path*', '/admin/:path*', '/profile/:path*', '/business/:path*'],
};
