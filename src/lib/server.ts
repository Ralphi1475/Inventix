// src/lib/supabase/server.ts
import { type CookieStore, createClient } from '@supabase/ssr';
import { type Database } from '@/types/supabase'; // optionnel, si tu utilises types

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars');
}

export function createClient(cookieStore: CookieStore) {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: cookieStore,
      storageKey: 'supabase-auth-token',
      detectSessionInUrl: true,
    },
  });
}