import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for the authentication indicator cookie
  const authActive = request.cookies.get('gala_auth_active')?.value === 'true';

  // Redirect unauthenticated users trying to access dashboard
  if (pathname.startsWith('/dashboard') && !authActive) {
    const loginUrl = new URL('/login', request.url);
    // Preserving the redirect destination
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users trying to access login page
  if (pathname === '/login' && authActive) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Config to specify matching routes
export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
