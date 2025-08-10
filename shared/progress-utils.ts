import type { ProjectVersionWithDetails } from './schema';

export interface VersionProgress {
  percentage: number;
  milestones: {
    releaseAssociated: boolean;
    repositoryAssociated: boolean;
    proceduresAdded: boolean;
    recetteFinalized: boolean;
    preprodFinalized: boolean;
  };
  completionStatus: 'in_progress' | 'recette_finalized' | 'preprod_finalized' | 'production_deployed';
}

export function calculateVersionProgress(version: ProjectVersionWithDetails): VersionProgress {
  const milestones = {
    releaseAssociated: false,
    repositoryAssociated: false, 
    proceduresAdded: false,
    recetteFinalized: false,
    preprodFinalized: false,
  };

  // 1. Release associée (20%)
  milestones.releaseAssociated = !!version.releaseId;

  // 2. Au moins un repository associé (20%)
  milestones.repositoryAssociated = !!(version.versionGitRepos && version.versionGitRepos.length > 0);

  // 3. Au moins une procédure ajoutée pour chaque repository (20%)
  if (milestones.repositoryAssociated) {
    milestones.proceduresAdded = version.versionGitRepos!.every(versionGitRepo => 
      versionGitRepo.procedures && versionGitRepo.procedures.length > 0
    );
  }

  // 4. Recette finalisée (20%) = 2 PVs recette + 1 CAB preprod (used for recette validation)
  const pvRecette = version.pvs?.filter(pv => 
    pv.category === 'pv_fonctionnel_recette' || pv.category === 'pv_metier_recette'
  ) || [];
  // For recette, we use CABs with preprod environment (as testing environment)
  const cabForRecette = version.cabs?.filter(cab => cab.environment === 'preprod') || [];
  milestones.recetteFinalized = pvRecette.length >= 2 && cabForRecette.length >= 1;

  // 5. Pré-production finalisée (20%) = 2 PVs préprod + 1 CAB prod (for production release)  
  const pvPreprod = version.pvs?.filter(pv => 
    pv.category === 'pv_conformite_preprod' || pv.category === 'pv_tests_homologation_preprod'
  ) || [];
  const cabProd = version.cabs?.filter(cab => cab.environment === 'prod') || [];
  milestones.preprodFinalized = pvPreprod.length >= 2 && cabProd.length >= 1;

  // Calculate percentage
  const completedMilestones = Object.values(milestones).filter(Boolean).length;
  const percentage = completedMilestones * 20;

  // Determine completion status
  let completionStatus: 'in_progress' | 'recette_finalized' | 'preprod_finalized' = 'in_progress';
  if (milestones.preprodFinalized) {
    completionStatus = 'preprod_finalized';
  } else if (milestones.recetteFinalized) {
    completionStatus = 'recette_finalized';
  }

  return {
    percentage,
    milestones,
    completionStatus
  };
}