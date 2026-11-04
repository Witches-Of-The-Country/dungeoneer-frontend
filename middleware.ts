import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token =
    request.cookies.get('dungeoneer_auth_token')?.value ||
    request.cookies.get('dungeoneer_token')?.value;

  if (request.nextUrl.pathname.startsWith('/characters') && !token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/characters/:path*'],
};
