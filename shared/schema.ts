// Suppression totale de Drizzle
// import { pgTable, ... } from "drizzle-orm/pg-core";
// import { relations } from "drizzle-orm";
// import { createInsertSchema } from "drizzle-zod";
// import { z } from "zod";

// Types basés sur Prisma
export type User = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Team = {
  id: number;
  name: string;
  description: string | null;
  leaderId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TeamMember = {
  id: number;
  teamId: number;
  userId: string;
  role: string;
  joinedAt: Date;
};

export type Project = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  teamId: number | null;
  repositoryUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Release = {
  id: number;
  releaseId: string;
  name: string;
  description: string | null;
  status: string;
  recetteDate: Date | null;
  preprodDate: Date | null;
  productionDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ReleaseProject = {
  id: number;
  releaseId: number;
  projectId: number;
  addedAt: Date;
};

export type ProjectVersion = {
  id: number;
  projectId: number;
  version: string;
  status: string;
  description: string | null;
  note?: string | null;
  releaseId: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Commit = {
  id: number;
  gitRepoId: number;
  hash: string;
  message: string;
  author: string;
  authorEmail: string | null;
  committedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  projectVersionId: number | null;
};

export type Cab = {
  id: number;
  projectVersionId: number;
  environment: "preprod" | "prod";
  helpdeskUrl: string;
  status: "cree" | "demande" | "valide" | "refuse";
  createdAt: Date;
  updatedAt: Date;
};

export type Procedure = {
  id: number;
  versionGitRepoId: number;
  type: string;
  title: string;
  description: string | null;
  content: any;
  order: number | null;
  isCompleted: boolean | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectPv = {
  id: number;
  projectVersionId: number;
  category: "pv_fonctionnel_recette" | "pv_metier_recette" | "pv_conformite_preprod" | "pv_tests_homologation_preprod";
  status: "en_cours" | "validation" | "valide" | "refuse";
  createdAt: Date;
  updatedAt: Date;
};

export type PvFile = {
  id: number;
  pvId: number;
  fileName: string;
  filePath: string;
  fileSize: number | null;
  mimeType: string | null;
  uploadedAt: Date;
};

export type Arb = {
  id: number;
  title: string;
  description: string | null;
  type: string;
  status: string;
  requesterId: string;
  approverId: string | null;
  teamId: number | null;
  projectId: number | null;
  budget: number | null;
  priority: string;
  dueDate: Date | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type GitRepo = {
  id: number;
  name: string;
  url: string | null;
  branch: string | null;
  lastCommitHash: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectVersionGitRepo = {
  id: number;
  projectVersionId: number;
  gitRepoId: number;
  createdAt: Date;
  updatedAt: Date;
};

// Insert types for creating new records
export type UpsertUser = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role?: string;
};

export type InsertTeam = {
  name: string;
  description?: string;
  leaderId?: string;
};

export type InsertTeamMember = {
  teamId: number;
  userId: string;
  role?: string;
};

export type InsertProject = {
  name: string;
  description?: string;
  status?: string;
  teamId?: number;
  repositoryUrl?: string;
};

export type InsertProjectVersion = {
  projectId: number;
  version: string;
  description?: string;
  note?: string;
  status?: string;
  releaseId?: number;
  isActive?: boolean;
};

export type InsertGitRepo = {
  name: string;
  url?: string | null;
  branch?: string | null;
  lastCommitHash?: string | null;
};

export type InsertProjectVersionGitRepo = {
  projectVersionId: number;
  gitRepoId: number;
};

export type InsertCommit = {
  versionGitRepoId: number;
  hash: string;
  message: string;
  author: string;
  authorEmail?: string;
  committedAt: Date;
};

export type InsertCab = {
  projectVersionId: number;
  environment: "preprod" | "prod";
  helpdeskUrl: string;
  status?: "cree" | "demande" | "valide" | "refuse";
};

export type InsertProcedure = {
  versionGitRepoId: number;
  type: string;
  title: string;
  description?: string;
  content: any;
  order?: number;
  isCompleted?: boolean;
};

export type InsertRelease = {
  releaseId: string;
  name: string;
  description?: string;
  status?: string;
  recetteDate?: Date;
  preprodDate?: Date;
  productionDate?: Date;
};

export type InsertReleaseProject = {
  releaseId: number;
  projectId: number;
};

export type InsertProjectPv = {
  projectVersionId: number;
  category: "pv_fonctionnel_recette" | "pv_metier_recette" | "pv_conformite_preprod" | "pv_tests_homologation_preprod";
  status?: "en_cours" | "validation" | "valide" | "refuse";
};

export type InsertPvFile = {
  pvId: number;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
};

export type InsertArb = {
  title: string;
  description?: string;
  type: string;
  status?: string;
  requesterId: string;
  approverId?: string;
  teamId?: number;
  projectId?: number;
  budget?: number;
  priority?: string;
  dueDate?: Date;
};

// Extended types for UI
export type TeamWithMembers = Team & {
  leader?: User;
  members?: (TeamMember & { user: User })[];
  _count?: { members: number; projects: number };
};

export type ProjectWithTeam = Project & {
  team?: Team;
  versions?: ProjectVersion[];
};

export type ProjectVersionWithDetails = ProjectVersion & {
  project?: Project & { team?: Team };
  versionGitRepos?: ProjectVersionGitRepoWithDetails[];
  cabs?: CabWithDetails[];
  pvs?: (ProjectPv & { files: PvFile[] })[];
};

export type ProjectVersionGitRepoWithDetails = ProjectVersionGitRepo & {
  gitRepo?: GitRepoWithDetails;
  procedures?: Procedure[];
  proceduresByType?: ProceduresByType;
};

export type CabWithDetails = Cab & {
  assignee?: User;
};

export type ProceduresByType = {
  environment_variables: Procedure[];
  service_verification: Procedure[];
  command_execution: Procedure[];
  data_import: Procedure[];
};

export type ReleaseProceduresAggregated = {
  releaseId: number;
  projects: {
    projectId: number;
    projectName: string;
    versions: {
      versionId: number;
      version: string;
      versionGitRepos: {
        versionGitRepoId: number;
        gitRepo: {
          repoId: number;
          repoName: string;
        };
        procedures: ProceduresByType;
      }[];
    }[];
  }[];
};

export type ReleaseWithProjects = Release & {
  projectVersions?: (ProjectVersion & { project: Project })[];
};

export type ArbWithDetails = Arb & {
  requester: User;
  approver?: User;
  team?: Team;
  project?: Project;
};

export type GitRepoWithDetails = GitRepo & {
  commits?: Commit[];
};

// Les schémas de validation insert*Schema ne sont plus exportés ici (Drizzle/zod supprimés)
// Il faut supprimer ces imports dans server/routes.ts
