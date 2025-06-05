import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  date,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("viewer"), // admin, manager, dev, ops, viewer
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teams table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  leaderId: varchar("leader_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team members junction table
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").references(() => teams.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: varchar("role").notNull().default("member"), // lead, senior, member
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status").notNull().default("development"), // development, testing, preproduction, production
  teamId: integer("team_id").references(() => teams.id),
  repositoryUrl: varchar("repository_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Releases table
export const releases = pgTable("releases", {
  id: serial("id").primaryKey(),
  releaseId: varchar("release_id", { length: 20 }).notNull().unique(), // Format: YYYYMM-NN (auto-generated)
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status").notNull().default("testing"), // testing, preproduction, production
  recetteDate: date("recette_date"), // Date de mise en recette
  preprodDate: date("preprod_date"), // Date de mise en préprod
  productionDate: date("production_date"), // Date de mise en production
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Release-Project junction table
export const releaseProjects = pgTable("release_projects", {
  id: serial("id").primaryKey(),
  releaseId: integer("release_id").references(() => releases.id).notNull(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

// Project versions table for detailed version management
export const projectVersions = pgTable("project_versions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  version: varchar("version", { length: 50 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("en_developpement"), 
  // Statuts: en_cours_arb, en_developpement, a_deployer_recette, recette_en_cours, 
  // a_deployer_preprod, preprod_en_cours, a_deployer_production, merge_git_a_faire, 
  // annule, hotfix_a_prevoir, termine
  releaseId: integer("release_id").references(() => releases.id, { onDelete: "set null" }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Git repositories for project versions
export const gitRepos = pgTable("git_repos", {
  id: serial("id").primaryKey(),
  projectVersionId: integer("project_version_id").notNull().references(() => projectVersions.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  url: varchar("url", { length: 500 }),
  branch: varchar("branch", { length: 100 }).notNull().default("main"),
  lastCommitHash: varchar("last_commit_hash", { length: 40 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Commits for git repositories
export const commits = pgTable("commits", {
  id: serial("id").primaryKey(),
  gitRepoId: integer("git_repo_id").notNull().references(() => gitRepos.id, { onDelete: "cascade" }),
  hash: varchar("hash", { length: 40 }).notNull(),
  message: text("message").notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  authorEmail: varchar("author_email", { length: 255 }),
  committedAt: timestamp("committed_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// CAB tickets for project versions
export const cab = pgTable("cab", {
  id: serial("id").primaryKey(),
  projectVersionId: integer("project_version_id").notNull().references(() => projectVersions.id, { onDelete: "cascade" }),
  ticketNumber: varchar("ticket_number", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("open"), // open, in_progress, approved, rejected, closed
  priority: varchar("priority", { length: 20 }).notNull().default("medium"), // low, medium, high, critical
  assigneeId: varchar("assignee_id").references(() => users.id),
  dueDate: date("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Procedures organized by type and git repository
export const procedures = pgTable("procedures", {
  id: serial("id").primaryKey(),
  gitRepoId: integer("git_repo_id").notNull().references(() => gitRepos.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // environment_variables, service_verification, command_execution, data_import
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  content: jsonb("content").notNull(), // Structured content based on type
  order: integer("order").notNull().default(0),
  isCompleted: boolean("is_completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Process Verbals (PVs) - 4 types per project version
export const projectPvs = pgTable("project_pvs", {
  id: serial("id").primaryKey(),
  projectVersionId: integer("project_version_id").notNull().references(() => projectVersions.id, { onDelete: 'cascade' }),
  type: varchar("type", { length: 100 }).notNull(), // pv_fonctionnel_recette, pv_metier_recette, pv_conformite_preprod, pv_tests_homologation_preprod
  status: varchar("status", { length: 50 }).default("draft"), // draft, completed, approved
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Files for PVs
export const pvFiles = pgTable("pv_files", {
  id: serial("id").primaryKey(),
  pvId: integer("pv_id").notNull().references(() => projectPvs.id, { onDelete: 'cascade' }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// ARB (Access/Responsibilities/Budgets) table
export const arb = pgTable("arb", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type").notNull(), // access, responsibility, budget
  status: varchar("status").notNull().default("pending"), // pending, approved, rejected, in_review
  requesterId: varchar("requester_id").references(() => users.id).notNull(),
  approverId: varchar("approver_id").references(() => users.id),
  teamId: integer("team_id").references(() => teams.id),
  projectId: integer("project_id").references(() => projects.id),
  budget: integer("budget"), // Amount in cents if type is budget
  priority: varchar("priority").notNull().default("medium"), // low, medium, high, critical
  dueDate: date("due_date"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  teamMemberships: many(teamMembers),
  leaderOfTeams: many(teams),
  requestedArbs: many(arb, { relationName: "requester" }),
  approvedArbs: many(arb, { relationName: "approver" }),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  leader: one(users, {
    fields: [teams.leaderId],
    references: [users.id],
  }),
  members: many(teamMembers),
  projects: many(projects),
  arbs: many(arb),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  team: one(teams, {
    fields: [projects.teamId],
    references: [teams.id],
  }),
  releaseProjects: many(releaseProjects),
  arbs: many(arb),
  versions: many(projectVersions),
}));

export const projectVersionsRelations = relations(projectVersions, ({ one, many }) => ({
  project: one(projects, {
    fields: [projectVersions.projectId],
    references: [projects.id],
  }),
  release: one(releases, {
    fields: [projectVersions.releaseId],
    references: [releases.id],
  }),
  gitRepos: many(gitRepos),
  cabs: many(cab),
  pvs: many(projectPvs),
}));

export const gitReposRelations = relations(gitRepos, ({ one, many }) => ({
  projectVersion: one(projectVersions, {
    fields: [gitRepos.projectVersionId],
    references: [projectVersions.id],
  }),
  commits: many(commits),
  procedures: many(procedures),
}));

export const commitsRelations = relations(commits, ({ one }) => ({
  gitRepo: one(gitRepos, {
    fields: [commits.gitRepoId],
    references: [gitRepos.id],
  }),
}));

export const cabRelations = relations(cab, ({ one }) => ({
  projectVersion: one(projectVersions, {
    fields: [cab.projectVersionId],
    references: [projectVersions.id],
  }),
  assignee: one(users, {
    fields: [cab.assigneeId],
    references: [users.id],
  }),
}));

export const proceduresRelations = relations(procedures, ({ one }) => ({
  gitRepo: one(gitRepos, {
    fields: [procedures.gitRepoId],
    references: [gitRepos.id],
  }),
}));

export const projectPvsRelations = relations(projectPvs, ({ one, many }) => ({
  projectVersion: one(projectVersions, {
    fields: [projectPvs.projectVersionId],
    references: [projectVersions.id],
  }),
  files: many(pvFiles),
}));

export const pvFilesRelations = relations(pvFiles, ({ one }) => ({
  pv: one(projectPvs, {
    fields: [pvFiles.pvId],
    references: [projectPvs.id],
  }),
}));

export const releasesRelations = relations(releases, ({ many }) => ({
  releaseProjects: many(releaseProjects),
  projectVersions: many(projectVersions),
}));

export const releaseProjectsRelations = relations(releaseProjects, ({ one }) => ({
  release: one(releases, {
    fields: [releaseProjects.releaseId],
    references: [releases.id],
  }),
  project: one(projects, {
    fields: [releaseProjects.projectId],
    references: [projects.id],
  }),
}));

export const arbRelations = relations(arb, ({ one }) => ({
  requester: one(users, {
    fields: [arb.requesterId],
    references: [users.id],
    relationName: "requester",
  }),
  approver: one(users, {
    fields: [arb.approverId],
    references: [users.id],
    relationName: "approver",
  }),
  team: one(teams, {
    fields: [arb.teamId],
    references: [teams.id],
  }),
  project: one(projects, {
    fields: [arb.projectId],
    references: [projects.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReleaseSchema = createInsertSchema(releases).omit({
  id: true,
  releaseId: true, // Auto-generated on server
  createdAt: true,
  updatedAt: true,
});

export const insertReleaseProjectSchema = createInsertSchema(releaseProjects).omit({
  id: true,
  addedAt: true,
});

export const insertProjectVersionSchema = createInsertSchema(projectVersions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGitRepoSchema = createInsertSchema(gitRepos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommitSchema = createInsertSchema(commits).omit({
  id: true,
  createdAt: true,
});

export const insertCabSchema = createInsertSchema(cab).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProcedureSchema = createInsertSchema(procedures).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectPvSchema = createInsertSchema(projectPvs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPvFileSchema = createInsertSchema(pvFiles).omit({
  id: true,
  uploadedAt: true,
});

export const insertArbSchema = createInsertSchema(arb).omit({
  id: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProjectVersion = z.infer<typeof insertProjectVersionSchema>;
export type ProjectVersion = typeof projectVersions.$inferSelect;
export type InsertGitRepo = z.infer<typeof insertGitRepoSchema>;
export type GitRepo = typeof gitRepos.$inferSelect;
export type InsertCommit = z.infer<typeof insertCommitSchema>;
export type Commit = typeof commits.$inferSelect;
export type InsertCab = z.infer<typeof insertCabSchema>;
export type Cab = typeof cab.$inferSelect;
export type InsertProcedure = z.infer<typeof insertProcedureSchema>;
export type Procedure = typeof procedures.$inferSelect;
export type InsertRelease = z.infer<typeof insertReleaseSchema>;
export type Release = typeof releases.$inferSelect;
export type InsertReleaseProject = z.infer<typeof insertReleaseProjectSchema>;
export type ReleaseProject = typeof releaseProjects.$inferSelect;
export type InsertProjectPv = z.infer<typeof insertProjectPvSchema>;
export type ProjectPv = typeof projectPvs.$inferSelect;
export type InsertPvFile = z.infer<typeof insertPvFileSchema>;
export type PvFile = typeof pvFiles.$inferSelect;
export type InsertArb = z.infer<typeof insertArbSchema>;
export type Arb = typeof arb.$inferSelect;

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
