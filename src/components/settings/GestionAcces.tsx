// ============================================================================
// Composant React - Gestion des accès partagés (CORRIGÉ)
// Fichier: src/components/settings/GestionAcces.tsx
// ============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, ShieldCheck, Mail, Calendar } from 'lucide-react';
import {
  addUserToOrganization,
  getOrganizationUsers,
  updateUserOrganizationAccess,
  removeUserFromOrganization,
} from '@/lib/api-organizations';
import type { UserOrganizationAccess } from '@/types/organizations';
import { useOrganization } from '@/context/OrganizationContext';

// Suppression de la prop userEmail → on l'obtient via Supabase
export default function GestionAcces() {
  const { currentOrganization } = useOrganization();
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [authorizedUsers, setAuthorizedUsers] = useState<UserOrganizationAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserAccessLevel, setNewUserAccessLevel] = useState<'read' | 'write'>('read');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Charger l'email de l'utilisateur connecté
  useEffect(() => {
    const fetchUser = async () => {
      const {  { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession();
      setCurrentUserEmail(session?.user.email || null);
    };
    fetchUser();
  }, []);

  // Charger les utilisateurs autorisés
  useEffect(() => {
    if (currentUserEmail && currentOrganization) {
      loadAuthorizedUsers();
    }
  }, [currentUserEmail, currentOrganization]);

  const loadAuthorizedUsers = async () => {
    if (!currentUserEmail || !currentOrganization) return;

    setLoading(true);
    setError(null);
    
    const response = await getOrganizationUsers(currentUserEmail, currentOrganization.id);
    
    if (response.success && response.data) {
      // Filtrer l'utilisateur courant s'il est inclus
      const filtered = response.data.filter(u => u.user_email !== currentUserEmail);
      setAuthorizedUsers(filtered);
    } else {
      setError(response.error || 'Erreur lors du chargement');
    }
    
    setLoading(false);
  };

  // Ajouter un utilisateur
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newUserEmail.trim()) {
      setError('Veuillez entrer une adresse email');
      return;
    }

    if (!currentUserEmail || !currentOrganization) return;

    const response = await addUserToOrganization(
      currentUserEmail,
      currentOrganization.id,
      newUserEmail.trim(),
      newUserAccessLevel
    );

    if (response.success) {
      setSuccess('Utilisateur ajouté avec succès !');
      setNewUserEmail('');
      setNewUserAccessLevel('read');
      setShowAddForm(false);
      loadAuthorizedUsers();
    } else {
      setError(response.error || 'Erreur lors de l\'ajout');
    }
  };

  // Modifier le niveau d'accès
  const handleToggleAccessLevel = async (user: UserOrganizationAccess) => {
    if (!currentUserEmail) return;

    setError(null);
    setSuccess(null);

    const newLevel = user.access_level === 'read' ? 'write' : 'read';

    const response = await updateUserOrganizationAccess(currentUserEmail, user.id, newLevel as any);

    if (response.success) {
      setSuccess(`Accès modifié en "${newLevel === 'read' ? 'Lecture seule' : 'Lecture + Écriture'}"`);
      loadAuthorizedUsers();
    } else {
      setError(response.error || 'Erreur lors de la modification');
    }
  };

  // Supprimer un utilisateur
  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Voulez-vous vraiment révoquer l'accès de ${email} ?`)) {
      return;
    }

    if (!currentUserEmail) return;

    setError(null);
    setSuccess(null);

    const response = await removeUserFromOrganization(currentUserEmail, userId);

    if (response.success) {
      setSuccess('Accès révoqué avec succès');
      loadAuthorizedUsers();
    } else {
      setError(response.error || 'Erreur lors de la suppression');
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (!currentOrganization) {
    return <div className="p-6">Veuillez sélectionner une organisation.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* ... le reste de votre JSX reste IDENTIQUE ... */}
      {/* (Je ne le répète pas pour la lisibilité, mais il est inchangé) */}
      {/* La seule différence : `user.authorized_email` → `user.user_email` */}

      {/* Exemple de modification dans le map : */}
      {authorizedUsers.map((user) => (
        <div key={user.id} className="p-4 hover:bg-gray-50 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Mail size={16} className="text-gray-400" />
                <span className="font-medium">{user.user_email}</span> {/* ← ici */}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={14} />
                <span>Ajouté le {formatDate(user.created_at)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleAccessLevel(user)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  user.access_level === 'write'
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
                title="Cliquer pour modifier le niveau d'accès"
              >
                {user.access_level === 'write' ? (
                  <>
                    <ShieldCheck size={16} />
                    <span>Lecture + Écriture</span>
                  </>
                ) : (
                  <>
                    <Shield size={16} />
                    <span>Lecture seule</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleDeleteUser(user.id, user.user_email)} // ← ici aussi
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Révoquer l'accès"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* ... le reste du JSX identique ... */}
    </div>
  );
}