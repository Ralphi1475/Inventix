import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Récupérer l'email de l'utilisateur connecté
export function getCurrentUserEmail(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('user_email');
}

// Récupérer l'utilisateur connecté
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
