'use client';
import { useEffect, useState } from 'react';
import { Building, Users, ChevronRight, Building2, Send } from 'lucide-react';
import { getUserOrganizations } from '@/lib/api-organizations';
import { useOrganization } from '@/context/OrganizationContext';
import { supabase } from '@/lib/supabase';

interface OrganizationSelectorProps {
  userEmail: string;
  onSelect: () => void;
}

export default function OrganizationSelector({ userEmail, onSelect }: OrganizationSelectorProps) {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setCurrentOrganization } = useOrganization();
  
  const [showDemande, setShowDemande] = useState(false);
  const [nomSociete, setNomSociete] = useState('');
  const [description, setDescription] = useState('');
  const [telephone, setTelephone] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadOrganizations();
  }, [userEmail]);

  const loadOrganizations = async () => {
    setLoading(true);
    setError(null);

    const result = await getUserOrganizations(userEmail);

    if (result.success && result.data) {
      console.log(`✅ ${result.data.length} organisation(s) trouvée(s) pour ${userEmail}`);
      
      // Charger les paramètres pour chaque organisation
      const orgsWithParams = await Promise.all(
        result.data.map(async (org) => {
          const { data: params } = await supabase
            .from('parametres')
            .select('societe_nom, societe_ville')
            .eq('organization_id', org.organization_id)
            .single();

          return {
            ...org,
            societeNom: params?.societe_nom || null,
            societeVille: params?.societe_ville || null
          };
        })
      );

      setOrganizations(orgsWithParams);
    } else {
      setError(result.error || 'Erreur de chargement');
    }

    setLoading(false);
  };

  const handleSelectOrganization = (org: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('current_organization_id', org.organization_id);
    }
    setCurrentOrganization(org);
    onSelect();
  };

  const handleDemandeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMessage('');

    try {
      const response = await fetch('/api/demande-societe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          nomSociete,
          description,
          telephone
        })
      });

      if (response.ok) {
        setMessage('✅ Demande envoyée ! Vous serez contacté prochainement.');
        setNomSociete('');
        setDescription('');
        setTelephone('');
        setTimeout(() => setShowDemande(false), 3000);
      } else {
        setMessage('❌ Erreur lors de l\'envoi');
      }
    } catch (error) {
      setMessage('❌ Erreur réseau');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des organisations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700">{error}</p>
        <button
          onClick={loadOrganizations}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center mb-6">
          <Building className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-bold mb-2">Aucune organisation</h2>
          <p className="text-gray-600">
            Vous n'avez accès à aucune organisation pour le moment. Contactez un administrateur pour obtenir un accès.
          </p>
        </div>

        {!showDemande ? (
          <button
            onClick={() => setShowDemande(true)}
            className="w-full flex items-center justify-center gap-2 p-4 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Building2 size={20} />
            <span className="font-medium">Demander la création d'une société</span>
          </button>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">Demande de création de société</h3>
            
            {message && (
              <div className={`mb-4 p-3 rounded ${message.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message}
              </div>
            )}

            <form onSubmit={handleDemandeSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Nom de la société *</label>
                <input
                  type="text"
                  value={nomSociete}
                  onChange={(e) => setNomSociete(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                  disabled={sending}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Description / Activité</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  disabled={sending}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Téléphone (optionnel)</label>
                <input
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  disabled={sending}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send size={18} />
                  {sending ? 'Envoi...' : 'Envoyer la demande'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDemande(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  disabled={sending}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Sélectionnez une organisation</h2>
      
      <div className="space-y-3">
        {organizations.map((org) => (
          <button
            key={org.organization_id}
            onClick={() => handleSelectOrganization(org)}
            className="w-full bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 text-left border border-gray-200 hover:border-blue-500"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Building className="w-10 h-10 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-lg">
                    {org.societeNom || org.organization?.name || 'Organisation'}
                  </h3>
                  {org.organization?.description && (
                    <p className="text-sm text-gray-600 mt-1">{org.organization.description}</p>
                  )}
                  {org.societeVille && (
                    <p className="text-xs text-gray-500 mt-1">📍 {org.societeVille}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      org.access_level === 'admin' 
                        ? 'bg-purple-100 text-purple-700'
                        : org.access_level === 'write'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {org.access_level === 'admin' ? 'Administrateur' : 
                       org.access_level === 'write' ? 'Lecture + Écriture' : 'Lecture seule'}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}