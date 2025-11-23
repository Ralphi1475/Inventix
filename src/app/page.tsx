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
    // Vérifier la session au chargement
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Session detectee:', session?.user?.email || 'Aucune');
      setSession(session);
      setLoading(false);
      
      if (session) {
        handleSession(session);
      }
    });

    // Écouter les changements de session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Changement de session:', _event, session?.user?.email);
      setSession(session);
      
      if (session && _event === 'SIGNED_IN') {
        handleSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSession = async (session: any) => {
    if (!session?.user?.email) {
      console.log('Pas d\'email dans la session');
      return;
    }

    const email = session.user.email;
    console.log('Utilisateur connecte:', email);
    
    // Stockage de l'email
    localStorage.setItem('user_email', email);
    
    // Vérifier si l'utilisateur a des organisations
    try {
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('*')
        .or(`owner_email.eq.${email},id.in.(select organization_id from user_organization_access where user_email='${email}')`)
        .limit(1);

      if (error) {
        console.error('Erreur verification organisations:', error);
      }

      console.log('Organisations trouvees:', orgs?.length || 0);

      // Petit délai pour s'assurer que tout est prêt
      setTimeout(() => {
        if (orgs && orgs.length > 0) {
          console.log('Redirection vers /select-organization');
          router.push('/select-organization');
        } else {
          console.log('Redirection vers /gestion (pas d\'org)');
          router.push('/gestion');
        }
      }, 100);
    } catch (err) {
      console.error('Erreur:', err);
      // En cas d'erreur, rediriger quand même
      router.push('/gestion');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verification de la connexion...</p>
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
            <p className="text-gray-600">Gestion d&apos;inventaire simplifiee</p>
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
            redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/gestion` : undefined}
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
          
          <p className="text-xs text-gray-500 text-center mt-4">
            En vous connectant, vous acceptez nos conditions d&apos;utilisation
          </p>
        </div>
      </div>
    );
  }

  // Pendant la redirection
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Connexion en cours...</p>
      </div>
    </div>
  );
}