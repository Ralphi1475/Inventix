'use client';

import React, { useEffect, useState } from 'react';
import { Building2, ChevronRight, Users, Shield, CheckCircle } from 'lucide-react';
import { useOrganization } from '@/context/OrganizationContext';
import { getUserOrganizations } from '@/lib/api';
import type { UserOrganizationAccess } from '@/types/organizations';
import { ORG_ACCESS_LEVELS } from '@/types/organizations';

interface OrganizationSelectorProps {
  userEmail: string;
  onSelect: () => void;
}

export default function OrganizationSelector({ userEmail, onSelect }: OrganizationSelectorProps) {
  const { setCurrentOrganization, setUserOrganizations } = useOrganization();
  const [organizations, setOrganizations] = useState<UserOrganizationAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  useEffect(() => {
    loadOrganizations();
  }, [userEmail]);

  const loadOrganizations = async () => {
    setLoading(true);
    setError(null);

    const response = await getUserOrganizations(userEmail);

    if (response.success && response.data) {
      setOrganizations(response.data);
      setUserOrganizations(response.data);
      
      if (response.data.length === 1) {
        handleSelectOrganization(response.data[0]);
      }
    } else {
      setError(response.error || 'Erreur lors du chargement des organisations');
    }

    setLoading(false);
  };

  const handleSelectOrganization = (org: UserOrganizationAccess) => {
    setSelectedOrgId(org.organization_id);
    setCurrentOrganization(org);
    setTimeout(() => {
      onSelect();
    }, 300);
  };

  const getAccessLevelInfo = (level: string) => {
    return ORG_ACCESS_LEVELS[level] || ORG_ACCESS_LEVELS.read;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Chargement de vos organisations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-2">Erreur</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={loadOrganizations}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-4">
            <Building2 size={64} className="text-gray-300 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Aucune organisation</h2>
          <p className="text-gray-600">
            Vous n'avez accès à aucune organisation pour le moment.
            Contactez un administrateur pour obtenir un accès.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="mb-4">
            <Building2 size={48} className="text-blue-600 mx-auto" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Sélectionnez votre organisation
          </h1>
          <p className="text-gray-600">
            {organizations.length} organisation{organizations.length > 1 ? 's' : ''} disponible{organizations.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="space-y-3">
          {organizations.map((orgAccess) => {
            const org = orgAccess.organization;
            if (!org) return null;

            const accessInfo = getAccessLevelInfo(orgAccess.access_level);
            const isSelected = selectedOrgId === orgAccess.organization_id;
            const displayNom = org.parametres?.societe_nom || org.name;

            return (
              <button
                key={orgAccess.organization_id}
                onClick={() => handleSelectOrganization(orgAccess)}
                disabled={isSelected}
                className={`w-full text-left p-4 sm:p-5 border-2 rounded-xl transition-all duration-200 ${
                  isSelected
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-blue-500 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {org.logo_url ? (
                      <img
                        src={org.logo_url}
                        alt={displayNom}
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : (
                      <Building2 size={24} className={isSelected ? 'text-green-600' : 'text-blue-600'} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-lg truncate">
                        {displayNom}
                      </h3>
                      {isSelected && (
                        <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                      )}
                    </div>

                    {org.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {org.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-3 text-sm">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium ${
                        orgAccess.access_level === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : orgAccess.access_level === 'write'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        <Shield size={14} />
                        <span>{accessInfo.label}</span>
                      </span>

                      {org.owner_email === userEmail && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium bg-amber-100 text-amber-700">
                          <Users size={14} />
                          <span>Propriétaire</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {!isSelected && (
                    <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>💡 Astuce :</strong> Vous pourrez changer d'organisation à tout moment depuis les paramètres.
          </p>
        </div>
      </div>
    </div>
  );
}