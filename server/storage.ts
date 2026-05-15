import {
  type User,
  type UpsertUser,
  type Member,
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
  type ProjectVersionGitRepo,
  type InsertProjectVersionGitRepo,
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
  type ProjectVersionGitRepoWithDetails,
  type GitRepoWithDetails,
  type CabWithDetails,
  type ProceduresByType,
  type ReleaseProceduresAggregated,
  type ReleaseWithProjects,
  type ArbWithDetails,
} from "@shared/schema";
import { prisma } from "./db";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | null>;
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
  getReleasesByYearMonth(yearMonth: string): Promise<ReleaseWithProjects[]>;
  getRelease(id: number): Promise<ReleaseWithProjects | undefined>;
  createRelease(release: InsertRelease): Promise<Release>;
  updateRelease(id: number, release: Partial<InsertRelease>): Promise<Release>;
  deleteRelease(id: number): Promise<void>;
  
  // Release-Project operations
  addProjectToRelease(releaseProject: InsertReleaseProject): Promise<ReleaseProject>;
  removeProjectFromRelease(releaseId: number, projectId: number): Promise<void>;
  getReleaseProjectVersions(releaseId: number): Promise<ProjectVersionWithDetails[]>;
  
  // Project Version operations
  getProjectVersions(projectId: number): Promise<ProjectVersionWithDetails[]>;
  getProjectVersion(id: number): Promise<ProjectVersionWithDetails | undefined>;
  createProjectVersion(version: InsertProjectVersion): Promise<ProjectVersion>;
  updateProjectVersion(id: number, version: Partial<InsertProjectVersion>): Promise<ProjectVersion>;
  updateProjectVersionNote(id: number, note: string | null): Promise<ProjectVersion>;
  deleteProjectVersion(id: number): Promise<void>;
  
  // Git Repository operations
  getGitRepos(projectVersionId: number): Promise<GitRepoWithDetails[]>;
  getAllGitRepos(): Promise<GitRepoWithDetails[]>;
  createGitRepo(gitRepo: InsertGitRepo): Promise<GitRepo>;
  updateGitRepo(id: number, gitRepo: Partial<InsertGitRepo>): Promise<GitRepo>;
  deleteGitRepo(id: number): Promise<void>;
  
  // ProjectVersionGitRepo operations (association many-to-many)
  associateGitRepoToVersion(gitRepoId: number, projectVersionId: number): Promise<any>;
  removeGitRepoFromVersion(projectVersionId: number, gitRepoId: number): Promise<void>;
  createGitRepoWithAssociation(gitRepo: InsertGitRepo, projectVersionId: number): Promise<any>;
  getVersionGitRepoByGitRepoId(gitRepoId: number): Promise<any>;
  getVersionGitRepos(projectVersionId: number): Promise<ProjectVersionGitRepoWithDetails[]>;
  getVersionGitRepo(versionGitRepoId: number): Promise<ProjectVersionGitRepoWithDetails | undefined>;
  
  // Commit operations
  getCommits(gitRepoId: number): Promise<Commit[]>;
  // Nouvelles méthodes pour récupérer par association spécifique
  getCommitsByVersionGitRepo(versionGitRepoId: number): Promise<Commit[]>;
  createCommit(commit: InsertCommit): Promise<Commit>;
  updateCommit(id: number, commit: Partial<InsertCommit>): Promise<Commit>;
  deleteCommit(id: number): Promise<void>;
  
  // CAB operations
  getCabs(projectVersionId: number): Promise<CabWithDetails[]>;
  createCab(cab: InsertCab): Promise<Cab>;
  updateCab(id: number, cab: Partial<InsertCab>): Promise<Cab>;
  deleteCab(id: number): Promise<void>;
  
  // Procedure operations (4 types organized by Git repository)
  getProcedures(gitRepoId: number): Promise<ProceduresByType>;
  // Nouvelles méthodes pour récupérer par association spécifique
  getProceduresByVersionGitRepo(versionGitRepoId: number): Promise<ProceduresByType>;
  getProceduresByType(gitRepoId: number, type: string): Promise<Procedure[]>;
  createProcedure(procedure: InsertProcedure): Promise<Procedure>;
  updateProcedure(id: number, procedure: Partial<InsertProcedure>): Promise<Procedure>;
  deleteProcedure(id: number): Promise<void>;
  toggleProcedureCompletion(id: number): Promise<Procedure>;
  
  // Release procedures aggregation
  // TODO: Réimplémenter en Prisma si besoin
  
  // ARB operations
  getArbs(): Promise<ArbWithDetails[]>;
  getArb(id: number): Promise<ArbWithDetails | undefined>;
  createArb(arbData: InsertArb): Promise<Arb>;
  updateArb(id: number, arbData: Partial<InsertArb>): Promise<Arb>;
  deleteArb(id: number): Promise<void>;
  
  // PV operations
  getProjectPvs(projectVersionId: number): Promise<(ProjectPv & { files: PvFile[] })[]>;
  getProjectPv(id: number): Promise<(ProjectPv & { files: PvFile[] }) | undefined>;
  createProjectPv(pvData: InsertProjectPv): Promise<ProjectPv>;
  updateProjectPv(id: number, pvData: Partial<InsertProjectPv>): Promise<ProjectPv>;
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
    const user = await prisma.user.findUnique({ where: { id } });
    return user ?? undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    return prisma.user.upsert({
      where: { id: userData.id },
      update: { ...userData, updatedAt: new Date() },
      create: userData,
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async getUsers(): Promise<User[]> {
    return prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  }

  async createUser(userData: UpsertUser): Promise<User> {
    return prisma.user.create({ data: userData });
  }

  // Team operations
  async getTeams(): Promise<TeamWithMembers[]> {
    const teams = await prisma.team.findMany({
      include: {
        leader: true,
        members: { include: { member: { include: { user: true } } } },
        _count: { select: { members: true, projects: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return teams;
  }

  async getTeam(id: number): Promise<TeamWithMembers | undefined> {
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        leader: true,
        members: { include: { member: { include: { user: true } } } },
      },
    });
    return team ?? undefined;
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    return prisma.team.create({ data: team });
  }

  async updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team> {
    return prisma.team.update({ where: { id }, data: { ...team, updatedAt: new Date() } });
  }

  async deleteTeam(id: number): Promise<void> {
    await prisma.team.delete({ where: { id } });
  }

  // Team member operations
  async addTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    return prisma.teamMember.create({ data: member });
  }

  async removeTeamMember(teamId: number, userId: string): Promise<void> {
    // Trouver le member correspondant au userId
    const member = await prisma.member.findUnique({
      where: { userId }
    });
    
    if (!member) {
      throw new Error(`Member with userId ${userId} not found`);
    }
    
    await prisma.teamMember.deleteMany({ 
      where: { 
        teamId: teamId,
        memberId: member.id
      } 
    });
  }

  async getTeamMembers(teamId: number): Promise<(TeamMember & { user: User })[]> {
    const members = await prisma.teamMember.findMany({
      where: { teamId },
      include: { member: { include: { user: true } } },
    });
    return members as any; // Cast nécessaire car la structure a changé
  }

  // Member operations
  async getMemberByUserId(userId: string): Promise<Member | null> {
    return prisma.member.findUnique({
      where: { userId }
    });
  }

  async createMember(data: { firstName: string; lastName: string; email: string; userId: string }): Promise<Member> {
    return prisma.member.create({ data });
  }

  // Project operations
  async getProjects(): Promise<ProjectWithTeam[]> {
    const projects = await prisma.project.findMany({
      include: { team: true },
      orderBy: { createdAt: "desc" },
    });
    return projects;
  }

  async getProject(id: number): Promise<ProjectWithTeam | undefined> {
    const project = await prisma.project.findUnique({
      where: { id },
      include: { team: true },
    });
    return project ?? undefined;
  }

  async createProject(project: InsertProject): Promise<Project> {
    return prisma.project.create({ data: project });
  }

  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project> {
    return prisma.project.update({ where: { id }, data: { ...project, updatedAt: new Date() } });
  }

  async deleteProject(id: number): Promise<void> {
    await prisma.project.delete({ where: { id } });
  }

  // Release operations
  async getReleases(): Promise<ReleaseWithProjects[]> {
    return prisma.release.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        projectVersions: { include: { project: true } },
      },
    });
  }

  async getReleasesByYearMonth(yearMonth: string): Promise<ReleaseWithProjects[]> {
    return prisma.release.findMany({
      where: {
        releaseId: {
          startsWith: yearMonth
        }
      },
      orderBy: { releaseId: 'desc' },
      include: {
        // projectVersions: { include: { project: true } },
      },
    }) as any;
  }

  async getRelease(id: number): Promise<ReleaseWithProjects | undefined> {
    const result = await prisma.release.findUnique({
      where: { id },
      include: {
        projectVersions: { include: { project: true } },
      },
    });
    return result ?? undefined;
  }

  async createRelease(release: InsertRelease): Promise<Release> {
    // Parser les dates si elles sont au format YYYY-MM-DD
    const parseDate = (d: any) => {
      if (!d) return undefined;
      if (d instanceof Date) return d;
      if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
        return new Date(d + 'T00:00:00.000Z');
      }
      return new Date(d);
    };

    // Si un releaseId est fourni, verifier qu'il n'existe pas deja
    if (release.releaseId) {
      const existing = await prisma.release.findUnique({
        where: { releaseId: release.releaseId },
      });
      if (existing) {
        throw new Error(`Release with releaseId "${release.releaseId}" already exists`);
      }
      return prisma.release.create({
        data: {
          ...release,
          releaseId: release.releaseId,
          recetteDate: parseDate(release.recetteDate),
          preprodDate: parseDate(release.preprodDate),
          productionDate: parseDate(release.productionDate),
        },
      });
    }

    // Generation de releaseId automatique (YYYYMM-NN) avec retry en cas de conflit concurrent
    const productionDate = release.productionDate ? new Date(release.productionDate) : new Date();
    const yearMonth = `${productionDate.getFullYear()}${(productionDate.getMonth() + 1).toString().padStart(2, '0')}`;

    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await prisma.release.findMany({
        where: { releaseId: { startsWith: yearMonth + '-' } },
        select: { releaseId: true },
      });

      let nextNumber = 1;
      if (existing.length > 0) {
        const numbers = existing
          .map((r) => parseInt(r.releaseId!.split('-')[1], 10))
          .filter((n) => !isNaN(n));
        if (numbers.length > 0) {
          nextNumber = Math.max(...numbers) + 1;
        }
      }
      const releaseId = `${yearMonth}-${nextNumber.toString().padStart(2, '0')}`;

      try {
        return await prisma.release.create({
          data: {
            ...release,
            recetteDate: parseDate(release.recetteDate),
            preprodDate: parseDate(release.preprodDate),
            productionDate: parseDate(release.productionDate),
            releaseId,
          },
        });
      } catch (err: any) {
        // P2002 = unique constraint violation -> retry avec le prochain numero
        if (err?.code === 'P2002' && attempt < 4) {
          continue;
        }
        throw err;
      }
    }

    throw new Error(`Failed to generate a unique releaseId for yearMonth "${yearMonth}" after 5 attempts`);
  }

  async updateRelease(id: number, release: Partial<InsertRelease>): Promise<Release> {
    // Correction : parser les dates si elles sont au format YYYY-MM-DD
    const parseDate = (d: any) => {
      if (!d) return undefined;
      if (d instanceof Date) return d;
      if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
        return new Date(d + 'T00:00:00.000Z');
      }
      return new Date(d);
    };
    return prisma.release.update({
      where: { id },
      data: {
        ...release,
        recetteDate: parseDate(release.recetteDate),
        preprodDate: parseDate(release.preprodDate),
        productionDate: parseDate(release.productionDate),
        updatedAt: new Date(),
      },
    });
  }

  async deleteRelease(id: number): Promise<void> {
    await prisma.release.delete({ where: { id } });
  }

  // Release-Project operations
  async addProjectToRelease(releaseProject: InsertReleaseProject): Promise<ReleaseProject> {
    return prisma.releaseProject.create({ data: releaseProject });
  }

  async removeProjectFromRelease(releaseId: number, projectId: number): Promise<void> {
    await prisma.releaseProject.delete({ where: { releaseId_projectId: { releaseId, projectId } } });
  }

  // ARB operations
  async getArbs(): Promise<ArbWithDetails[]> {
    return prisma.arb.findMany({
      include: {
        requester: true,
        approver: true,
        team: true,
        project: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getArb(id: number): Promise<ArbWithDetails | undefined> {
    const result = await prisma.arb.findUnique({
      where: { id },
      include: {
        requester: true,
        approver: true,
        team: true,
        project: true,
      },
    });
    return result ?? undefined;
  }

  async createArb(arbData: InsertArb): Promise<Arb> {
    return prisma.arb.create({ data: arbData });
  }

  async updateArb(id: number, arbData: Partial<InsertArb>): Promise<Arb> {
    return prisma.arb.update({ where: { id }, data: { ...arbData, updatedAt: new Date() } });
  }

  async deleteArb(id: number): Promise<void> {
    await prisma.arb.delete({ where: { id } });
  }

  // Project Version operations
  async getProjectVersions(projectId: number): Promise<ProjectVersionWithDetails[]> {
    const versions = await prisma.projectVersion.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        versionGitRepos: {
          include: {
            gitRepo: true,
            procedures: true,
            commits: true,
          },
        },
  cabs: true,
  pvs: { include: { files: true } },
      },
    });
    // Adapter le format si besoin (ex: mapping pour ProjectVersionWithDetails)
    return versions;
  }

  async getProjectVersion(id: number): Promise<ProjectVersionWithDetails | undefined> {
    const result = await prisma.projectVersion.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            team: true,
          },
        },
        release: true,
        versionGitRepos: {
          include: {
            gitRepo: true,
            procedures: true,
            commits: true,
          },
        },
        cabs: true,
        pvs: {
          include: {
            files: true,
          },
        },
      },
    });
    return result ?? undefined;
  }

  async createProjectVersion(version: InsertProjectVersion): Promise<ProjectVersion> {
    const newVersion = await prisma.projectVersion.create({ data: version });
    await this.updateProjectStatusFromVersions(newVersion.projectId);
    return newVersion;
  }

  async updateProjectVersion(id: number, version: Partial<InsertProjectVersion>): Promise<ProjectVersion> {
    const updatedVersion = await prisma.projectVersion.update({ where: { id }, data: { ...version, updatedAt: new Date() } });
    await this.updateProjectStatusFromVersions(updatedVersion.projectId);
    return updatedVersion;
  }

  async updateProjectVersionNote(id: number, note: string | null): Promise<ProjectVersion> {
    const updatedVersion = await prisma.projectVersion.update({ where: { id }, data: { note, updatedAt: new Date() } });
    return updatedVersion;
  }

  private async updateProjectStatusFromVersions(projectId: number): Promise<void> {
    const versions = await prisma.projectVersion.findMany({ where: { projectId } });
    if (!versions.length) return;
    const statusHierarchy: Record<string, number> = {
      'en_developpement': 1,
      'en_cours_arb': 2,
      'a_deployer_recette': 3,
      'recette_en_cours': 4,
      'a_deployer_preprod': 5,
      'preprod_en_cours': 6,
      'a_deployer_production': 7,
      'merge_git_a_faire': 8,
      'termine': 9,
      'annule': 0,
      'hotfix_a_prevoir': 5,
    };
    const highestVersionStatus = versions.reduce((highest: string, version: { status: string }) => {
      const currentLevel = statusHierarchy[version.status] || 0;
      const highestLevel = statusHierarchy[highest] || 0;
      return currentLevel > highestLevel ? version.status : highest;
    }, 'en_developpement');
    const versionToProjectStatus: Record<string, string> = {
      'en_developpement': 'development',
      'en_cours_arb': 'development',
      'a_deployer_recette': 'testing',
      'recette_en_cours': 'testing',
      'a_deployer_preprod': 'preproduction',
      'preprod_en_cours': 'preproduction',
      'a_deployer_production': 'production',
      'merge_git_a_faire': 'production',
      'termine': 'production',
      'annule': 'development',
      'hotfix_a_prevoir': 'preproduction',
    };
    const newProjectStatus = versionToProjectStatus[highestVersionStatus] || 'development';
    const currentProject = await prisma.project.findUnique({ where: { id: projectId } });
    if (!currentProject) return;
    const projectStatusHierarchy: Record<string, number> = {
      'development': 1,
      'testing': 2,
      'preproduction': 3,
      'production': 4,
    };
    const currentLevel = projectStatusHierarchy[currentProject.status] || 0;
    const newLevel = projectStatusHierarchy[newProjectStatus] || 0;
    if (newLevel > currentLevel) {
      await prisma.project.update({ where: { id: projectId }, data: { status: newProjectStatus, updatedAt: new Date() } });
    }
  }

  async deleteProjectVersion(id: number): Promise<void> {
    await prisma.projectVersion.delete({ where: { id } });
  }

  // Git Repository operations
  async getGitRepos(projectVersionId: number): Promise<GitRepoWithDetails[]> {
    const versionGitRepos = await prisma.projectVersionGitRepo.findMany({
      where: { projectVersionId },
      include: {
        gitRepo: true,
        commits: true,
        procedures: true,
      },
    });
    
    // Transformer pour retourner la structure attendue
  return versionGitRepos.map((vgr: any) => ({
      ...vgr.gitRepo,
      commits: vgr.commits,
      procedures: vgr.procedures,
    }));
  }

  async createGitRepo(gitRepo: InsertGitRepo): Promise<GitRepo> {
    return prisma.gitRepo.create({ data: gitRepo });
  }

  async updateGitRepo(id: number, gitRepo: Partial<InsertGitRepo>): Promise<GitRepo> {
    return prisma.gitRepo.update({ where: { id }, data: { ...gitRepo, updatedAt: new Date() } });
  }

  async deleteGitRepo(id: number): Promise<void> {
    await prisma.gitRepo.delete({ where: { id } });
  }

  // Commit operations
  async getCommits(gitRepoId: number): Promise<Commit[]> {
    // Récupérer tous les commits de ce repo via les associations ProjectVersionGitRepo
    const commits = await prisma.commit.findMany({
      where: {
        versionGitRepo: {
          gitRepoId: gitRepoId
        }
      },
      include: {
        versionGitRepo: {
          include: {
            projectVersion: {
              include: {
                project: true
              }
            }
          }
        }
      },
      orderBy: { committedAt: 'desc' },
    });
    
    return commits;
  }

  async getCommitsByVersionGitRepo(versionGitRepoId: number): Promise<Commit[]> {
    // Récupérer uniquement les commits de cette association spécifique
    return prisma.commit.findMany({
      where: {
        versionGitRepoId: versionGitRepoId
      },
      orderBy: { committedAt: 'desc' },
    });
  }

  async createCommit(commit: InsertCommit): Promise<Commit> {
    return prisma.commit.create({ data: commit });
  }

  async updateCommit(id: number, commit: Partial<InsertCommit>): Promise<Commit> {
    return prisma.commit.update({ where: { id }, data: { ...commit, updatedAt: new Date() } });
  }

  async deleteCommit(id: number): Promise<void> {
    await prisma.commit.delete({ where: { id } });
  }

  // CAB operations
  async getCabs(projectVersionId: number): Promise<CabWithDetails[]> {
    return prisma.cab.findMany({
      where: { projectVersionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCab(cabData: InsertCab): Promise<Cab> {
    return prisma.cab.create({ data: cabData });
  }

  async updateCab(id: number, cabData: Partial<InsertCab>): Promise<Cab> {
    return prisma.cab.update({ where: { id }, data: { ...cabData, updatedAt: new Date() } });
  }

  async deleteCab(id: number): Promise<void> {
    await prisma.cab.delete({ where: { id } });
  }

  // Procedure operations (4 types organized by Git repository)
  async getProcedures(gitRepoId: number): Promise<ProceduresByType> {
    // Trouver toutes les associations versionGitRepo pour ce gitRepoId
    const versionGitRepos = await prisma.projectVersionGitRepo.findMany({
      where: { gitRepoId },
      include: {
        procedures: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // Collecter toutes les procédures de toutes les associations
  const allProcedures = versionGitRepos.flatMap((vgr: any) => vgr.procedures);

    return {
      environment_variables: allProcedures.filter((p: any) => p.type === 'environment_variables'),
      service_verification: allProcedures.filter((p: any) => p.type === 'service_verification'),
      command_execution: allProcedures.filter((p: any) => p.type === 'command_execution'),
      data_import: allProcedures.filter((p: any) => p.type === 'data_import'),
    };
  }

  async getProceduresByVersionGitRepo(versionGitRepoId: number): Promise<ProceduresByType> {
    // Récupérer uniquement les procédures de cette association spécifique
    const association = await prisma.projectVersionGitRepo.findUnique({
      where: { id: versionGitRepoId },
      include: {
        procedures: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!association) {
      return {
        environment_variables: [],
        service_verification: [],
        command_execution: [],
        data_import: [],
      };
    }

    return {
      environment_variables: association.procedures.filter((p: any) => p.type === 'environment_variables'),
      service_verification: association.procedures.filter((p: any) => p.type === 'service_verification'),
      command_execution: association.procedures.filter((p: any) => p.type === 'command_execution'),
      data_import: association.procedures.filter((p: any) => p.type === 'data_import'),
    };
  }

  async getProceduresByType(gitRepoId: number, type: string): Promise<Procedure[]> {
    // gitRepoId is accessed via versionGitRepo relation
    return prisma.procedure.findMany({
      where: {
        versionGitRepo: { gitRepoId },
        type,
      },
      orderBy: { order: 'asc' },
    });
  }

  async createProcedure(procedure: InsertProcedure): Promise<Procedure> {
    return prisma.procedure.create({ data: procedure });
  }

  async updateProcedure(id: number, procedure: Partial<InsertProcedure>): Promise<Procedure> {
    return prisma.procedure.update({ where: { id }, data: { ...procedure, updatedAt: new Date() } });
  }

  async deleteProcedure(id: number): Promise<void> {
    await prisma.procedure.delete({ where: { id } });
  }

  async toggleProcedureCompletion(id: number): Promise<Procedure> {
    const proc = await prisma.procedure.findUnique({ where: { id } });
    if (!proc) throw new Error('Procedure not found');
    return prisma.procedure.update({
      where: { id },
      data: { isCompleted: !proc.isCompleted, updatedAt: new Date() },
    });
  }

  // Release procedures aggregation (exemple simple)
  async getReleaseProcedures(releaseId: number): Promise<Procedure[]> {
    // On récupère toutes les versions de projet de cette release, puis leurs procédures
    const projectVersions = await prisma.projectVersion.findMany({
      where: { releaseId },
      include: {
        versionGitRepos: {
          include: { procedures: true },
        },
      },
    });

    const procedures: Procedure[] = [];
    for (const version of projectVersions) {
      for (const repo of version.versionGitRepos) {
        procedures.push(...repo.procedures);
      }
    }
    return procedures;
  }

  // Get project versions associated to a release
  async getReleaseProjectVersions(releaseId: number): Promise<ProjectVersionWithDetails[]> {
    const projectVersions = await prisma.projectVersion.findMany({
      where: { releaseId },
      include: {
        project: { include: { team: true } },
        versionGitRepos: {
          include: {
            gitRepo: true,
            commits: { orderBy: { committedAt: 'desc' }, take: 10 },
            procedures: { orderBy: { order: 'asc' } },
          },
        },
        cabs: true,
        pvs: { include: { files: true } },
      },
    });
    return projectVersions as any;
  }
  
  // Dashboard stats
  async getDashboardStats(): Promise<{
    activeReleases: number;
    totalProjects: number;
    totalTeams: number;
    activeArb: number;
    projectsByStatus: { status: string; count: number }[];
  }> {
    const [activeReleases, totalProjects, totalTeams, activeArb, projectsByStatus] = await Promise.all([
      prisma.release.count({ where: { status: { not: 'production' } } }),
      prisma.project.count(),
      prisma.team.count(),
      prisma.arb.count({ where: { status: { in: ['pending', 'in_review'] } } }),
      prisma.project.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);
    return {
      activeReleases,
      totalProjects,
      totalTeams,
      activeArb,
      projectsByStatus: projectsByStatus.map((p: { status: string; _count: { status: number } }) => ({ status: p.status, count: p._count.status })),
    };
  }

  // Git Repository operations - méthodes manquantes
  async getAllGitRepos(): Promise<GitRepoWithDetails[]> {
    return prisma.gitRepo.findMany({
      include: {
        versionGitRepos: {
          include: {
            commits: { orderBy: { committedAt: 'desc' }, take: 10 },
            procedures: { orderBy: { order: 'asc' } },
            projectVersion: {
              include: {
                project: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    }) as any;
  }

  // PV operations
  async getProjectPvs(projectVersionId: number): Promise<(ProjectPv & { files: PvFile[] })[]> {
    return prisma.projectPv.findMany({
      where: { projectVersionId },
      include: { files: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProjectPv(id: number): Promise<(ProjectPv & { files: PvFile[] }) | undefined> {
    const result = await prisma.projectPv.findUnique({
      where: { id },
      include: { files: true },
    });
    return result ?? undefined;
  }

  async createProjectPv(pvData: InsertProjectPv): Promise<ProjectPv> {
    return prisma.projectPv.create({ data: pvData });
  }

  async updateProjectPv(id: number, pvData: Partial<InsertProjectPv>): Promise<ProjectPv> {
    return prisma.projectPv.update({ where: { id }, data: { ...pvData, updatedAt: new Date() } });
  }

  async deleteProjectPv(id: number): Promise<void> {
    await prisma.projectPv.delete({ where: { id } });
  }

  // PV File operations
  async addPvFile(file: InsertPvFile): Promise<PvFile> {
    return prisma.pvFile.create({ data: file });
  }

  async removePvFile(id: number): Promise<void> {
    await prisma.pvFile.delete({ where: { id } });
  }

  async getPvFiles(pvId: number): Promise<PvFile[]> {
    return prisma.pvFile.findMany({
      where: { pvId },
      orderBy: { uploadedAt: 'asc' },
    });
  }

  // Nouvelles méthodes pour gérer les associations ProjectVersionGitRepo
  async createGitRepoWithAssociation(gitRepo: InsertGitRepo, projectVersionId: number): Promise<any> {
    // Créer le GitRepo d'abord
    const newGitRepo = await prisma.gitRepo.create({ data: gitRepo });
    
    // Puis créer l'association
    const association = await prisma.projectVersionGitRepo.create({
      data: {
        projectVersionId,
        gitRepoId: newGitRepo.id,
      },
      include: {
        gitRepo: true,
        projectVersion: true,
      },
    });
    
    return association;
  }

  async associateGitRepoToVersion(gitRepoId: number, projectVersionId: number): Promise<any> {
    return prisma.projectVersionGitRepo.create({
      data: {
        projectVersionId,
        gitRepoId,
      },
      include: {
        gitRepo: true,
        projectVersion: true,
      },
    });
  }

  async removeGitRepoFromVersion(projectVersionId: number, gitRepoId: number): Promise<void> {
    await prisma.projectVersionGitRepo.deleteMany({
      where: {
        projectVersionId,
        gitRepoId,
      },
    });
  }

  async getVersionGitRepoByGitRepoId(gitRepoId: number): Promise<any> {
    return prisma.projectVersionGitRepo.findFirst({
      where: {
        gitRepoId,
      },
      include: {
        gitRepo: true,
        projectVersion: true,
      },
    });
  }

  async getVersionGitRepos(projectVersionId: number): Promise<ProjectVersionGitRepoWithDetails[]> {
    const versionGitRepos = await prisma.projectVersionGitRepo.findMany({
      where: { projectVersionId },
      include: {
        gitRepo: true,
        projectVersion: true,
        procedures: true,
        commits: {
          orderBy: { committedAt: 'desc' },
        },
      },
    });
    
    return versionGitRepos as any;
  }

  async getVersionGitRepo(versionGitRepoId: number): Promise<ProjectVersionGitRepoWithDetails | undefined> {
    const versionGitRepo = await prisma.projectVersionGitRepo.findUnique({
      where: { id: versionGitRepoId },
      include: {
        gitRepo: true,
        projectVersion: true,
        procedures: true,
        commits: {
          orderBy: { committedAt: 'desc' },
        },
      },
    });
    
    return versionGitRepo as any || undefined;
  }
}

export const storage = new DatabaseStorage();
