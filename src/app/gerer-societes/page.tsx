'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { deleteOrganization } from '@/lib/api-organizations';
import { SUPER_ROOT_EMAILS } from '@/lib/constants';
import { Building2, Trash2, Users, Calendar, Briefcase } from 'lucide-react';

export default function GererSocietesPage() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (SUPER_ROOT_EMAILS.includes(userEmail)) {
      alert('Accès réservé au Super Root');
      router.push('/gestion');
      return;
    }

    loadOrganizations();
  };

  const loadOrganizations = async () => {
    setLoading(true);

    const { data: orgs } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    const orgsWithDetails = await Promise.all(
      (orgs || []).map(async (org) => {
        const { count } = await supabase
          .from('user_organization_access')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id);

        const { data: params } = await supabase
          .from('parametres')
          .select('societe_nom, societe_adresse, societe_ville')
          .eq('organization_id', org.id)
          .single();

        return { 
          ...org, 
          memberCount: count || 0,
          societeNom: params?.societe_nom || null,
          societeAdresse: params?.societe_adresse || null,
          societeVille: params?.societe_ville || null
        };
      })
    );

    setOrganizations(orgsWithDetails);
    setLoading(false);
  };

  const handleDelete = async (orgId: string, orgName: string) => {
    const confirmation = prompt(
      `⚠️ ATTENTION : Supprimer "${orgName}" supprimera TOUTES ses données.\n\nTapez le nom de la société pour confirmer :`
    );

    if (confirmation !== orgName) {
      alert('Suppression annulée');
      return;
    }

    setDeleting(orgId);

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.email) {
      alert('Erreur : utilisateur non connecté');
      setDeleting(null);
      return;
    }

    const result = await deleteOrganization(user.email, orgId);

    if (result.success) {
      alert('✅ Société supprimée avec succès');
      loadOrganizations();
    } else {
      alert(`❌ Erreur : ${result.error}`);
    }

    setDeleting(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Gestion des sociétés</h1>
          <button
            onClick={() => router.push('/gestion')}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            ← Retour
          </button>
        </div>

        {organizations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Aucune société créée
          </div>
        ) : (
          <div className="space-y-4">
            {organizations.map((org) => (
              <div
                key={org.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Building2 size={24} className="text-blue-600" />
                      <div>
                        <h3 className="text-xl font-bold">{org.name}</h3>
                        {org.societeNom && org.societeNom !== org.name && (
                          <div className="flex items-center gap-2 mt-1">
                            <Briefcase size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {org.societeNom}
                              {org.societeVille && ` • ${org.societeVille}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {org.description && (
                      <p className="text-gray-600 mb-3 ml-9">{org.description}</p>
                    )}

                    <div className="flex gap-4 text-sm text-gray-500 ml-9">
                      <div className="flex items-center gap-1">
                        <Users size={16} />
                        <span>{org.memberCount + 1} membre(s)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        <span>Créée le {new Date(org.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>

                    <div className="mt-2 text-sm ml-9">
                      <span className="text-gray-500">Propriétaire :</span>{' '}
                      <span className="font-medium">{org.owner_email}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(org.id, org.name)}
                    disabled={deleting === org.id}
                    className="ml-4 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Supprimer la société"
                  >
                    {deleting === org.id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-600 border-t-transparent"></div>
                    ) : (
                      <Trash2 size={20} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Attention :</strong> La suppression d'une société est irréversible et supprime toutes les données associées.
          </p>
        </div>
      </div>
    </div>
  );
}