import { useAuth } from './useAuth';
import type { Permission } from '@/lib/permissions';
import {
  hasPermission,
  canEditTeams,
  canEditProjects,
  canEditReleases,
  canEditArb,
  canEditGitRepos,
  canEditProcedures,
  canDeleteTeams,
  canDeleteProjects,
  canDeleteReleases,
  canDeleteArb,
} from '@/lib/permissions';

/**
 * Hook personnalisé pour gérer les permissions de l'utilisateur
 */
export function usePermissions() {
  const { role } = useAuth();

  return {
    role,
    hasPermission: (permission: Permission) => hasPermission(role, permission),
    canEditTeams: () => canEditTeams(role),
    canEditProjects: () => canEditProjects(role),
    canEditReleases: () => canEditReleases(role),
    canEditArb: () => canEditArb(role),
    canEditGitRepos: () => canEditGitRepos(role),
    canEditProcedures: () => canEditProcedures(role),
    canDeleteTeams: () => canDeleteTeams(role),
    canDeleteProjects: () => canDeleteProjects(role),
    canDeleteReleases: () => canDeleteReleases(role),
    canDeleteArb: () => canDeleteArb(role),
  };
}
