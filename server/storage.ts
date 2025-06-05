import {
  users,
  teams,
  teamMembers,
  projectNames,
  projects,
  projectVersions,
  releases,
  arb,
  commits,
  cab,
  gitRepos,
  processSections,
  processes,
  type User,
  type UpsertUser,
  type Team,
  type InsertTeam,
  type TeamMember,
  type InsertTeamMember,
  type ProjectName,
  type InsertProjectName,
  type Project,
  type InsertProject,
  type ProjectVersion,
  type InsertProjectVersion,
  type Release,
  type InsertRelease,
  type Arb,
  type InsertArb,
  type TeamWithMembers,
  type ProjectWithDetails,
  type ProjectVersionWithDetails,
  type ReleaseWithDetails,
  type ArbWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Team operations
  getTeams(): Promise<TeamWithMembers[]>;
  getTeam(id: number): Promise<TeamWithMembers | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team>;
  deleteTeam(id: number): Promise<void>;
  
  // Team member operations
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  removeTeamMember(teamId: number, userId: string): Promise<void>;
  getTeamMembers(teamId: number): Promise<(TeamMember & { user: User })[]>;
  
  // Project operations
  getProjects(): Promise<ProjectWithTeam[]>;
  getProject(id: number): Promise<ProjectWithTeam | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number): Promise<void>;
  
  // Release operations
  getReleases(): Promise<ReleaseWithTeamAndProjects[]>;
  getRelease(id: number): Promise<ReleaseWithTeamAndProjects | undefined>;
  createRelease(release: InsertRelease): Promise<Release>;
  updateRelease(id: number, release: Partial<InsertRelease>): Promise<Release>;
  deleteRelease(id: number): Promise<void>;
  
  // Release-Project operations
  addProjectToRelease(releaseProject: InsertReleaseProject): Promise<ReleaseProject>;
  removeProjectFromRelease(releaseId: number, projectId: number): Promise<void>;
  
  // ARB operations
  getArbs(): Promise<ArbWithDetails[]>;
  getArb(id: number): Promise<ArbWithDetails | undefined>;
  createArb(arbData: InsertArb): Promise<Arb>;
  updateArb(id: number, arbData: Partial<InsertArb>): Promise<Arb>;
  deleteArb(id: number): Promise<void>;
  
  // Dashboard stats
  getDashboardStats(): Promise<{
    activeReleases: number;
    totalProjects: number;
    totalTeams: number;
    activeArb: number;
    projectsByStatus: { status: string; count: number }[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Team operations
  async getTeams(): Promise<TeamWithMembers[]> {
    const teamsWithDetails = await db
      .select({
        team: teams,
        leader: users,
        memberCount: count(teamMembers.id),
      })
      .from(teams)
      .leftJoin(users, eq(teams.leaderId, users.id))
      .leftJoin(teamMembers, eq(teams.id, teamMembers.teamId))
      .groupBy(teams.id, users.id)
      .orderBy(desc(teams.createdAt));

    return teamsWithDetails.map((row) => ({
      ...row.team,
      leader: row.leader || undefined,
      _count: { members: row.memberCount, projects: 0 },
    }));
  }

  async getTeam(id: number): Promise<TeamWithMembers | undefined> {
    const [team] = await db
      .select()
      .from(teams)
      .leftJoin(users, eq(teams.leaderId, users.id))
      .where(eq(teams.id, id));

    if (!team) return undefined;

    const members = await db
      .select({
        teamMember: teamMembers,
        user: users,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, id));

    return {
      ...team.teams,
      leader: team.users || undefined,
      members: members.map((m) => ({ ...m.teamMember, user: m.user })),
    };
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }

  async updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team> {
    const [updatedTeam] = await db
      .update(teams)
      .set({ ...team, updatedAt: new Date() })
      .where(eq(teams.id, id))
      .returning();
    return updatedTeam;
  }

  async deleteTeam(id: number): Promise<void> {
    await db.delete(teams).where(eq(teams.id, id));
  }

  // Team member operations
  async addTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const [newMember] = await db.insert(teamMembers).values(member).returning();
    return newMember;
  }

  async removeTeamMember(teamId: number, userId: string): Promise<void> {
    await db
      .delete(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
  }

  async getTeamMembers(teamId: number): Promise<(TeamMember & { user: User })[]> {
    const members = await db
      .select({
        teamMember: teamMembers,
        user: users,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId));

    return members.map((m) => ({ ...m.teamMember, user: m.user }));
  }

  // Project operations
  async getProjects(): Promise<ProjectWithTeam[]> {
    const projectsWithTeam = await db
      .select({
        project: projects,
        team: teams,
      })
      .from(projects)
      .leftJoin(teams, eq(projects.teamId, teams.id))
      .orderBy(desc(projects.createdAt));

    return projectsWithTeam.map((row) => ({
      ...row.project,
      team: row.team || undefined,
    }));
  }

  async getProject(id: number): Promise<ProjectWithTeam | undefined> {
    const [project] = await db
      .select({
        project: projects,
        team: teams,
      })
      .from(projects)
      .leftJoin(teams, eq(projects.teamId, teams.id))
      .where(eq(projects.id, id));

    if (!project) return undefined;

    return {
      ...project.project,
      team: project.team || undefined,
    };
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Release operations
  async getReleases(): Promise<ReleaseWithTeamAndProjects[]> {
    const releasesWithDetails = await db
      .select({
        release: releases,
        team: teams,
      })
      .from(releases)
      .leftJoin(teams, eq(releases.teamId, teams.id))
      .orderBy(desc(releases.createdAt));

    const releasesWithProjects = await Promise.all(
      releasesWithDetails.map(async (row) => {
        const releaseProjectsData = await db
          .select({
            releaseProject: releaseProjects,
            project: projects,
          })
          .from(releaseProjects)
          .innerJoin(projects, eq(releaseProjects.projectId, projects.id))
          .where(eq(releaseProjects.releaseId, row.release.id));

        return {
          ...row.release,
          team: row.team || undefined,
          releaseProjects: releaseProjectsData.map((rp) => ({
            ...rp.releaseProject,
            project: rp.project,
          })),
        };
      })
    );

    return releasesWithProjects;
  }

  async getRelease(id: number): Promise<ReleaseWithTeamAndProjects | undefined> {
    const [release] = await db
      .select({
        release: releases,
        team: teams,
      })
      .from(releases)
      .leftJoin(teams, eq(releases.teamId, teams.id))
      .where(eq(releases.id, id));

    if (!release) return undefined;

    const releaseProjectsData = await db
      .select({
        releaseProject: releaseProjects,
        project: projects,
      })
      .from(releaseProjects)
      .innerJoin(projects, eq(releaseProjects.projectId, projects.id))
      .where(eq(releaseProjects.releaseId, id));

    return {
      ...release.release,
      team: release.team || undefined,
      releaseProjects: releaseProjectsData.map((rp) => ({
        ...rp.releaseProject,
        project: rp.project,
      })),
    };
  }

  async createRelease(release: InsertRelease): Promise<Release> {
    const [newRelease] = await db.insert(releases).values(release).returning();
    return newRelease;
  }

  async updateRelease(id: number, release: Partial<InsertRelease>): Promise<Release> {
    const [updatedRelease] = await db
      .update(releases)
      .set({ ...release, updatedAt: new Date() })
      .where(eq(releases.id, id))
      .returning();
    return updatedRelease;
  }

  async deleteRelease(id: number): Promise<void> {
    await db.delete(releases).where(eq(releases.id, id));
  }

  // Release-Project operations
  async addProjectToRelease(releaseProject: InsertReleaseProject): Promise<ReleaseProject> {
    const [newReleaseProject] = await db
      .insert(releaseProjects)
      .values(releaseProject)
      .returning();
    return newReleaseProject;
  }

  async removeProjectFromRelease(releaseId: number, projectId: number): Promise<void> {
    await db
      .delete(releaseProjects)
      .where(
        and(
          eq(releaseProjects.releaseId, releaseId),
          eq(releaseProjects.projectId, projectId)
        )
      );
  }

  // ARB operations
  async getArbs(): Promise<ArbWithDetails[]> {
    const arbsWithDetails = await db
      .select({
        arb: arb,
        requester: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
        },
        approver: sql`approver_user.*`,
        team: teams,
        project: projects,
      })
      .from(arb)
      .innerJoin(users, eq(arb.requesterId, users.id))
      .leftJoin(sql`users as approver_user`, sql`arb.approver_id = approver_user.id`)
      .leftJoin(teams, eq(arb.teamId, teams.id))
      .leftJoin(projects, eq(arb.projectId, projects.id))
      .orderBy(desc(arb.createdAt));

    return arbsWithDetails.map((row) => ({
      ...row.arb,
      requester: row.requester as User,
      approver: row.approver as User | undefined,
      team: row.team || undefined,
      project: row.project || undefined,
    }));
  }

  async getArb(id: number): Promise<ArbWithDetails | undefined> {
    const [arbWithDetails] = await db
      .select({
        arb: arb,
        requester: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
        },
        approver: sql`approver_user.*`,
        team: teams,
        project: projects,
      })
      .from(arb)
      .innerJoin(users, eq(arb.requesterId, users.id))
      .leftJoin(sql`users as approver_user`, sql`arb.approver_id = approver_user.id`)
      .leftJoin(teams, eq(arb.teamId, teams.id))
      .leftJoin(projects, eq(arb.projectId, projects.id))
      .where(eq(arb.id, id));

    if (!arbWithDetails) return undefined;

    return {
      ...arbWithDetails.arb,
      requester: arbWithDetails.requester as User,
      approver: arbWithDetails.approver as User | undefined,
      team: arbWithDetails.team || undefined,
      project: arbWithDetails.project || undefined,
    };
  }

  async createArb(arbData: InsertArb): Promise<Arb> {
    const [newArb] = await db.insert(arb).values(arbData).returning();
    return newArb;
  }

  async updateArb(id: number, arbData: Partial<InsertArb>): Promise<Arb> {
    const updateData = { ...arbData, updatedAt: new Date() };
    if (arbData.status === "approved") {
      updateData.approvedAt = new Date();
    }
    
    const [updatedArb] = await db
      .update(arb)
      .set(updateData)
      .where(eq(arb.id, id))
      .returning();
    return updatedArb;
  }

  async deleteArb(id: number): Promise<void> {
    await db.delete(arb).where(eq(arb.id, id));
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    activeReleases: number;
    totalProjects: number;
    totalTeams: number;
    activeArb: number;
    projectsByStatus: { status: string; count: number }[];
  }> {
    const [activeReleasesResult] = await db
      .select({ count: count() })
      .from(releases)
      .where(sql`status != 'production'`);

    const [totalProjectsResult] = await db
      .select({ count: count() })
      .from(projects);

    const [totalTeamsResult] = await db
      .select({ count: count() })
      .from(teams);

    const [activeArbResult] = await db
      .select({ count: count() })
      .from(arb)
      .where(sql`status IN ('pending', 'in_review')`);

    const projectsByStatus = await db
      .select({
        status: projects.status,
        count: count(),
      })
      .from(projects)
      .groupBy(projects.status);

    return {
      activeReleases: activeReleasesResult.count,
      totalProjects: totalProjectsResult.count,
      totalTeams: totalTeamsResult.count,
      activeArb: activeArbResult.count,
      projectsByStatus: projectsByStatus.map((p) => ({
        status: p.status,
        count: p.count,
      })),
    };
  }
}

export const storage = new DatabaseStorage();
