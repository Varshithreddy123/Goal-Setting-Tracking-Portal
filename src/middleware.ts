import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { getSessionUser } from '@/lib/session';

/**
 * Enterprise RBAC gate (lightweight cookie session).
 * Protects /dashboard/* and enforces:
 * - employee can only access /dashboard/employee
 * - manager can only access /dashboard/manager
 * - admin can access /dashboard/admin
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith('/dashboard/')) return NextResponse.next();

  const session = getSessionUser();
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  const segment = pathname.split('/')[2]; // dashboard/<segment>/...
  const allowedForRoute = segment === session.role;

  if (segment && ['employee', 'manager', 'admin'].includes(segment as string)) {
    if (!allowedForRoute) {
      const url = req.nextUrl.clone();
      url.pathname = '/unauthorized';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};


