// Suppression totale de Drizzle
// import { pgTable, ... } from "drizzle-orm/pg-core";
// import { relations } from "drizzle-orm";
// import { createInsertSchema } from "drizzle-zod";
// import { z } from "zod";

// Session storage table
export const sessions = {
  sid: String,
  sess: Object,
  expire: Date,
};

// User storage table
export const users = {
  id: String,
  email: String,
  firstName: String,
  lastName: String,
  profileImageUrl: String,
  role: String, // admin, manager, dev, ops, viewer
  createdAt: Date,
  updatedAt: Date,
};

// Teams table
export const teams = {
  id: Number,
  name: String,
  description: String,
  leaderId: String,
  createdAt: Date,
  updatedAt: Date,
};

// Team members junction table
export const teamMembers = {
  id: Number,
  teamId: Number,
  userId: String,
  role: String, // lead, senior, member
  joinedAt: Date,
};

// Projects table
export const projects = {
  id: Number,
  name: String,
  description: String,
  status: String, // development, testing, preproduction, production
  teamId: Number,
  repositoryUrl: String,
  createdAt: Date,
  updatedAt: Date,
};

// Releases table
export const releases = {
  id: Number,
  releaseId: String, // Format: YYYYMM-NN (auto-generated)
  name: String,
  description: String,
  status: String, // 0, 1, 2, 3, 4, 5, Annulé
  recetteDate: Date, // Date de mise en recette
  preprodDate: Date, // Date de mise en préprod
  productionDate: Date, // Date de mise en production
  createdAt: Date,
  updatedAt: Date,
};

// Release-Project junction table
export const releaseProjects = {
  id: Number,
  releaseId: Number,
  projectId: Number,
  addedAt: Date,
};

// Project versions table for detailed version management
export const projectVersions = {
  id: Number,
  projectId: Number,
  version: String,
  description: String,
  status: String, // 0, 1, 2, 3, 4, 5, Annulé
  releaseId: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,
};

// Git repositories for project versions
export const gitRepos = {
  id: Number,
  projectVersionId: Number,
  name: String,
  url: String,
  lastCommitHash: String,
  createdAt: Date,
  updatedAt: Date,
};

// Commits for git repositories (specific to project version)
export const commits = {
  id: Number,
  gitRepoId: Number,
  hash: String,
  message: String,
  author: String,
  authorEmail: String,
  committedAt: Date,
  createdAt: Date,
};

// CAB tickets for project versions
export const cab = {
  id: Number,
  projectVersionId: Number,
  ticketNumber: String,
  title: String,
  description: String,
  status: String, // open, in_progress, approved, rejected, closed
  priority: String, // low, medium, high, critical
  assigneeId: String,
  dueDate: Date,
  createdAt: Date,
  updatedAt: Date,
};

// Procedures organized by type and git repository
export const procedures = {
  id: Number,
  gitRepoId: Number,
  type: String, // environment_variables, service_verification, command_execution, data_import
  title: String,
  description: String,
  content: Object, // Structured content based on type
  order: Number,
  isCompleted: Boolean,
  createdAt: Date,
  updatedAt: Date,
};

// Process Verbals (PVs) - 4 types per project version
export const projectPvs = {
  id: Number,
  projectVersionId: Number,
  type: String, // pv_fonctionnel_recette, pv_metier_recette, pv_conformite_preprod, pv_tests_homologation_preprod
  status: String, // draft, completed, approved
  createdAt: Date,
  updatedAt: Date,
};

// Files for PVs
export const pvFiles = {
  id: Number,
  pvId: Number,
  fileName: String,
  filePath: String,
  fileSize: Number,
  mimeType: String,
  uploadedAt: Date,
};

// ARB (Access/Responsibilities/Budgets) table
export const arb = {
  id: Number,
  title: String,
  description: String,
  type: String, // access, responsibility, budget
  status: String, // pending, approved, rejected, in_review
  requesterId: String,
  approverId: String,
  teamId: Number,
  projectId: Number,
  budget: Number, // Amount in cents if type is budget
  priority: String, // low, medium, high, critical
  dueDate: Date,
  approvedAt: Date,
  createdAt: Date,
  updatedAt: Date,
};

// Types
export type UpsertUser = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role?: string;
};

export type User = typeof users;
export type InsertTeam = {
  name: string;
  description?: string;
  leaderId?: string;
};

export type Team = typeof teams;
export type InsertTeamMember = {
  teamId: number;
  userId: string;
  role?: string;
};

export type TeamMember = typeof teamMembers;
export type InsertProject = {
  name: string;
  description?: string;
  status?: string;
  teamId?: number;
  repositoryUrl?: string;
};

export type Project = typeof projects;
export type InsertProjectVersion = {
  projectId: number;
  version: string;
  description?: string;
  status?: string;
  releaseId?: number;
  isActive?: boolean;
};

export type ProjectVersion = typeof projectVersions;
export type InsertGitRepo = {
  projectVersionId: number;
  name: string;
  url: string;
  lastCommitHash?: string;
};

export type GitRepo = typeof gitRepos;
export type InsertCommit = {
  gitRepoId: number;
  hash: string;
  message: string;
  author: string;
  authorEmail?: string;
  committedAt: Date;
};

export type Commit = typeof commits;
export type InsertCab = {
  projectVersionId: number;
  ticketNumber: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  dueDate?: Date;
};

export type Cab = typeof cab;
export type InsertProcedure = {
  gitRepoId: number;
  type: string;
  title: string;
  description?: string;
  content: Object;
  order?: number;
  isCompleted?: boolean;
};

export type Procedure = typeof procedures;
export type InsertRelease = {
  releaseId: string;
  name: string;
  description?: string;
  status?: string;
  recetteDate?: Date;
  preprodDate?: Date;
  productionDate?: Date;
};

export type Release = typeof releases;
export type InsertReleaseProject = {
  releaseId: number;
  projectId: number;
};

export type ReleaseProject = typeof releaseProjects;
export type InsertProjectPv = {
  projectVersionId: number;
  type: string;
  status?: string;
};

export type ProjectPv = typeof projectPvs;
export type InsertPvFile = {
  pvId: number;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
};

export type PvFile = typeof pvFiles;
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

export type Arb = typeof arb;

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
  gitRepos?: GitRepoWithDetails[];
  cabs?: CabWithDetails[];
  pvs?: (ProjectPv & { files: PvFile[] })[];
};

export type GitRepoWithDetails = GitRepo & {
  commits?: Commit[];
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
      gitRepos: {
        repoId: number;
        repoName: string;
        procedures: ProceduresByType;
      }[];
    }[];
  }[];
};

export type ReleaseWithProjects = Release & {
  releaseProjects?: (ReleaseProject & { project: Project })[];
};

export type ArbWithDetails = Arb & {
  requester: User;
  approver?: User;
  team?: Team;
  project?: Project;
};

// Les schémas de validation insert*Schema ne sont plus exportés ici (Drizzle/zod supprimés)
// Il faut supprimer ces imports dans server/routes.ts
