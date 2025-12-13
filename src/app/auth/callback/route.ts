// src/app/auth/callback/route.ts
import { type NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // FORCE la redirection vers le bon domaine
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://inventix-khaki.vercel.app';
  return NextResponse.redirect(`${baseUrl}/gestion`);
}
```

Puis ajoutez cette variable d'environnement sur Vercel (projet `inventix-khaki`) :
```
NEXT_PUBLIC_SITE_URL=https://inventix-khaki.vercel.app