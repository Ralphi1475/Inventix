'use client';
import { useEffect, useState } from 'react';
import { supabase, getUserConfig } from '@/lib/supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      handleSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSession = async (session: any) => {
    if (!session) {
      setLoading(false);
      return;
    }

    const email = session.user.email;
    console.log('👤 Utilisateur connecté:', email);

    try {
      const scriptUrl = await getUserConfig(email);

      if (scriptUrl) {
        console.log('✅ Config trouvée, chargement...');
        localStorage.setItem('googleScriptUrl', scriptUrl);
        window.location.href = '/gestion';
      } else {
        console.log('⚙️ Pas de config, redirection...');
        window.location.href = '/Config';
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">📦 Inventix</h1>
            <p className="text-gray-600">Gestion d&apos;inventaire simplifiée</p>
          </div>
          
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={['google']}
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

  return null;
}