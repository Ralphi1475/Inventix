'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Organization {
  organization_id: string;
  organization?: {
    id: string;
    name: string;
    description?: string;
  };
  access_level: string;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization | null) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);

  useEffect(() => {
    const loadCurrentOrganization = async () => {
      if (typeof window === 'undefined') return;

      const orgId = localStorage.getItem('current_organization_id');
      const userEmail = localStorage.getItem('user_email');

      if (!orgId) return;

      // Charger l'organisation depuis Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      // Récupérer l'accès de l'utilisateur à cette organisation
      const { data: access } = await supabase
        .from('user_organization_access')
        .select('*, organization:organizations(*)')
        .eq('organization_id', orgId)
        .eq('user_email', user.email)
        .single();

      if (access) {
        setCurrentOrganization({
          organization_id: access.organization_id,
          organization: access.organization,
          access_level: access.access_level
        });
      } else {
        // Vérifier si l'utilisateur est propriétaire
        const { data: org } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', orgId)
          .eq('owner_email', user.email)
          .single();

        if (org) {
          setCurrentOrganization({
            organization_id: org.id,
            organization: org,
            access_level: 'admin'
          });
        }
      }
    };

    loadCurrentOrganization();
  }, []);

  return (
    <OrganizationContext.Provider value={{ currentOrganization, setCurrentOrganization }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
}