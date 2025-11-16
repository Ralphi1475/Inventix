// ============================================================================
// Types TypeScript - Système de partage d'accès
// Fichier: src/types/authorized-users.ts
// ============================================================================

export interface AuthorizedUser {
  id: string;
  owner_email: string;
  authorized_email: string;
  access_level: 'read' | 'write';
  created_at: string;
  updated_at: string;
}

export interface CreateAuthorizedUserRequest {
  authorized_email: string;
  access_level: 'read' | 'write';
}

export interface UpdateAuthorizedUserRequest {
  id: string;
  access_level: 'read' | 'write';
}

export interface AuthorizedUserResponse {
  success: boolean;
  data?: AuthorizedUser;
  error?: string;
}

export interface AuthorizedUsersListResponse {
  success: boolean;
  data?: AuthorizedUser[];
  error?: string;
}

export interface AccessLevel {
  level: 'read' | 'write';
  label: string;
  description: string;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
}

export const ACCESS_LEVELS: Record<string, AccessLevel> = {
  read: {
    level: 'read',
    label: 'Lecture seule',
    description: 'Peut uniquement consulter les données',
    canRead: true,
    canWrite: false,
    canDelete: false,
  },
  write: {
    level: 'write',
    label: 'Lecture + Écriture',
    description: 'Peut consulter et modifier les données',
    canRead: true,
    canWrite: true,
    canDelete: true,
  },
};