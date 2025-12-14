// ============================================================================
// Types TypeScript - Système multi-organisations
// Fichier: src/types/organizations.ts
// ============================================================================

import type { Parametres } from './index';

export interface Organization {
  id: string;
  name: string;
  owner_email: string;
  description?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
  parametres?: {
    societe_nom: string;
  } | null;
}

export interface UserOrganizationAccess {
  id: string;
  organization_id: string;
  user_email: string;
  access_level: 'read' | 'write' | 'admin';
  granted_by: string;
  created_at: string;
  updated_at: string;
  // Informations de l'organisation jointe
  organization?: Organization;
}

export interface CreateOrganizationRequest {
  name: string;
  description?: string;
  logo_url?: string;
}

export interface UpdateOrganizationRequest {
  id: string;
  name?: string;
  description?: string;
  logo_url?: string;
}

export interface OrganizationResponse {
  success: boolean;
  data?: Organization;
  error?: string;
}

export interface OrganizationsListResponse {
  success: boolean;
  data?: UserOrganizationAccess[];
  error?: string;
}

export interface AccessLevel {
  level: 'read' | 'write' | 'admin';
  label: string;
  description: string;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
}

export const ORG_ACCESS_LEVELS: Record<string, AccessLevel> = {
  read: {
    level: 'read',
    label: 'Lecture seule',
    description: 'Peut uniquement consulter les données',
    canRead: true,
    canWrite: false,
    canDelete: false,
    canManageUsers: false,
  },
  write: {
    level: 'write',
    label: 'Lecture + Écriture',
    description: 'Peut consulter et modifier les données',
    canRead: true,
    canWrite: true,
    canDelete: true,
    canManageUsers: false,
  },
  admin: {
    level: 'admin',
    label: 'Administrateur',
    description: 'Tous les droits, y compris la gestion des utilisateurs',
    canRead: true,
    canWrite: true,
    canDelete: true,
    canManageUsers: true,
  },
};