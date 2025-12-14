// ============================================================================
// API Functions - Gestion des organisations
// Fichier: src/lib/api-organizations.ts
// ============================================================================

import { supabase } from './supabase';
import type {
  Organization,
  UserOrganizationAccess,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  OrganizationResponse,
  OrganizationsListResponse,
} from '@/types/organizations';

/**
 * Récupérer toutes les organisations auxquelles un utilisateur a accès
 */
export async function getUserOrganizations(userEmail: string): Promise<OrganizationsListResponse> {
  try {
    // 1. Récupérer les accès via user_organization_access (organisations partagées)
    const {  sharedAccess, error: sharedError } = await supabase
      .from('user_organization_access')
      .select(`
        *,
        organization:organizations (
          id,
          name,
          description,
          logo_url,
          owner_email,
          created_at,
          updated_at
        )
      `)
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false });

    if (sharedError) {
      console.error('Erreur récupération accès partagés:', sharedError);
      return { success: false, error: sharedError.message };
    }

    // 2. Récupérer les organisations dont l'utilisateur est propriétaire
    const {  ownedOrgs, error: ownedError } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_email', userEmail)
      .order('created_at', { ascending: false });

    if (ownedError) {
      console.error('Erreur récupération organisations possédées:', ownedError);
      return { success: false, error: ownedError.message };
    }

    // 3. Charger les parametres pour TOUTES les organizations
    const allOrgIds = [
      ...new Set([
        ...ownedOrgs.map(o => o.id),
        ...sharedAccess.map(a => a.organization_id)
      ])
    ];

    const {  parametresData, error: paramError } = await supabase
      .from('parametres')
      .select('organization_id, societe_nom')
      .in('organization_id', allOrgIds);

    if (paramError) {
      console.warn('Erreur chargement paramètres:', paramError);
    }

    const paramMap = new Map(
      (parametresData || []).map(p => [p.organization_id, p.societe_nom])
    );

    // 4. Fusionner les données
    const ownedAccess: UserOrganizationAccess[] = (ownedOrgs || []).map(org => {
      const enrichedOrg = {
        ...org,
        parametres: { societe_nom: paramMap.get(org.id) || null }
      };
      return {
        id: `owner-${org.id}`,
        organization_id: org.id,
        user_email: userEmail,
        access_level: 'admin',
        granted_by: userEmail,
        granted_at: org.created_at,
        created_at: org.created_at,
        updated_at: org.updated_at,
        organization: enrichedOrg,
      };
    });

    const sharedAccessEnriched = (sharedAccess || []).map(access => {
      const org = access.organization;
      const enrichedOrg = {
        ...org,
        parametres: { societe_nom: paramMap.get(org.id) || null }
      };
      return {
        ...access,
        organization: enrichedOrg
      };
    });

    // 5. Éviter les doublons
    const allAccess = [...ownedAccess];
    const ownedIds = new Set(ownedOrgs.map(o => o.id));
    sharedAccessEnriched.forEach(acc => {
      if (!ownedIds.has(acc.organization_id)) {
        allAccess.push(acc);
      }
    });

    console.log(`✅ ${allAccess.length} organisation(s) trouvée(s) pour ${userEmail}`);
    return { success: true,  allAccess };
  } catch (error) {
    console.error('Erreur:', error);
    return { success: false, error: 'Erreur lors de la récupération des organisations' };
  }
}

/**
 * Créer une nouvelle organisation
 */
export async function createOrganization(
  userEmail: string,
  request: CreateOrganizationRequest
): Promise<OrganizationResponse> {
  try {
    if (!request.name || request.name.trim().length === 0) {
      return { success: false, error: 'Le nom de l\'organisation est requis' };
    }

    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: request.name.trim(),
        description: request.description?.trim() || null,
        logo_url: request.logo_url?.trim() || null,
        owner_email: userEmail,
      })
      .select()
      .single();

    if (orgError || !orgData) {
      console.error('Erreur création organisation:', orgError);
      return { success: false, error: orgError?.message || 'Erreur lors de la création' };
    }

    const { error: accessError } = await supabase
      .from('user_organization_access')
      .insert({
        organization_id: orgData.id,
        user_email: userEmail,
        access_level: 'admin',
        granted_by: userEmail,
      });

    if (accessError) {
      console.error('Erreur création accès:', accessError);
      return { success: false, error: 'Organisation créée mais erreur d\'accès' };
    }

    return { success: true, data: orgData };
  } catch (error) {
    console.error('Erreur:', error);
    return { success: false, error: 'Erreur lors de la création de l\'organisation' };
  }
}

/**
 * Mettre à jour une organisation
 */
export async function updateOrganization(
  userEmail: string,
  request: UpdateOrganizationRequest
): Promise<OrganizationResponse> {
  try {
    const { data: access, error: accessError } = await supabase
      .from('user_organization_access')
      .select('access_level')
      .eq('organization_id', request.id)
      .eq('user_email', userEmail)
      .single();

    if (accessError || !access || access.access_level !== 'admin') {
      return { success: false, error: 'Vous n\'avez pas les droits pour modifier cette organisation' };
    }

    const updateData: any = {};
    if (request.name !== undefined) updateData.name = request.name.trim();
    if (request.description !== undefined) updateData.description = request.description.trim() || null;
    if (request.logo_url !== undefined) updateData.logo_url = request.logo_url.trim() || null;

    const { data, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', request.id)
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || 'Erreur lors de la mise à jour' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erreur:', error);
    return { success: false, error: 'Erreur lors de la mise à jour de l\'organisation' };
  }
}

/**
 * Ajouter un utilisateur à une organisation
 */
export async function addUserToOrganization(
  currentUserEmail: string,
  organizationId: string,
  userEmail: string,
  accessLevel: 'read' | 'write' | 'admin'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: access, error: accessError } = await supabase
      .from('user_organization_access')
      .select('access_level')
      .eq('organization_id', organizationId)
      .eq('user_email', currentUserEmail)
      .single();

    if (accessError || !access || access.access_level !== 'admin') {
      return { success: false, error: 'Vous n\'avez pas les droits pour ajouter des utilisateurs' };
    }

    const { data: existingAccess } = await supabase
      .from('user_organization_access')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_email', userEmail)
      .single();

    if (existingAccess) {
      return { success: false, error: 'Cet utilisateur a déjà accès à cette organisation' };
    }

    const { error } = await supabase
      .from('user_organization_access')
      .insert({
        organization_id: organizationId,
        user_email: userEmail,
        access_level: accessLevel,
        granted_by: currentUserEmail,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Erreur:', error);
    return { success: false, error: 'Erreur lors de l\'ajout de l\'utilisateur' };
  }
}

/**
 * Modifier le niveau d'accès d'un utilisateur
 */
export async function updateUserOrganizationAccess(
  currentUserEmail: string,
  accessId: string,
  newAccessLevel: 'read' | 'write' | 'admin'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: targetAccess, error: fetchError } = await supabase
      .from('user_organization_access')
      .select('organization_id, user_email')
      .eq('id', accessId)
      .single();

    if (fetchError || !targetAccess) {
      return { success: false, error: 'Accès non trouvé' };
    }

    const { data: currentAccess, error: accessError } = await supabase
      .from('user_organization_access')
      .select('access_level')
      .eq('organization_id', targetAccess.organization_id)
      .eq('user_email', currentUserEmail)
      .single();

    if (accessError || !currentAccess || currentAccess.access_level !== 'admin') {
      return { success: false, error: 'Vous n\'avez pas les droits pour modifier cet accès' };
    }

    if (targetAccess.user_email === currentUserEmail && newAccessLevel !== 'admin') {
      return { success: false, error: 'Vous ne pouvez pas retirer vos propres droits admin' };
    }

    const { error } = await supabase
      .from('user_organization_access')
      .update({ access_level: newAccessLevel })
      .eq('id', accessId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Erreur:', error);
    return { success: false, error: 'Erreur lors de la modification de l\'accès' };
  }
}

/**
 * Retirer l'accès d'un utilisateur à une organisation
 */
export async function removeUserFromOrganization(
  currentUserEmail: string,
  accessId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: targetAccess, error: fetchError } = await supabase
      .from('user_organization_access')
      .select('organization_id, user_email')
      .eq('id', accessId)
      .single();

    if (fetchError || !targetAccess) {
      return { success: false, error: 'Accès non trouvé' };
    }

    const { data: currentAccess, error: accessError } = await supabase
      .from('user_organization_access')
      .select('access_level')
      .eq('organization_id', targetAccess.organization_id)
      .eq('user_email', currentUserEmail)
      .single();

    if (accessError || !currentAccess || currentAccess.access_level !== 'admin') {
      return { success: false, error: 'Vous n\'avez pas les droits pour retirer cet accès' };
    }

    if (targetAccess.user_email === currentUserEmail) {
      return { success: false, error: 'Vous ne pouvez pas retirer votre propre accès' };
    }

    const { error } = await supabase
      .from('user_organization_access')
      .delete()
      .eq('id', accessId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Erreur:', error);
    return { success: false, error: 'Erreur lors de la suppression de l\'accès' };
  }
}

/**
 * Récupérer les utilisateurs ayant accès à une organisation
 */
export async function getOrganizationUsers(
  currentUserEmail: string,
  organizationId: string
): Promise<{
  success: boolean;
  data?: UserOrganizationAccess[];
  error?: string;
}> {
  try {
    const { data: access, error: accessError } = await supabase
      .from('user_organization_access')
      .select('access_level')
      .eq('organization_id', organizationId)
      .eq('user_email', currentUserEmail)
      .single();

    if (accessError || !access) {
      return { success: false, error: 'Vous n\'avez pas accès à cette organisation' };
    }

    const { data, error } = await supabase
      .from('user_organization_access')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Erreur:', error);
    return { success: false, error: 'Erreur lors de la récupération des utilisateurs' };
  }
}