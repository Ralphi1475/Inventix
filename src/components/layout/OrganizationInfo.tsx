'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/context/OrganizationContext';
import { Building2, LogOut, RefreshCw } from 'lucide-react';

export function OrganizationInfo() {
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
    localStorage.removeItem('current_organization_id');
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
    <>
      {/* Info organisation dans la sidebar */}
      <div className="mb-6 pb-4 border-b border-blue-800">
        <div className="flex items-center gap-2 mb-2">
          <Building2 size={16} />
          <span className="text-xs text-blue-300">Organisation</span>
        </div>
        <p className="font-semibold text-white mb-1">
          {currentOrganization.organization?.name}
        </p>
        <p className="text-xs text-blue-200 truncate">{userEmail}</p>
      </div>

      {/* Boutons d'action en bas de la sidebar */}
      <div className="mt-auto pt-4 border-t border-blue-800 space-y-2">
        <button
          onClick={handleChangeOrganization}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-100 hover:bg-blue-800 rounded-lg transition-colors"
        >
          <RefreshCw size={16} />
          Changer d'organisation
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-300 hover:bg-red-900 hover:bg-opacity-20 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </>
  );
}