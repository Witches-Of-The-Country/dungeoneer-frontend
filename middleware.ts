import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isJwtValidAndNotExpired(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = atob(base64);
    const payload = JSON.parse(jsonStr);
    if (payload.exp && payload.exp * 1000 <= Date.now()) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const token =
    request.cookies.get('dungeoneer_auth_token')?.value ||
    request.cookies.get('dungeoneer_token')?.value;

  const pathname = request.nextUrl.pathname;
  const isProtected = pathname.startsWith('/characters') || pathname.startsWith('/profile');

  if (isProtected && !isJwtValidAndNotExpired(token)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl);
    // Clear malformed or expired cookies to avoid state desync with client
    response.cookies.delete('dungeoneer_auth_token');
    response.cookies.delete('dungeoneer_token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/characters/:path*', '/profile/:path*'],
};
