'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email) {
        const orgId = localStorage.getItem('current_organization_id');
        window.location.href = orgId ? '/gestion' : '/select-organization';
      } else {
        setShowLogin(true);
      }
    };

    check();
  }, [router]);

  if (!showLogin) return null;

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
        />
      </div>
    </div>
  );
}