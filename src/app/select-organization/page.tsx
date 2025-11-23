'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/context/OrganizationContext';
import OrganizationSelector from '@/components/organizations/OrganizationSelector';

export default function SelectOrganizationPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
      setLoading(false);
    };
    loadUser();
  }, []);

  // Rediriger vers gestion si une organisation est déjà sélectionnée
  useEffect(() => {
    if (currentOrganization) {
      router.push('/gestion');
    }
  }, [currentOrganization, router]);

  const handleOrganizationSelected = () => {
    router.push('/gestion');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (!userEmail) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Vous devez être connecté</div>
      </div>
    );
  }

  return (
    <OrganizationSelector 
      userEmail={userEmail} 
      onSelect={handleOrganizationSelected}
    />
  );
}