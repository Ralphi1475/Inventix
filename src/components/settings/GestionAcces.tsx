// ============================================================================
// Composant React - Gestion des accès partagés
// Fichier: src/components/settings/GestionAcces.tsx
// ============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, ShieldCheck, Mail, Calendar } from 'lucide-react';
import {
  getAuthorizedUsers,
  addAuthorizedUser,
  updateAuthorizedUser,
  deleteAuthorizedUser,
} from '@/lib/api';
import type {
  AuthorizedUser,
  CreateAuthorizedUserRequest,
} from '@/types/authorized-users';
import { useOrganization } from '@/context/OrganizationContext';
interface GestionAccesProps {
  userEmail: string;
}

export default function GestionAcces({ userEmail }: GestionAccesProps) {
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserAccessLevel, setNewUserAccessLevel] = useState<'read' | 'write'>('read');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { currentOrganization } = useOrganization();
  // Charger les utilisateurs autorisés
  useEffect(() => {
    loadAuthorizedUsers();
  }, [userEmail]);

  const loadAuthorizedUsers = async () => {
    setLoading(true);
    setError(null);
    
    const response = await getAuthorizedUsers(userEmail);
    
    if (response.success && response.data) {
      setAuthorizedUsers(response.data);
    } else {
      setError(response.error || 'Erreur lors du chargement');
    }
    
    setLoading(false);
  };

// Ajouter un utilisateur à une organisation spécifique
const handleAddUser = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setSuccess(null);

  if (!newUserEmail.trim()) {
    setError('Veuillez entrer une adresse email');
    return;
  }

  // ❗️ Ici, on utilise l'organisation active
  const currentOrgId = currentOrganization?.organization_id; // ← à récupérer via useOrganization
  if (!currentOrgId) {
    setError('Aucune organisation sélectionnée');
    return;
  }

  const request: CreateAuthorizedUserRequest = {
    authorized_email: newUserEmail.trim(),
    access_level: newUserAccessLevel,
  };

  // ✅ Utilise la bonne fonction
  const response = await addUserToOrganization(
    userEmail, // granted_by
    currentOrgId, // organization_id
    newUserEmail.trim(), // user_email
    newUserAccessLevel // access_level
  );

  if (response.success) {
    setSuccess('Utilisateur ajouté avec succès !');
    setNewUserEmail('');
    setNewUserAccessLevel('read');
    setShowAddForm(false);
    loadAuthorizedUsers(); // ou mieux : recharger les membres de l'org
  } else {
    setError(response.error || 'Erreur lors de l\'ajout');
  }
};

  // Modifier le niveau d'accès
  const handleToggleAccessLevel = async (user: AuthorizedUser) => {
    setError(null);
    setSuccess(null);

    const newLevel = user.access_level === 'read' ? 'write' : 'read';

    const response = await updateAuthorizedUser(userEmail, {
      id: user.id,
      access_level: newLevel,
    });

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

    setError(null);
    setSuccess(null);

    const response = await deleteAuthorizedUser(userEmail, userId);

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

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Accès partagés</h1>
        <p className="text-gray-600">
          Gérez les personnes qui peuvent accéder à vos données
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

      {/* Liste des utilisateurs */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            Utilisateurs autorisés ({authorizedUsers.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Chargement...
          </div>
        ) : authorizedUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucun utilisateur autorisé pour le moment
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {authorizedUsers.map((user) => (
              <div
                key={user.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Info utilisateur */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail size={16} className="text-gray-400" />
                      <span className="font-medium">{user.authorized_email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={14} />
                      <span>Ajouté le {formatDate(user.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Badge niveau d'accès */}
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

                    {/* Bouton supprimer */}
                    <button
                      onClick={() => handleDeleteUser(user.id, user.authorized_email)}
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

      {/* Info supplémentaire */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold mb-2 text-blue-900">ℹ️ Informations</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Les utilisateurs avec accès <strong>lecture seule</strong> peuvent uniquement consulter vos données</li>
          <li>• Les utilisateurs avec accès <strong>lecture + écriture</strong> peuvent modifier, ajouter et supprimer des données</li>
          <li>• Vous pouvez révoquer l'accès à tout moment</li>
          <li>• Les modifications apportées par les utilisateurs autorisés sont conservées même après révocation</li>
        </ul>
      </div>
    </div>
  );
}
