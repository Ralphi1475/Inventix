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

  // Force la redirection vers inventix-khaki.vercel.app
  const baseUrl = 'https://inventix-khaki.vercel.app';
  return NextResponse.redirect(`${baseUrl}/gestion`);
}
```

### **Étape 3 : Vérifier Google Cloud Console**

Allez sur : https://console.cloud.google.com/apis/credentials

1. Trouvez votre OAuth 2.0 Client ID pour l'application
2. Dans **Authorized redirect URIs**, vérifiez que vous avez :
```
https://stozilugsxakkpnriafm.supabase.co/auth/v1/callback