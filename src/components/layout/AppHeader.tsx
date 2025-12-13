'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/context/OrganizationContext';
import { Building2, LogOut, RefreshCw } from 'lucide-react';

export function AppHeader() {
  const router = useRouter();
  const { currentOrganization } = useOrganization();
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    loadUser();
  }, []);

  const handleChangeOrganization = () => {
    // Supprimer l'organisation du localStorage
    localStorage.removeItem('current_organization_id');
    // Rediriger vers la sélection
    router.push('/select-organization');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('current_organization_id');
    localStorage.removeItem('user_organizations');
    router.push('/');
  };

  if (!currentOrganization) {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Building2 className="text-blue-600" size={24} />
        <div>
          <p className="text-sm text-gray-500">Organisation actuelle</p>
          <p className="font-semibold text-gray-900">
            {currentOrganization.organization?.name || 'Organisation'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 hidden md:inline">
          {userEmail}
        </span>
        
        <button
          onClick={handleChangeOrganization}
          className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Changer d'organisation"
        >
          <RefreshCw size={16} />
          <span className="hidden sm:inline">Changer</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Se déconnecter"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </div>
    </div>
  );
}