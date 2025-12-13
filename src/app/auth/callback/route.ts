import { type NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createClient(); // ← sans argument
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL('/gestion', request.url));
}