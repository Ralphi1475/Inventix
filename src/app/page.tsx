'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let redirecting = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      
      if (session && !redirecting) {
        redirecting = true;
        handleRedirect(session);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleRedirect = async (session: any) => {
    if (!session?.user?.email) return;

    const email = session.user.email;
    localStorage.setItem('user_email', email);
    
    // Vérifier si organisation déjà sélectionnée
    const currentOrgId = localStorage.getItem('current_organization_id');
    
    if (currentOrgId) {
      router.replace('/gestion');
      return;
    }

    // Vérifier si l'utilisateur a des organisations
    const { data: ownedOrgs } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_email', email)
      .limit(1);

    const { data: sharedOrgs } = await supabase
      .from('user_organization_access')
      .select('organization_id')
      .eq('user_email', email)
      .limit(1);

    const hasOrgs = (ownedOrgs && ownedOrgs.length > 0) || (sharedOrgs && sharedOrgs.length > 0);
    
    router.replace(hasOrgs ? '/select-organization' : '/gestion');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Inventix</h1>
            <p className="text-gray-600">Gestion d'inventaire simplifiée</p>
          </div>
          
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#2563eb',
                    brandAccent: '#1e40af',
                  }
                }
              }
            }}
            providers={['google']}
            redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email',
                  password_label: 'Mot de passe',
                  button_label: 'Se connecter',
                  social_provider_text: 'Se connecter avec {{provider}}',
                },
              },
            }}
          />
        </div>
      </div>
    );
  }

  // Ne rien afficher si connecté (redirection en cours)
  return null;
}