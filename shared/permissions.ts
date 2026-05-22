/**
 * Système de gestion des rôles et permissions — source de vérité partagée
 * entre client et serveur.
 *
 * Rôles disponibles:
 * - admin: Accès total à toutes les fonctionnalités
 * - prod: Voir tout mais ne peut pas modifier équipes ni ARB
 * - architecte: Voir tout mais ne peut modifier que les ARB
 * - po: Product Owner - Voir tout mais ne peut modifier que équipes et projets
 * - chef_projet: Chef de projet - Voir tout mais ne peut modifier que équipes et projets
 * - invite: Invité - Lecture seule sur tout
 * - viewer: Alias pour invite
 */

export type UserRole = 'admin' | 'prod' | 'architecte' | 'po' | 'chef_projet' | 'securite' | 'invite' | 'viewer';

export type Permission =
  | 'view_all'
  | 'edit_teams'
  | 'edit_projects'
  | 'edit_releases'
  | 'edit_arb'
  | 'edit_git_repos'
  | 'edit_procedures'
  | 'edit_security'
  | 'delete_teams'
  | 'delete_projects'
  | 'delete_releases'
  | 'delete_arb'
  | 'admin';

/**
 * Matrice des permissions par rôle
 */
export const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    'view_all',
    'edit_teams',
    'edit_projects',
    'edit_releases',
    'edit_arb',
    'edit_git_repos',
    'edit_procedures',
    'edit_security',
    'delete_teams',
    'delete_projects',
    'delete_releases',
    'delete_arb',
    'admin',
  ],
  prod: [
    'view_all',
    'edit_projects',
    'edit_releases',
    'edit_git_repos',
    'edit_procedures',
    'delete_projects',
    'delete_releases',
  ],
  architecte: [
    'view_all',
    'edit_arb',
    'delete_arb',
  ],
  po: [
    'view_all',
    'edit_teams',
    'edit_projects',
    'edit_git_repos',
    'delete_projects',
  ],
  chef_projet: [
    'view_all',
    'edit_teams',
    'edit_projects',
    'edit_git_repos',
    'delete_projects',
  ],
  securite: [
    'view_all',
    'edit_security',
  ],
  invite: ['view_all'],
  viewer: ['view_all'],
};

/**
 * Vérifie si un rôle possède une permission donnée
 */
export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
  if (!role) return false;

  const normalizedRole = role.toLowerCase() as UserRole;
  const permissions = rolePermissions[normalizedRole];

  if (!permissions) return false;

  return permissions.includes(permission);
}

/**
 * Vérifie si l'utilisateur peut éditer les équipes
 */
export function canEditTeams(role: string | null | undefined): boolean {
  return hasPermission(role, 'edit_teams');
}

/**
 * Vérifie si l'utilisateur peut éditer les projets
 */
export function canEditProjects(role: string | null | undefined): boolean {
  return hasPermission(role, 'edit_projects');
}

/**
 * Vérifie si l'utilisateur peut éditer les releases
 */
export function canEditReleases(role: string | null | undefined): boolean {
  return hasPermission(role, 'edit_releases');
}

/**
 * Vérifie si l'utilisateur peut éditer les ARB
 */
export function canEditArb(role: string | null | undefined): boolean {
  return hasPermission(role, 'edit_arb');
}

/**
 * Vérifie si l'utilisateur peut éditer les dépôts Git
 */
export function canEditGitRepos(role: string | null | undefined): boolean {
  return hasPermission(role, 'edit_git_repos');
}

/**
 * Vérifie si l'utilisateur peut éditer les procédures
 */
export function canEditProcedures(role: string | null | undefined): boolean {
  return hasPermission(role, 'edit_procedures');
}

/**
 * Vérifie si l'utilisateur peut supprimer des équipes
 */
export function canDeleteTeams(role: string | null | undefined): boolean {
  return hasPermission(role, 'delete_teams');
}

/**
 * Vérifie si l'utilisateur peut supprimer des projets
 */
export function canDeleteProjects(role: string | null | undefined): boolean {
  return hasPermission(role, 'delete_projects');
}

/**
 * Vérifie si l'utilisateur peut supprimer des releases
 */
export function canDeleteReleases(role: string | null | undefined): boolean {
  return hasPermission(role, 'delete_releases');
}

/**
 * Vérifie si l'utilisateur peut supprimer des ARB
 */
export function canDeleteArb(role: string | null | undefined): boolean {
  return hasPermission(role, 'delete_arb');
}

/**
 * Récupère toutes les permissions d'un rôle
 */
export function getRolePermissions(role: string | null | undefined): Permission[] {
  if (!role) return [];

  const normalizedRole = role.toLowerCase() as UserRole;
  return rolePermissions[normalizedRole] || [];
}

/**
 * Récupère la description d'un rôle
 */
export function getRoleDescription(role: string): string {
  const descriptions: Record<UserRole, string> = {
    admin: 'Administrateur - Accès complet à toutes les fonctionnalités',
    prod: 'Équipe Production - Peut tout voir et modifier sauf équipes et ARB',
    architecte: 'Architecte - Peut tout voir et modifier uniquement les ARB',
    po: 'Product Owner - Peut tout voir et modifier équipes et projets',
    chef_projet: 'Chef de Projet - Peut tout voir et modifier équipes et projets',
    securite: 'Équipe Sécurité - Peut tout voir et gérer les annonces de sécurité',
    invite: 'Invité - Lecture seule sur toutes les fonctionnalités',
    viewer: 'Visualiseur - Lecture seule sur toutes les fonctionnalités',
  };

  const normalizedRole = role.toLowerCase() as UserRole;
  return descriptions[normalizedRole] || 'Rôle inconnu';
}

/**
 * Liste de tous les rôles disponibles
 */
export const AVAILABLE_ROLES: Array<{ value: UserRole; label: string; description: string }> = [
  {
    value: 'admin',
    label: 'Administrateur',
    description: 'Accès complet à toutes les fonctionnalités',
  },
  {
    value: 'prod',
    label: 'Équipe Production',
    description: 'Peut tout voir et modifier sauf équipes et ARB',
  },
  {
    value: 'architecte',
    label: 'Architecte',
    description: 'Peut tout voir et modifier uniquement les ARB',
  },
  {
    value: 'po',
    label: 'Product Owner',
    description: 'Peut tout voir et modifier équipes et projets',
  },
  {
    value: 'chef_projet',
    label: 'Chef de Projet',
    description: 'Peut tout voir et modifier équipes et projets',
  },
  {
    value: 'securite',
    label: 'Équipe Sécurité',
    description: 'Peut tout voir et gérer les annonces de sécurité',
  },
  {
    value: 'invite',
    label: 'Invité',
    description: 'Lecture seule sur toutes les fonctionnalités',
  },
];
