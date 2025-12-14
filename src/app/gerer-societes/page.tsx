'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { deleteOrganization } from '@/lib/api-organizations';
import { SUPER_ROOT_EMAIL } from '@/lib/constants';
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
    
    if (!user || user.email !== SUPER_ROOT_EMAIL) {
      alert('Accès réservé au Super Root');
      router.push('/gestion');
      return;
    }

    loadOrganizations();
  };

  const loadOrganizations = async () => {
    setLoading(true);

    // Charger toutes les organisations
    const { data: orgs } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    // Pour chaque org, compter les membres ET charger les paramètres
    const orgsWithDetails = await Promise.all(
      (orgs || []).map(async (org) => {
        // Compter les membres
        const { count } = await supabase
          .from('user_organization_access')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id);

        // Charger les paramètres (nom exact de la société)
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
      `⚠️ ATTENTION : Supprimer "${orgName}" supprimera TOUTES ses données (articles, ventes, achats, etc.).\n\nTapez le nom de la société pour confirmer :`
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
          <div className="bg-white rounded-lg shad