// ============================================================================
// Context React - Gestion de l'organisation active
// Fichier: src/context/OrganizationContext.tsx
// ============================================================================

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserOrganizationAccess } from '@/types/organizations';

export interface OrganizationContextType {
  currentOrganization: UserOrganizationAccess | null;
  setCurrentOrganization: (org: UserOrganizationAccess | null) => void;
  userOrganizations: UserOrganizationAccess[];
  setUserOrganizations: (orgs: UserOrganizationAccess[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [currentOrganization, setCurrentOrganizationState] = useState<UserOrganizationAccess | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<UserOrganizationAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger l'organisation depuis le localStorage au démarrage
  useEffect(() => {
    const savedOrgId = localStorage.getItem('current_organization_id');
    const savedOrgs = localStorage.getItem('user_organizations');
    
    if (savedOrgs) {
      try {
        const orgs = JSON.parse(savedOrgs) as UserOrganizationAccess[];
        setUserOrganizations(orgs);
        
        if (savedOrgId) {
          const found = orgs.find(org => org.organization_id === savedOrgId);
          if (found) {
            setCurrentOrganizationState(found);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des organisations:', error);
      }
    }
    
    setIsLoading(false);
  }, []);

  // Fonction pour définir l'organisation courante et la sauvegarder
  const setCurrentOrganization = (org: UserOrganizationAccess | null) => {
    setCurrentOrganizationState(org);
    if (org) {
      localStorage.setItem('current_organization_id', org.organization_id);
    } else {
      localStorage.removeItem('current_organization_id');
    }
  };

  // Sauvegarder les organisations de l'utilisateur
  useEffect(() => {
    if (userOrganizations.length > 0) {
      localStorage.setItem('user_organizations', JSON.stringify(userOrganizations));
    }
  }, [userOrganizations]);

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        setCurrentOrganization,
        userOrganizations,
        setUserOrganizations,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization doit être utilisé dans un OrganizationProvider');
  }
  return context;
}