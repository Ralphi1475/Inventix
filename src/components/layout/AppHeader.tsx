'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/context/OrganizationContext';
import { Building2, LogOut, RefreshCw, ChevronDown } from 'lucide-react';

export function AppHeader() {
  const router = useRouter();
  const { currentOrganization } = useOrganization();
  const [userEmail, setUserEmail] = useState<string>('');
  const [showMenu, setShowMenu] = useState(false);

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
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex justify-end">
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Building2 size={18} className="text-blue-600" />
            <span className="font-medium hidden md:inline">
              {currentOrganization.organization?.name}
            </span>
            <span className="text-gray-500 hidden lg:inline">
              ({userEmail})
            </span>
            <ChevronDown size={16} />
          </button>

          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs text-gray-500">Organisation</p>
                  <p className="font-medium text-gray-900">
                    {currentOrganization.organization?.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{userEmail}</p>
                </div>

                <button
                  onClick={handleChangeOrganization}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  Changer d'organisation
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Se déconnecter
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}