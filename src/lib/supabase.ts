import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Recuperer l'email de l'utilisateur connecte depuis la session Supabase
export function getCurrentUserEmail(): string | null {
  if (typeof window === 'undefined') return null;
  
  // D'abord essayer le localStorage (plus rapide)
  const storedEmail = localStorage.getItem('user_email');
  if (storedEmail) {
    return storedEmail;
  }
  
  // Si pas dans localStorage, essayer de le recuperer de la session
  // Note: Cette partie est synchrone, donc on ne peut pas utiliser await ici
  // La session sera geree par getSession() dans les fonctions async
  return null;
}

// Version async pour recuperer l'email de facon fiable
export async function getUserEmail(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const email = session?.user?.email || null;
    
    // Sauvegarder dans localStorage pour les prochains appels
    if (email && typeof window !== 'undefined') {
      localStorage.setItem('user_email', email);
    }
    
    return email;
  } catch (error) {
    console.error('Erreur recuperation email:', error);
    return null;
  }
}

// Recuperer l'utilisateur connecte
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
// Déconnexion complète
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Erreur déconnexion:', error);
  } else {
    // Nettoyer le localStorage
    localStorage.removeItem('user_email');
    localStorage.removeItem('current_organization_id');
    localStorage.removeItem('user_organizations');
  }
  return !error;
}