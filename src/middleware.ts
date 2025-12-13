import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes publiques
  const publicPaths = ['/', '/auth/callback'];
  if (publicPaths.some(path => pathname === path || pathname.startsWith('/_next'))) {
    return NextResponse.next();
  }

  // Vérifier si l'utilisateur est connecté (via cookie)
  const accessToken = request.cookies.get('sb-access-token')?.value;
  const refreshToken = request.cookies.get('sb-refresh-token')?.value;

  const isLoggedIn = !!accessToken && !!refreshToken;

  // Routes privées → nécessitent une session
  if (!isLoggedIn) {
    // Redirige vers la home (login)
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Appliquer le middleware à toutes les routes SAUF :
     * - fichiers statiques (_next/static, _next/image)
     * - favicon
     * - API routes (si tu en as)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};