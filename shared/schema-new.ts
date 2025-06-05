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
  fonction: varchar("fonction"), // fonction dans l'organisation
  roles: text("roles"), // JSON array des rôles
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teams table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team members junction table (ManyToMany entre Member et Equipe)
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role").notNull().default("member"), // leader, member
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Project Names table (entité séparée pour le nom du projet)
export const projectNames = pgTable("project_names", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Projects table (ManyToOne avec Equipe et ProjectName)
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  projectNameId: integer("project_name_id").notNull().references(() => projectNames.id),
  teamId: integer("team_id").references(() => teams.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project Versions table (OneToMany avec Project)
export const projectVersions = pgTable("project_versions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  version: varchar("version", { length: 50 }).notNull(),
  status: varchar("status").notNull().default("development"), // development, testing, production, archived
  description: text("description"),
  releaseDate: date("release_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Git Repositories table
export const gitRepos = pgTable("git_repos", {
  id: serial("id").primaryKey(),
  projectName: varchar("project_name", { length: 255 }).notNull(),
  repoName: varchar("repo_name", { length: 255 }).notNull(),
  releaseNumber: varchar("release_number", { length: 50 }),
  url: varchar("url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Junction table pour ProjectVersion et GitRepo (ManyToMany)
export const projectVersionGitRepos = pgTable("project_version_git_repos", {
  id: serial("id").primaryKey(),
  projectVersionId: integer("project_version_id").notNull().references(() => projectVersions.id, { onDelete: "cascade" }),
  gitRepoId: integer("git_repo_id").notNull().references(() => gitRepos.id, { onDelete: "cascade" }),
});

// Commits table (ManyToOne avec ProjectVersion)
export const commits = pgTable("commits", {
  id: serial("id").primaryKey(),
  projectVersionId: integer("project_version_id").notNull().references(() => projectVersions.id, { onDelete: "cascade" }),
  hash: varchar("hash", { length: 40 }).notNull(),
  message: text("message").notNull(),
  author: varchar("author").notNull(),
  commitDate: timestamp("commit_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Releases table
export const releases = pgTable("releases", {
  id: serial("id").primaryKey(),
  releaseId: varchar("release_id", { length: 20 }).notNull().unique(), // Format: YYYYMM-NN
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status").notNull().default("development"), // development, testing, preproduction, production
  teamId: integer("team_id").references(() => teams.id),
  releaseDate: date("release_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// CAB (Change Advisory Board) table
export const cab = pgTable("cab", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  url: varchar("url"),
  releaseId: integer("release_id").references(() => releases.id),
  projectVersionId: integer("project_version_id").references(() => projectVersions.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Process Sections table (types de processus)
export const processSections = pgTable("process_sections", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Processes table (lié à GitRepo, ProcessSection et ProjectVersion)
export const processes = pgTable("processes", {
  id: serial("id").primaryKey(),
  gitRepoId: integer("git_repo_id").notNull().references(() => gitRepos.id),
  processSectionId: integer("process_section_id").notNull().references(() => processSections.id),
  projectVersionId: integer("project_version_id").notNull().references(() => projectVersions.id),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Git App Processes table (processus applicatifs)
export const gitAppProcesses = pgTable("git_app_processes", {
  id: serial("id").primaryKey(),
  repoId: varchar("repo_id").notNull(),
  processSectionId: integer("process_section_id").notNull().references(() => processSections.id),
  explanatoryText: text("explanatory_text"),
  createdAt: timestamp("created_at").defaultNow(),
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
  budget: integer("budget"), // montant en centimes
  priority: varchar("priority").notNull().default("medium"), // low, medium, high, urgent
  dueDate: date("due_date"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === RELATIONS ===

export const usersRelations = relations(users, ({ many }) => ({
  teamMemberships: many(teamMembers),
  requestedArbs: many(arb, { relationName: "requester" }),
  approvedArbs: many(arb, { relationName: "approver" }),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(teamMembers),
  projects: many(projects),
  releases: many(releases),
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

export const projectNamesRelations = relations(projectNames, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  projectName: one(projectNames, {
    fields: [projects.projectNameId],
    references: [projectNames.id],
  }),
  team: one(teams, {
    fields: [projects.teamId],
    references: [teams.id],
  }),
  versions: many(projectVersions),
  arbs: many(arb),
}));

export const projectVersionsRelations = relations(projectVersions, ({ one, many }) => ({
  project: one(projects, {
    fields: [projectVersions.projectId],
    references: [projects.id],
  }),
  commits: many(commits),
  cabs: many(cab),
  gitRepos: many(projectVersionGitRepos),
  processes: many(processes),
}));

export const gitReposRelations = relations(gitRepos, ({ many }) => ({
  projectVersions: many(projectVersionGitRepos),
  processes: many(processes),
}));

export const projectVersionGitReposRelations = relations(projectVersionGitRepos, ({ one }) => ({
  projectVersion: one(projectVersions, {
    fields: [projectVersionGitRepos.projectVersionId],
    references: [projectVersions.id],
  }),
  gitRepo: one(gitRepos, {
    fields: [projectVersionGitRepos.gitRepoId],
    references: [gitRepos.id],
  }),
}));

export const commitsRelations = relations(commits, ({ one }) => ({
  projectVersion: one(projectVersions, {
    fields: [commits.projectVersionId],
    references: [projectVersions.id],
  }),
}));

export const releasesRelations = relations(releases, ({ one, many }) => ({
  team: one(teams, {
    fields: [releases.teamId],
    references: [teams.id],
  }),
  cabs: many(cab),
}));

export const cabRelations = relations(cab, ({ one }) => ({
  release: one(releases, {
    fields: [cab.releaseId],
    references: [releases.id],
  }),
  projectVersion: one(projectVersions, {
    fields: [cab.projectVersionId],
    references: [projectVersions.id],
  }),
}));

export const processSectionsRelations = relations(processSections, ({ many }) => ({
  processes: many(processes),
  gitAppProcesses: many(gitAppProcesses),
}));

export const processesRelations = relations(processes, ({ one }) => ({
  gitRepo: one(gitRepos, {
    fields: [processes.gitRepoId],
    references: [gitRepos.id],
  }),
  processSection: one(processSections, {
    fields: [processes.processSectionId],
    references: [processSections.id],
  }),
  projectVersion: one(projectVersions, {
    fields: [processes.projectVersionId],
    references: [projectVersions.id],
  }),
}));

export const gitAppProcessesRelations = relations(gitAppProcesses, ({ one }) => ({
  processSection: one(processSections, {
    fields: [gitAppProcesses.processSectionId],
    references: [processSections.id],
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

// === SCHEMAS ===

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

export const insertProjectNameSchema = createInsertSchema(projectNames).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectVersionSchema = createInsertSchema(projectVersions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGitRepoSchema = createInsertSchema(gitRepos).omit({
  id: true,
  createdAt: true,
});

export const insertCommitSchema = createInsertSchema(commits).omit({
  id: true,
  createdAt: true,
});

export const insertReleaseSchema = createInsertSchema(releases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCabSchema = createInsertSchema(cab).omit({
  id: true,
  createdAt: true,
});

export const insertProcessSectionSchema = createInsertSchema(processSections).omit({
  id: true,
  createdAt: true,
});

export const insertProcessSchema = createInsertSchema(processes).omit({
  id: true,
  createdAt: true,
});

export const insertArbSchema = createInsertSchema(arb).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
});

// === TYPES ===

export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;

export type InsertProjectName = z.infer<typeof insertProjectNameSchema>;
export type ProjectName = typeof projectNames.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertProjectVersion = z.infer<typeof insertProjectVersionSchema>;
export type ProjectVersion = typeof projectVersions.$inferSelect;

export type InsertGitRepo = z.infer<typeof insertGitRepoSchema>;
export type GitRepo = typeof gitRepos.$inferSelect;

export type InsertCommit = z.infer<typeof insertCommitSchema>;
export type Commit = typeof commits.$inferSelect;

export type InsertRelease = z.infer<typeof insertReleaseSchema>;
export type Release = typeof releases.$inferSelect;

export type InsertCab = z.infer<typeof insertCabSchema>;
export type Cab = typeof cab.$inferSelect;

export type InsertProcessSection = z.infer<typeof insertProcessSectionSchema>;
export type ProcessSection = typeof processSections.$inferSelect;

export type InsertProcess = z.infer<typeof insertProcessSchema>;
export type Process = typeof processes.$inferSelect;

export type InsertArb = z.infer<typeof insertArbSchema>;
export type Arb = typeof arb.$inferSelect;

// === COMPLEX TYPES ===

export type TeamWithMembers = Team & {
  members?: (TeamMember & { user: User })[];
  _count?: { members: number; projects: number };
};

export type ProjectWithDetails = Project & {
  projectName: ProjectName;
  team?: Team;
  versions?: ProjectVersion[];
  _count?: { versions: number };
};

export type ProjectVersionWithDetails = ProjectVersion & {
  project: Project & { projectName: ProjectName };
  commits?: Commit[];
  cabs?: Cab[];
  gitRepos?: (typeof projectVersionGitRepos.$inferSelect & { gitRepo: GitRepo })[];
  processes?: (Process & { processSection: ProcessSection; gitRepo: GitRepo })[];
};

export type ReleaseWithDetails = Release & {
  team?: Team;
  cabs?: Cab[];
};

export type ArbWithDetails = Arb & {
  requester: User;
  approver?: User;
  team?: Team;
  project?: Project & { projectName: ProjectName };
};