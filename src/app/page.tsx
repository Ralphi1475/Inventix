'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    let hasRedirected = false; // ⚠️ Empêche les doubles redirections

    const initializeAuth = async () => {
      try {
        // 1. Vérifie la session existante
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        if (session?.user?.email && !hasRedirected) {
          hasRedirected = true;
          redirectBasedOnOrg(session.user.email);
          return;
        }

        // 2. Écoute les futurs changements (login/logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          setSession(session);
          if (event === 'SIGNED_IN' && session?.user?.email && !hasRedirected) {
            hasRedirected = true;
            redirectBasedOnOrg(session.user.email);
          }
          if (event === 'SIGNED_OUT') {
            hasRedirected = false;
          }
        });

        setLoading(false);

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Erreur init auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();
  }, [router]);

  const redirectBasedOnOrg = (email: string) => {
    if (typeof window === 'undefined') return;

    const orgId = localStorage.getItem('current_organization_id');
    if (orgId) {
      router.replace('/gestion');
    } else {
      // Vérifie rapidement s’il a des orgs → mais redirige toujours vers select-organization
      router.replace('/select-organization');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Chargement...</div>
      </div>
    );
  }

  if (session) {
    // On ne devrait jamais arriver ici si redirection fonctionne
    return (
      <div className="min-h-screen flex items-center justify-center">
        Redirection...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-6">Inventix</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google']}
          redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`}
        />
      </div>
    </div>
  );
}