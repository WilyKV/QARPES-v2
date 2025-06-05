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

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
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
  releaseId: varchar("release_id", { length: 20 }).notNull().unique(), // Format: YYYYMM-NN
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status").notNull().default("development"), // development, testing, preproduction, production
  teamId: integer("team_id").references(() => teams.id),
  releaseDate: date("release_date"),
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

export const projectsRelations = relations(projects, ({ one, many }) => ({
  team: one(teams, {
    fields: [projects.teamId],
    references: [teams.id],
  }),
  releaseProjects: many(releaseProjects),
  arbs: many(arb),
}));

export const releasesRelations = relations(releases, ({ one, many }) => ({
  team: one(teams, {
    fields: [releases.teamId],
    references: [teams.id],
  }),
  releaseProjects: many(releaseProjects),
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
  createdAt: true,
  updatedAt: true,
}).extend({
  releaseId: z.string().regex(/^\d{6}-\d{2}$/, "Format must be YYYYMM-NN"),
});

export const insertReleaseProjectSchema = createInsertSchema(releaseProjects).omit({
  id: true,
  addedAt: true,
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
export type InsertRelease = z.infer<typeof insertReleaseSchema>;
export type Release = typeof releases.$inferSelect;
export type InsertReleaseProject = z.infer<typeof insertReleaseProjectSchema>;
export type ReleaseProject = typeof releaseProjects.$inferSelect;
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
};

export type ReleaseWithTeamAndProjects = Release & {
  team?: Team;
  releaseProjects?: (ReleaseProject & { project: Project })[];
};

export type ArbWithDetails = Arb & {
  requester: User;
  approver?: User;
  team?: Team;
  project?: Project;
};
