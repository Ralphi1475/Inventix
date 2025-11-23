// ============================================================================
// Composant React - Gestion des organisations
// Fichier: src/components/settings/GestionOrganisations.tsx
// ============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Users, Trash2, Shield, Mail, Calendar, Save, X } from 'lucide-react';
import {
  getUserOrganizations,
  createOrganization,
  updateOrganization,
  getOrganizationUsers,
  addUserToOrganization,
  updateUserOrganizationAccess,
  removeUserFromOrganization,
} from '@/lib/api';
import { useOrganization } from '@/context/OrganizationContext';
import type {
  UserOrganizationAccess,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
} from '@/types/organizations';
import { ORG_ACCESS_LEVELS } from '@/types/organizations';

interface GestionOrganisationsProps {
  userEmail: string;
}

export default function GestionOrganisations({ userEmail }: GestionOrganisationsProps) {
  const { currentOrganization, setCurrentOrganization, userOrganizations, setUserOrganizations } = useOrganization();
  const [organizations, setOrganizations] = useState<UserOrganizationAccess[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<UserOrganizationAccess | null>(currentOrganization);
  const [orgUsers, setOrgUsers] = useState<UserOrganizationAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Formulaire création
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDescription, setNewOrgDescription] = useState('');

  // Formulaire édition
  const [editOrgName, setEditOrgName] = useState('');
  const [editOrgDescription, setEditOrgDescription] = useState('');

  // Formulaire ajout utilisateur
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserAccessLevel, setNewUserAccessLevel] = useState<'read' | 'write' | 'admin'>('read');

  useEffect(() => {
    loadOrganizations();
  }, [userEmail]);

  useEffect(() => {
    if (selectedOrg) {
      loadOrgUsers();
    }
  }, [selectedOrg]);

  const loadOrganizations = async () => {
    setLoading(true);
    setError(null);
    
    const response = await getUserOrganizations(userEmail);
    
    if (response.success && response.data) {
      setOrganizations(response.data);
      setUserOrganizations(response.data);
      if (!selectedOrg && response.data.length > 0) {
        setSelectedOrg(response.data[0]);
      }
    } else {
      setError(response.error || 'Erreur lors du chargement');
    }
    
    setLoading(false);
  };

  const loadOrgUsers = async () => {
    if (!selectedOrg) return;

    const response = await getOrganizationUsers(userEmail, selectedOrg.organization_id);
    
    if (response.success && response.data) {
      setOrgUsers(response.data);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newOrgName.trim()) {
      setError('Le nom est requis');
      return;
    }

    const request: CreateOrganizationRequest = {
      name: newOrgName.trim(),
      description: newOrgDescription.trim() || undefined,
    };

    const response = await createOrganization(userEmail, request);

    if (response.success) {
      setSuccess('Organisation créée avec succès !');
      setNewOrgName('');
      setNewOrgDescription('');
      setShowCreateForm(false);
      loadOrganizations();
    } else {
      setError(response.error || 'Erreur lors de la création');
    }
  };

  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg?.organization) return;

    setError(null);
    setSuccess(null);

    const request: UpdateOrganizationRequest = {
      id: selectedOrg.organization.id,
      name: editOrgName.trim(),
      description: editOrgDescription.trim() || undefined,
    };

    const response = await updateOrganization(userEmail, request);

    if (response.success) {
      setSuccess('Organisation mise à jour !');
      setShowEditForm(false);
      loadOrganizations();
    } else {
      setError(response.error || 'Erreur lors de la mise à jour');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;

    setError(null);
    setSuccess(null);

    if (!newUserEmail.trim()) {
      setError('Email requis');
      return;
    }

    const response = await addUserToOrganization(
      userEmail,
      selectedOrg.organization_id,
      newUserEmail.trim(),
      newUserAccessLevel
    );

    if (response.success) {
      setSuccess('Utilisateur ajouté avec succès !');
      setNewUserEmail('');
      setNewUserAccessLevel('read');
      setShowAddUserForm(false);
      loadOrgUsers();
    } else {
      setError(response.error || 'Erreur lors de l\'ajout');
    }
  };

  const handleToggleAccessLevel = async (user: UserOrganizationAccess) => {
    setError(null);
    setSuccess(null);

    const levels: ('read' | 'write' | 'admin')[] = ['read', 'write', 'admin'];
    const currentIndex = levels.indexOf(user.access_level);
    const newLevel = levels[(currentIndex + 1) % levels.length];

    const response = await updateUserOrganizationAccess(userEmail, user.id, newLevel);

    if (response.success) {
      setSuccess(`Accès modifié en "${ORG_ACCESS_LEVELS[newLevel].label}"`);
      loadOrgUsers();
    } else {
      setError(response.error || 'Erreur lors de la modification');
    }
  };

  const handleRemoveUser = async (userId: string, email: string) => {
    if (!confirm(`Voulez-vous vraiment retirer l'accès de ${email} ?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    const response = await removeUserFromOrganization(userEmail, userId);

    if (response.success) {
      setSuccess('Accès retiré avec succès');
      loadOrgUsers();
    } else {
      setError(response.error || 'Erreur lors de la suppression');
    }
  };

  const handleSelectOrganization = (org: UserOrganizationAccess) => {
    setSelectedOrg(org);
    setCurrentOrganization(org);
    setShowEditForm(false);
    setShowAddUserForm(false);
  };

  const startEdit = () => {
    if (selectedOrg?.organization) {
      setEditOrgName(selectedOrg.organization.name);
      setEditOrgDescription(selectedOrg.organization.description || '');
      setShowEditForm(true);
    }
  };

  const isAdmin = selectedOrg?.access_level === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Gestion des organisations</h1>
        <p className="text-gray-600">
          Gérez vos organisations et leurs membres
        </p>
      </div>

      {/* Messages */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des organisations */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold">Mes organisations</h2>
              <button
                onClick={() => setShowCreateForm(true)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                title="Créer une organisation"
              >
                <Plus size={20} />
              </button>
            </div>

            {showCreateForm && (
              <form onSubmit={handleCreateOrg} className="p-4 border-b border-gray-200 bg-blue-50">
                <h3 className="font-medium mb-3">Nouvelle organisation</h3>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Nom de l'organisation"
                  className="w-full px-3 py-2 border rounded-lg mb-2"
                  required
                />
                <textarea
                  value={newOrgDescription}
                  onChange={(e) => setNewOrgDescription(e.target.value)}
                  placeholder="Description (optionnel)"
                  className="w-full px-3 py-2 border rounded-lg mb-3"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Créer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}

            <div className="divide-y">
              {organizations.map((org) => (
                <button
                  key={org.organization_id}
                  onClick={() => handleSelectOrganization(org)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                    selectedOrg?.organization_id === org.organization_id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Building2 size={20} className="text-blue-600 mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{org.organization?.name}</div>
                      <div className="text-sm text-gray-600 truncate">
                        {ORG_ACCESS_LEVELS[org.access_level].label}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Détails et membres */}
        <div className="lg:col-span-2 space-y-6">
          {selectedOrg && (
            <>
              {/* Informations */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="font-semibold">Informations</h2>
                  {isAdmin && !showEditForm && (
                    <button
                      onClick={startEdit}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                    >
                      <Edit2 size={18} />
                    </button>
                  )}
                </div>

                {showEditForm && isAdmin ? (
                  <form onSubmit={handleUpdateOrg} className="p-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Nom</label>
                        <input
                          type="text"
                          value={editOrgName}
                          onChange={(e) => setEditOrgName(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                          value={editOrgDescription}
                          onChange={(e) => setEditOrgDescription(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg"
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Save size={18} />
                          <span>Enregistrer</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowEditForm(false)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          <X size={18} />
                          <span>Annuler</span>
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Nom</div>
                      <div className="font-medium">{selectedOrg.organization?.name}</div>
                    </div>
                    {selectedOrg.organization?.description && (
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Description</div>
                        <div>{selectedOrg.organization.description}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Votre niveau d'accès</div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-medium ${
                        selectedOrg.access_level === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : selectedOrg.access_level === 'write'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        <Shield size={14} />
                        {ORG_ACCESS_LEVELS[selectedOrg.access_level].label}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Membres */}
              {isAdmin && (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="font-semibold">Membres ({orgUsers.length})</h2>
                    <button
                      onClick={() => setShowAddUserForm(!showAddUserForm)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      <Plus size={18} />
                      <span>Ajouter</span>
                    </button>
                  </div>

                  {showAddUserForm && (
                    <form onSubmit={handleAddUser} className="p-4 border-b bg-blue-50">
                      <h3 className="font-medium mb-3">Nouveau membre</h3>
                      <input
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="Email"
                        className="w-full px-3 py-2 border rounded-lg mb-3"
                        required
                      />
                      <div className="space-y-2 mb-3">
                        {(['read', 'write', 'admin'] as const).map((level) => (
                          <label key={level} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-white">
                            <input
                              type="radio"
                              value={level}
                              checked={newUserAccessLevel === level}
                              onChange={(e) => setNewUserAccessLevel(e.target.value as any)}
                            />
                            <div className="flex-1">
                              <div className="font-medium">{ORG_ACCESS_LEVELS[level].label}</div>
                              <div className="text-xs text-gray-600">{ORG_ACCESS_LEVELS[level].description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          Ajouter
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddUserForm(false)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          Annuler
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="divide-y">
                    {orgUsers.map((user) => (
                      <div key={user.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <Mail size={18} className="text-gray-400" />
                            <div>
                              <div className="font-medium">{user.user_email}</div>
                              {user.user_email === selectedOrg.organization?.owner_email && (
                                <div className="text-xs text-amber-600">Propriétaire</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleAccessLevel(user)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                user.access_level === 'admin'
                                  ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                  : user.access_level === 'write'
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              }`}
                            >
                              {ORG_ACCESS_LEVELS[user.access_level].label}
                            </button>
                            {user.user_email !== userEmail && (
                              <button
                                onClick={() => handleRemoveUser(user.id, user.user_email)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}