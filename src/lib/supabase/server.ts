// src/lib/supabase/server.ts
import { createClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables d’environnement manquantes: NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export function createClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: cookies(), // ← appelé ici, pas en dehors
      storageKey: 'supabase-auth-token',
      detectSessionInUrl: true,
    },
  });
}