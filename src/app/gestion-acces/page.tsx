'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import GestionAcces from '@/components/settings/GestionAcces';

export default function GestionAccesPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
      setLoading(false);
    };
    loadUser();
  }, []);

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

  return <GestionAcces userEmail={userEmail} />;
}