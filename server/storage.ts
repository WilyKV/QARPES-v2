import {
  users,
  teams,
  teamMembers,
  projects,
  releases,
  releaseProjects,
  arb,
  projectVersions,
  gitRepos,
  commits,
  cab,
  procedures,
  projectPvs,
  pvFiles,
  type User,
  type UpsertUser,
  type Team,
  type InsertTeam,
  type TeamMember,
  type InsertTeamMember,
  type Project,
  type InsertProject,
  type Release,
  type InsertRelease,
  type ReleaseProject,
  type InsertReleaseProject,
  type Arb,
  type InsertArb,
  type ProjectVersion,
  type InsertProjectVersion,
  type GitRepo,
  type InsertGitRepo,
  type Commit,
  type InsertCommit,
  type Cab,
  type InsertCab,
  type Procedure,
  type InsertProcedure,
  type ProjectPv,
  type InsertProjectPv,
  type PvFile,
  type InsertPvFile,
  type TeamWithMembers,
  type ProjectWithTeam,
  type ProjectVersionWithDetails,
  type GitRepoWithDetails,
  type CabWithDetails,
  type ProceduresByType,
  type ReleaseProceduresAggregated,
  type ReleaseWithProjects,
  type ArbWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  createUser(user: UpsertUser): Promise<User>;
  
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
  getReleases(): Promise<ReleaseWithProjects[]>;
  getRelease(id: number): Promise<ReleaseWithProjects | undefined>;
  createRelease(release: InsertRelease): Promise<Release>;
  updateRelease(id: number, release: Partial<InsertRelease>): Promise<Release>;
  deleteRelease(id: number): Promise<void>;
  
  // Release-Project operations
  addProjectToRelease(releaseProject: InsertReleaseProject): Promise<ReleaseProject>;
  removeProjectFromRelease(releaseId: number, projectId: number): Promise<void>;
  
  // Project Version operations
  getProjectVersions(projectId: number): Promise<ProjectVersionWithDetails[]>;
  getProjectVersion(id: number): Promise<ProjectVersionWithDetails | undefined>;
  createProjectVersion(version: InsertProjectVersion): Promise<ProjectVersion>;
  updateProjectVersion(id: number, version: Partial<InsertProjectVersion>): Promise<ProjectVersion>;
  deleteProjectVersion(id: number): Promise<void>;
  
  // Git Repository operations
  getGitRepos(projectVersionId: number): Promise<GitRepoWithDetails[]>;
  createGitRepo(gitRepo: InsertGitRepo): Promise<GitRepo>;
  updateGitRepo(id: number, gitRepo: Partial<InsertGitRepo>): Promise<GitRepo>;
  deleteGitRepo(id: number): Promise<void>;
  
  // Commit operations
  getCommits(gitRepoId: number): Promise<Commit[]>;
  createCommit(commit: InsertCommit): Promise<Commit>;
  
  // CAB operations
  getCabs(projectVersionId: number): Promise<CabWithDetails[]>;
  createCab(cab: InsertCab): Promise<Cab>;
  updateCab(id: number, cab: Partial<InsertCab>): Promise<Cab>;
  deleteCab(id: number): Promise<void>;
  
  // Procedure operations (4 types organized by Git repository)
  getProcedures(gitRepoId: number): Promise<ProceduresByType>;
  getProceduresByType(gitRepoId: number, type: string): Promise<Procedure[]>;
  createProcedure(procedure: InsertProcedure): Promise<Procedure>;
  updateProcedure(id: number, procedure: Partial<InsertProcedure>): Promise<Procedure>;
  deleteProcedure(id: number): Promise<void>;
  toggleProcedureCompletion(id: number): Promise<Procedure>;
  
  // Release procedures aggregation
  getReleaseProcedures(releaseId: number): Promise<ReleaseProceduresAggregated>;
  
  // ARB operations
  getArbs(): Promise<ArbWithDetails[]>;
  getArb(id: number): Promise<ArbWithDetails | undefined>;
  createArb(arbData: InsertArb): Promise<Arb>;
  updateArb(id: number, arbData: Partial<InsertArb>): Promise<Arb>;
  deleteArb(id: number): Promise<void>;
  
  // PV operations
  getProjectPvs(projectVersionId: number): Promise<(ProjectPv & { files: PvFile[] })[]>;
  getProjectPv(id: number): Promise<(ProjectPv & { files: PvFile[] }) | undefined>;
  createProjectPv(pv: InsertProjectPv): Promise<ProjectPv>;
  updateProjectPv(id: number, pv: Partial<InsertProjectPv>): Promise<ProjectPv>;
  deleteProjectPv(id: number): Promise<void>;
  
  // PV File operations
  addPvFile(file: InsertPvFile): Promise<PvFile>;
  removePvFile(id: number): Promise<void>;
  getPvFiles(pvId: number): Promise<PvFile[]>;
  
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

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
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
  async getReleases(): Promise<ReleaseWithProjects[]> {
    const releasesData = await db
      .select()
      .from(releases)
      .orderBy(desc(releases.createdAt));

    const releasesWithProjects = await Promise.all(
      releasesData.map(async (release) => {
        const releaseProjectsData = await db
          .select({
            releaseProject: releaseProjects,
            project: projects,
          })
          .from(releaseProjects)
          .innerJoin(projects, eq(releaseProjects.projectId, projects.id))
          .where(eq(releaseProjects.releaseId, release.id));

        return {
          ...release,
          releaseProjects: releaseProjectsData.map((rp) => ({
            ...rp.releaseProject,
            project: rp.project,
          })),
        };
      })
    );

    return releasesWithProjects;
  }

  async getRelease(id: number): Promise<ReleaseWithProjects | undefined> {
    const [release] = await db
      .select()
      .from(releases)
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
      ...release,
      releaseProjects: releaseProjectsData.map((rp) => ({
        ...rp.releaseProject,
        project: rp.project,
      })),
    };
  }

  async createRelease(release: InsertRelease): Promise<Release> {
    // Generate automatic release ID in YYYYMM-NN format
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    // Find the latest release for this month
    const latestRelease = await db
      .select()
      .from(releases)
      .where(sql`release_id LIKE ${yearMonth + '-%'}`)
      .orderBy(desc(releases.releaseId))
      .limit(1);
    
    let nextNumber = 1;
    if (latestRelease.length > 0) {
      const lastReleaseId = latestRelease[0].releaseId;
      const lastNumber = parseInt(lastReleaseId.split('-')[1]);
      nextNumber = lastNumber + 1;
    }
    
    const releaseId = `${yearMonth}-${nextNumber.toString().padStart(2, '0')}`;
    
    const [newRelease] = await db.insert(releases).values({
      ...release,
      releaseId
    }).returning();
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

  // Project Version operations
  async getProjectVersions(projectId: number): Promise<ProjectVersionWithDetails[]> {
    const versions = await db
      .select()
      .from(projectVersions)
      .where(eq(projectVersions.projectId, projectId))
      .orderBy(desc(projectVersions.createdAt));

    const versionsWithDetails = await Promise.all(
      versions.map(async (version) => {
        const gitReposData = await this.getGitRepos(version.id);
        const cabsData = await this.getCabs(version.id);
        
        return {
          ...version,
          gitRepos: gitReposData,
          cabs: cabsData,
        };
      })
    );

    return versionsWithDetails;
  }

  async getProjectVersion(id: number): Promise<ProjectVersionWithDetails | undefined> {
    const [version] = await db
      .select()
      .from(projectVersions)
      .where(eq(projectVersions.id, id));

    if (!version) return undefined;

    const gitReposData = await this.getGitRepos(version.id);
    const cabsData = await this.getCabs(version.id);

    return {
      ...version,
      gitRepos: gitReposData,
      cabs: cabsData,
    };
  }

  async createProjectVersion(version: InsertProjectVersion): Promise<ProjectVersion> {
    const [newVersion] = await db.insert(projectVersions).values(version).returning();
    return newVersion;
  }

  async updateProjectVersion(id: number, version: Partial<InsertProjectVersion>): Promise<ProjectVersion> {
    const [updatedVersion] = await db
      .update(projectVersions)
      .set({ ...version, updatedAt: new Date() })
      .where(eq(projectVersions.id, id))
      .returning();
    return updatedVersion;
  }

  async deleteProjectVersion(id: number): Promise<void> {
    await db.delete(projectVersions).where(eq(projectVersions.id, id));
  }

  // Git Repository operations
  async getGitRepos(projectVersionId: number): Promise<GitRepoWithDetails[]> {
    const repos = await db
      .select()
      .from(gitRepos)
      .where(eq(gitRepos.projectVersionId, projectVersionId));

    const reposWithDetails = await Promise.all(
      repos.map(async (repo) => {
        const commitsData = await this.getCommits(repo.id);
        const proceduresData = await this.getProcedures(repo.id);
        
        return {
          ...repo,
          commits: commitsData,
          proceduresByType: proceduresData,
        };
      })
    );

    return reposWithDetails;
  }

  async createGitRepo(gitRepo: InsertGitRepo): Promise<GitRepo> {
    const [newRepo] = await db.insert(gitRepos).values(gitRepo).returning();
    return newRepo;
  }

  async updateGitRepo(id: number, gitRepo: Partial<InsertGitRepo>): Promise<GitRepo> {
    const [updatedRepo] = await db
      .update(gitRepos)
      .set({ ...gitRepo, updatedAt: new Date() })
      .where(eq(gitRepos.id, id))
      .returning();
    return updatedRepo;
  }

  async deleteGitRepo(id: number): Promise<void> {
    await db.delete(gitRepos).where(eq(gitRepos.id, id));
  }

  // Commit operations
  async getCommits(gitRepoId: number): Promise<Commit[]> {
    return await db
      .select()
      .from(commits)
      .where(eq(commits.gitRepoId, gitRepoId))
      .orderBy(desc(commits.committedAt));
  }

  async createCommit(commit: InsertCommit): Promise<Commit> {
    const [newCommit] = await db.insert(commits).values(commit).returning();
    return newCommit;
  }

  // CAB operations
  async getCabs(projectVersionId: number): Promise<CabWithDetails[]> {
    const cabResults = await db
      .select({
        cab: cab,
        assignee: users,
      })
      .from(cab)
      .leftJoin(users, eq(cab.assigneeId, users.id))
      .where(eq(cab.projectVersionId, projectVersionId))
      .orderBy(desc(cab.createdAt));

    return cabResults.map((result) => ({
      ...result.cab,
      assignee: result.assignee || undefined,
    }));
  }

  async createCab(cabData: InsertCab): Promise<Cab> {
    const [newCab] = await db.insert(cab).values(cabData).returning();
    return newCab;
  }

  async updateCab(id: number, cabData: Partial<InsertCab>): Promise<Cab> {
    const [updatedCab] = await db
      .update(cab)
      .set({ ...cabData, updatedAt: new Date() })
      .where(eq(cab.id, id))
      .returning();
    return updatedCab;
  }

  async deleteCab(id: number): Promise<void> {
    await db.delete(cab).where(eq(cab.id, id));
  }

  // Procedure operations (4 types organized by Git repository)
  async getProcedures(gitRepoId: number): Promise<ProceduresByType> {
    const allProcedures = await db
      .select()
      .from(procedures)
      .where(eq(procedures.gitRepoId, gitRepoId))
      .orderBy(procedures.order);

    return {
      environment_variables: allProcedures.filter(p => p.type === 'environment_variables'),
      service_verification: allProcedures.filter(p => p.type === 'service_verification'),
      command_execution: allProcedures.filter(p => p.type === 'command_execution'),
      data_import: allProcedures.filter(p => p.type === 'data_import'),
    };
  }

  async getProceduresByType(gitRepoId: number, type: string): Promise<Procedure[]> {
    return await db
      .select()
      .from(procedures)
      .where(and(eq(procedures.gitRepoId, gitRepoId), eq(procedures.type, type)))
      .orderBy(procedures.order);
  }

  async createProcedure(procedure: InsertProcedure): Promise<Procedure> {
    const [newProcedure] = await db.insert(procedures).values(procedure).returning();
    return newProcedure;
  }

  async updateProcedure(id: number, procedure: Partial<InsertProcedure>): Promise<Procedure> {
    const [updatedProcedure] = await db
      .update(procedures)
      .set({ ...procedure, updatedAt: new Date() })
      .where(eq(procedures.id, id))
      .returning();
    return updatedProcedure;
  }

  async deleteProcedure(id: number): Promise<void> {
    await db.delete(procedures).where(eq(procedures.id, id));
  }

  async toggleProcedureCompletion(id: number): Promise<Procedure> {
    const [procedure] = await db
      .select()
      .from(procedures)
      .where(eq(procedures.id, id));

    const [updatedProcedure] = await db
      .update(procedures)
      .set({ 
        isCompleted: !procedure.isCompleted,
        updatedAt: new Date()
      })
      .where(eq(procedures.id, id))
      .returning();

    return updatedProcedure;
  }

  // Release procedures aggregation
  async getReleaseProcedures(releaseId: number): Promise<ReleaseProceduresAggregated> {
    const releaseProjectsData = await db
      .select({
        project: projects,
        releaseProject: releaseProjects,
      })
      .from(releaseProjects)
      .innerJoin(projects, eq(releaseProjects.projectId, projects.id))
      .where(eq(releaseProjects.releaseId, releaseId));

    const projectsWithVersions = await Promise.all(
      releaseProjectsData.map(async (item) => {
        const versions = await this.getProjectVersions(item.project.id);
        
        const versionsWithRepos = await Promise.all(
          versions.map(async (version) => ({
            versionId: version.id,
            version: version.version,
            gitRepos: (version.gitRepos || []).map(repo => ({
              repoId: repo.id,
              repoName: repo.name,
              procedures: repo.proceduresByType || {
                environment_variables: [],
                service_verification: [],
                command_execution: [],
                data_import: [],
              },
            })),
          }))
        );

        return {
          projectId: item.project.id,
          projectName: item.project.name,
          versions: versionsWithRepos,
        };
      })
    );

    return {
      releaseId,
      projects: projectsWithVersions,
    };
  }

  // Dashboard stats
  // PV operations
  async getProjectPvs(projectVersionId: number): Promise<(ProjectPv & { files: PvFile[] })[]> {
    const pvs = await db
      .select()
      .from(projectPvs)
      .where(eq(projectPvs.projectVersionId, projectVersionId))
      .orderBy(projectPvs.type);

    const pvsWithFiles = await Promise.all(
      pvs.map(async (pv) => {
        const files = await db
          .select()
          .from(pvFiles)
          .where(eq(pvFiles.pvId, pv.id))
          .orderBy(pvFiles.uploadedAt);
        
        return { ...pv, files };
      })
    );

    return pvsWithFiles;
  }

  async getProjectPv(id: number): Promise<(ProjectPv & { files: PvFile[] }) | undefined> {
    const [pv] = await db
      .select()
      .from(projectPvs)
      .where(eq(projectPvs.id, id));

    if (!pv) return undefined;

    const files = await db
      .select()
      .from(pvFiles)
      .where(eq(pvFiles.pvId, id))
      .orderBy(pvFiles.uploadedAt);

    return { ...pv, files };
  }

  async createProjectPv(pvData: InsertProjectPv): Promise<ProjectPv> {
    const [pv] = await db
      .insert(projectPvs)
      .values(pvData)
      .returning();
    
    return pv;
  }

  async updateProjectPv(id: number, pvData: Partial<InsertProjectPv>): Promise<ProjectPv> {
    const [pv] = await db
      .update(projectPvs)
      .set({ ...pvData, updatedAt: new Date() })
      .where(eq(projectPvs.id, id))
      .returning();

    return pv;
  }

  async deleteProjectPv(id: number): Promise<void> {
    await db.delete(projectPvs).where(eq(projectPvs.id, id));
  }

  // PV File operations
  async addPvFile(fileData: InsertPvFile): Promise<PvFile> {
    const [file] = await db
      .insert(pvFiles)
      .values(fileData)
      .returning();
    
    return file;
  }

  async removePvFile(id: number): Promise<void> {
    await db.delete(pvFiles).where(eq(pvFiles.id, id));
  }

  async getPvFiles(pvId: number): Promise<PvFile[]> {
    return await db
      .select()
      .from(pvFiles)
      .where(eq(pvFiles.pvId, pvId))
      .orderBy(pvFiles.uploadedAt);
  }

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
