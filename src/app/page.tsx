// src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/context/OrganizationContext';

export default function Home() {
  const router = useRouter();
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Si l'utilisateur est connecté mais n'a pas sélectionné d'organisation
        if (!currentOrganization) {
          router.push('/select-organization');
        } else {
          router.push('/gestion');
        }
      } else {
        // Afficher votre page de connexion
        // router.push('/login');
      }
    };
    
    checkAuth();
  }, [currentOrganization, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-500">Chargement...</div>
    </div>
  );
}