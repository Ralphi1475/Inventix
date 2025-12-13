// src/app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { type NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirige vers la page de gestion
  return NextResponse.redirect(new URL('/gestion', request.url));
}