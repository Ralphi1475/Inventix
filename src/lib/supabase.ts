import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Sauvegarder la config utilisateur
export async function saveUserConfig(email: string, scriptUrl: string) {
  const { data, error } = await supabase
    .from('user_configs')
    .upsert({ 
      email, 
      script_url: scriptUrl, 
      updated_at: new Date().toISOString() 
    })
    .select();
  
  if (error) {
    console.error('Erreur sauvegarde config:', error);
    throw error;
  }
  
  console.log('✅ Config sauvegardée pour:', email);
  return data;
}

// Récupérer la config utilisateur
export async function getUserConfig(email: string) {
  const { data, error } = await supabase
    .from('user_configs')
    .select('script_url')
    .eq('email', email)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Erreur récupération config:', error);
    throw error;
  }
  
  return data?.script_url || null;
}