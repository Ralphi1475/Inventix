// ============================================================================
// Composant React - Gestion des accès partagés POUR UNE ORGANISATION
// Fichier: src/components/settings/GestionAcces.tsx
// ============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, ShieldCheck, Mail, Calendar } from 'lucide-react';
import {
  addUserToOrganization,
  updateUserOrganizationAccess,
  removeUserFromOrganization,
  getOrganizationUsers,
} from '@/lib/api';
import { useOrganization } from '@/context/OrganizationContext';

interface GestionAccesProps {
  userEmail: string;
}

export default function GestionAcces({ userEmail }: GestionAccesProps) {
  const { currentOrganization } = useOrganization();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserAccessLevel, setNewUserAccessLevel] = useState<'read' | 'write'>('read');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Charger les membres de l'organisation active
  useEffect(() => {
    if (!currentOrganization) return;
    loadMembers();
  }, [currentOrganization]);

  const loadMembers = async () => {
    if (!currentOrganization) return;
    setLoading(true);
    setError(null);
    
    const response = await getOrganizationUsers(userEmail, currentOrganization.organization_id);
    
    if (response.success && response.data) {
      // Filtrer l'utilisateur courant (on ne veut pas se voir soi-même)
      const filtered = response.data.filter((m: any) => m.user_email !== userEmail);
      setMembers(filtered);
    } else {
      setError(response.error || 'Erreur lors du chargement');
    }
    
    setLoading(false);
  };

  // Ajouter un membre à l'organisation active
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newUserEmail.trim()) {
      setError('Veuillez entrer une adresse email');
      return;
    }

    if (!currentOrganization) {
      setError('Aucune organisation sélectionnée');
      return;
    }

    const response = await addUserToOrganization(
      userEmail, // granted_by
      currentOrganization.organization_id, // organization_id
      newUserEmail.trim(), // user_email
      newUserAccessLevel // access_level
    );

    if (response.success) {
      setSuccess('Utilisateur ajouté avec succès !');
      setNewUserEmail('');
      setNewUserAccessLevel('read');
      setShowAddForm(false);
      loadMembers();
    } else {
      setError(response.error || 'Erreur lors de l\'ajout');
    }
  };

  // Modifier le niveau d'accès
  const handleToggleAccessLevel = async (member: any) => {
    setError(null);
    setSuccess(null);

    const newLevel = member.access_level === 'read' ? 'write' : 'read';

    const response = await updateUserOrganizationAccess(
      userEmail,
      member.id,
      newLevel
    );

    if (response.success) {
      setSuccess(`Accès modifié en "${newLevel === 'read' ? 'Lecture seule' : 'Lecture + Écriture'}"`);
      loadMembers();
    } else {
      setError(response.error || 'Erreur lors de la modification');
    }
  };

  // Supprimer un membre
  const handleDeleteUser = async (memberId: string, email: string) => {
    if (!confirm(`Voulez-vous vraiment révoquer l'accès de ${email} ?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    const response = await removeUserFromOrganization(userEmail, memberId);

    if (response.success) {
      setSuccess('Accès révoqué avec succès');
      loadMembers();
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
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Veuillez sélectionner une société pour gérer les accès.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Accès partagés</h1>
        <p className="text-gray-600">
          Gérez les personnes qui peuvent accéder à <strong>{currentOrganization.organization?.name || 'cette société'}</strong>
        </p>
      </div>

      {/* Messages de succès/erreur */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Bouton Ajouter */}
      <div className="mb-6">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus size={20} />
            <span>Ajouter un utilisateur</span>
          </button>
        ) : (
          <form
            onSubmit={handleAddUser}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
          >
            <h3 className="text-lg font-semibold mb-4">Nouvel utilisateur</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Adresse email
              </label>
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="exemple@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Niveau d'accès
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="access_level"
                    value="read"
                    checked={newUserAccessLevel === 'read'}
                    onChange={(e) => setNewUserAccessLevel(e.target.value as 'read')}
                    className="text-blue-600"
                  />
                  <div>
                    <div className="font-medium">Lecture seule</div>
                    <div className="text-sm text-gray-600">
                      Peut uniquement consulter les données
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="access_level"
                    value="write"
                    checked={newUserAccessLevel === 'write'}
                    onChange={(e) => setNewUserAccessLevel(e.target.value as 'write')}
                    className="text-blue-600"
                  />
                  <div>
                    <div className="font-medium">Lecture + Écriture</div>
                    <div className="text-sm text-gray-600">
                      Peut consulter et modifier les données
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ajouter
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewUserEmail('');
                  setNewUserAccessLevel('read');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Liste des membres */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            Membres ({members.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Chargement...
          </div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucun membre pour le moment
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {members.map((member) => (
              <div
                key={member.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail size={16} className="text-gray-400" />
                      <span className="font-medium">{member.user_email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={14} />
                      <span>Ajouté le {formatDate(member.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAccessLevel(member)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        member.access_level === 'write'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                      title="Modifier le niveau d'accès"
                    >
                      {member.access_level === 'write' ? (
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
                      onClick={() => handleDeleteUser(member.id, member.user_email)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Révoquer l'accès"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold mb-2 text-blue-900">ℹ️ Informations</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Les membres peuvent accéder à cette société uniquement</li>
          <li>• Vous (propriétaire) ne pouvez pas être supprimé</li>
          <li>• Les modifications sont visibles en temps réel pour tous les membres</li>
        </ul>
      </div>
    </div>
  );
}