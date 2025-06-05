import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./replitAuth";
import { createFixtures } from "./fixtures";
import {
  insertTeamSchema,
  insertProjectSchema,
  insertReleaseSchema,
  insertArbSchema,
  insertTeamMemberSchema,
  insertReleaseProjectSchema,
  insertProjectVersionSchema,
  insertGitRepoSchema,
  insertCommitSchema,
  insertCabSchema,
  insertProcedureSchema,
  gitRepos,
} from "@shared/schema";
import { db } from "./db";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes - Demo mode for testing
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      const session = req.session as any;
      const sessionUser = session?.user;
      
      if (!sessionUser || !sessionUser.id) {
        // Return demo user for development access to authentic data
        const demoUser = {
          id: "kevin.nicol",
          email: "kevin.nicol@omneseducation.com", 
          firstName: "Kevin",
          lastName: "NICOL",
          profileImageUrl: "https://replit.com/public/images/mark.png"
        };
        return res.json(demoUser);
      }

      const user = await storage.getUser(sessionUser.id);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Fixtures route for demo data
  app.post('/api/fixtures/create', async (req, res) => {
    try {
      await createFixtures();
      res.json({ message: "Fixtures created successfully" });
    } catch (error) {
      console.error("Error creating fixtures:", error);
      res.status(500).json({ message: "Failed to create fixtures" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Team routes
  app.get('/api/teams', async (req, res) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.get('/api/teams/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const team = await storage.getTeam(id);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      res.json(team);
    } catch (error) {
      console.error("Error fetching team:", error);
      res.status(500).json({ message: "Failed to fetch team" });
    }
  });

  app.post('/api/teams', async (req, res) => {
    try {
      const teamData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(teamData);
      res.status(201).json(team);
    } catch (error) {
      console.error("Error creating team:", error);
      res.status(400).json({ message: "Failed to create team" });
    }
  });

  app.put('/api/teams/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const teamData = insertTeamSchema.partial().parse(req.body);
      const team = await storage.updateTeam(id, teamData);
      res.json(team);
    } catch (error) {
      console.error("Error updating team:", error);
      res.status(400).json({ message: "Failed to update team" });
    }
  });

  app.delete('/api/teams/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTeam(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting team:", error);
      res.status(500).json({ message: "Failed to delete team" });
    }
  });

  // Team member routes
  app.get('/api/teams/:id/members', async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.post('/api/teams/:id/members', async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const memberData = insertTeamMemberSchema.parse({ ...req.body, teamId });
      const member = await storage.addTeamMember(memberData);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error adding team member:", error);
      res.status(400).json({ message: "Failed to add team member" });
    }
  });

  app.delete('/api/teams/:teamId/members/:userId', async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const userId = req.params.userId;
      await storage.removeTeamMember(teamId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing team member:", error);
      res.status(500).json({ message: "Failed to remove team member" });
    }
  });

  // Project routes
  app.get('/api/projects', async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post('/api/projects', async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(400).json({ message: "Failed to create project" });
    }
  });

  app.put('/api/projects/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const projectData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, projectData);
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(400).json({ message: "Failed to update project" });
    }
  });

  app.delete('/api/projects/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProject(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Release routes
  app.get('/api/releases', async (req, res) => {
    try {
      const releases = await storage.getReleases();
      res.json(releases);
    } catch (error) {
      console.error("Error fetching releases:", error);
      res.status(500).json({ message: "Failed to fetch releases" });
    }
  });

  app.get('/api/releases/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const release = await storage.getRelease(id);
      if (!release) {
        return res.status(404).json({ message: "Release not found" });
      }
      res.json(release);
    } catch (error) {
      console.error("Error fetching release:", error);
      res.status(500).json({ message: "Failed to fetch release" });
    }
  });

  app.post('/api/releases', async (req, res) => {
    try {
      const releaseData = insertReleaseSchema.parse(req.body);
      const release = await storage.createRelease(releaseData);
      res.status(201).json(release);
    } catch (error) {
      console.error("Error creating release:", error);
      res.status(400).json({ message: "Failed to create release" });
    }
  });

  app.put('/api/releases/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const releaseData = insertReleaseSchema.partial().parse(req.body);
      const release = await storage.updateRelease(id, releaseData);
      res.json(release);
    } catch (error) {
      console.error("Error updating release:", error);
      res.status(400).json({ message: "Failed to update release" });
    }
  });

  app.delete('/api/releases/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRelease(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting release:", error);
      res.status(500).json({ message: "Failed to delete release" });
    }
  });

  app.get('/api/releases/:id/procedures', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const procedures = await storage.getReleaseProcedures(id);
      res.json(procedures);
    } catch (error) {
      console.error("Error fetching release procedures:", error);
      res.status(500).json({ message: "Failed to fetch release procedures" });
    }
  });

  // Release-Project routes
  app.post('/api/releases/:releaseId/projects', async (req, res) => {
    try {
      const releaseId = parseInt(req.params.releaseId);
      const releaseProjectData = insertReleaseProjectSchema.parse({ ...req.body, releaseId });
      const releaseProject = await storage.addProjectToRelease(releaseProjectData);
      res.status(201).json(releaseProject);
    } catch (error) {
      console.error("Error adding project to release:", error);
      res.status(400).json({ message: "Failed to add project to release" });
    }
  });

  app.delete('/api/releases/:releaseId/projects/:projectId', async (req, res) => {
    try {
      const releaseId = parseInt(req.params.releaseId);
      const projectId = parseInt(req.params.projectId);
      await storage.removeProjectFromRelease(releaseId, projectId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing project from release:", error);
      res.status(500).json({ message: "Failed to remove project from release" });
    }
  });

  // Project version to release association
  app.post('/api/projects/:projectId/versions/:versionId/release', async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const versionId = parseInt(req.params.versionId);
      const { releaseId, createRelease } = req.body;
      
      let targetReleaseId = releaseId;
      
      // If createRelease is provided, create a new release first
      if (createRelease) {
        const releaseData = insertReleaseSchema.parse(createRelease);
        const newRelease = await storage.createRelease(releaseData);
        targetReleaseId = newRelease.id;
      }
      
      // Associate version to release directly
      await storage.updateProjectVersion(versionId, { releaseId: targetReleaseId });
      
      // Also associate project to release if not already associated
      try {
        await storage.addProjectToRelease({ releaseId: targetReleaseId, projectId });
      } catch (error) {
        // Ignore duplicate key errors - project already associated to release
        console.log("Project already associated to release, skipping...");
      }
      
      res.status(201).json({ 
        message: "Project version associated to release successfully",
        releaseId: targetReleaseId 
      });
    } catch (error) {
      console.error("Error associating project version to release:", error);
      res.status(400).json({ message: "Failed to associate project version to release" });
    }
  });

  // Project version routes
  app.get('/api/projects/:id/versions', async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const versions = await storage.getProjectVersions(projectId);
      res.json(versions);
    } catch (error) {
      console.error("Error fetching project versions:", error);
      res.status(500).json({ message: "Failed to fetch project versions" });
    }
  });

  app.get('/api/projects/:projectId/versions/:versionId', async (req, res) => {
    try {
      const versionId = parseInt(req.params.versionId);
      const version = await storage.getProjectVersion(versionId);
      if (!version) {
        return res.status(404).json({ message: "Version not found" });
      }
      res.json(version);
    } catch (error) {
      console.error("Error fetching project version:", error);
      res.status(500).json({ message: "Failed to fetch project version" });
    }
  });

  app.post('/api/projects/:id/versions', async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const versionData = { ...req.body, projectId };
      const version = await storage.createProjectVersion(versionData);
      res.json(version);
    } catch (error) {
      console.error("Error creating project version:", error);
      res.status(500).json({ message: "Failed to create project version" });
    }
  });

  // Users routes
  app.get('/api/users', async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', async (req, res) => {
    try {
      const userData = req.body;
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // ARB routes
  app.get('/api/arb', async (req, res) => {
    try {
      const arbs = await storage.getArbs();
      res.json(arbs);
    } catch (error) {
      console.error("Error fetching ARBs:", error);
      res.status(500).json({ message: "Failed to fetch ARBs" });
    }
  });

  app.get('/api/arb/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const arbItem = await storage.getArb(id);
      if (!arbItem) {
        return res.status(404).json({ message: "ARB not found" });
      }
      res.json(arbItem);
    } catch (error) {
      console.error("Error fetching ARB:", error);
      res.status(500).json({ message: "Failed to fetch ARB" });
    }
  });

  app.post('/api/arb', async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const arbData = insertArbSchema.parse({ ...req.body, requesterId: userId });
      const arbItem = await storage.createArb(arbData);
      res.status(201).json(arbItem);
    } catch (error) {
      console.error("Error creating ARB:", error);
      res.status(400).json({ message: "Failed to create ARB" });
    }
  });

  app.put('/api/arb/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const arbData = insertArbSchema.partial().parse(req.body);
      const arbItem = await storage.updateArb(id, arbData);
      res.json(arbItem);
    } catch (error) {
      console.error("Error updating ARB:", error);
      res.status(400).json({ message: "Failed to update ARB" });
    }
  });

  app.delete('/api/arb/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteArb(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting ARB:", error);
      res.status(500).json({ message: "Failed to delete ARB" });
    }
  });

  // Project Version routes
  app.get('/api/projects/:projectId/versions', async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const versions = await storage.getProjectVersions(projectId);
      res.json(versions);
    } catch (error) {
      console.error("Error fetching project versions:", error);
      res.status(500).json({ message: "Failed to fetch project versions" });
    }
  });

  app.get('/api/project-versions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const version = await storage.getProjectVersion(id);
      if (!version) {
        return res.status(404).json({ message: "Project version not found" });
      }
      res.json(version);
    } catch (error) {
      console.error("Error fetching project version:", error);
      res.status(500).json({ message: "Failed to fetch project version" });
    }
  });

  app.post('/api/project-versions', async (req, res) => {
    try {
      const versionData = insertProjectVersionSchema.parse(req.body);
      const version = await storage.createProjectVersion(versionData);
      res.status(201).json(version);
    } catch (error) {
      console.error("Error creating project version:", error);
      res.status(400).json({ message: "Failed to create project version" });
    }
  });

  // Git Repository routes
  app.get('/api/project-versions/:versionId/git-repos', async (req, res) => {
    try {
      const versionId = parseInt(req.params.versionId);
      const gitRepos = await storage.getGitRepos(versionId);
      res.json(gitRepos);
    } catch (error) {
      console.error("Error fetching git repositories:", error);
      res.status(500).json({ message: "Failed to fetch git repositories" });
    }
  });

  app.post('/api/git-repos', async (req, res) => {
    try {
      const gitRepoData = insertGitRepoSchema.parse(req.body);
      const gitRepo = await storage.createGitRepo(gitRepoData);
      res.status(201).json(gitRepo);
    } catch (error) {
      console.error("Error creating git repository:", error);
      res.status(400).json({ message: "Failed to create git repository" });
    }
  });

  // Commit routes
  app.get('/api/git-repos/:repoId/commits', async (req, res) => {
    try {
      const repoId = parseInt(req.params.repoId);
      const commits = await storage.getCommits(repoId);
      res.json(commits);
    } catch (error) {
      console.error("Error fetching commits:", error);
      res.status(500).json({ message: "Failed to fetch commits" });
    }
  });

  app.post('/api/commits', async (req, res) => {
    try {
      const commitData = insertCommitSchema.parse(req.body);
      const commit = await storage.createCommit(commitData);
      res.status(201).json(commit);
    } catch (error) {
      console.error("Error creating commit:", error);
      res.status(400).json({ message: "Failed to create commit" });
    }
  });

  // CAB routes
  app.get('/api/project-versions/:versionId/cabs', async (req, res) => {
    try {
      const versionId = parseInt(req.params.versionId);
      const cabs = await storage.getCabs(versionId);
      res.json(cabs);
    } catch (error) {
      console.error("Error fetching CAB tickets:", error);
      res.status(500).json({ message: "Failed to fetch CAB tickets" });
    }
  });

  app.post('/api/cabs', async (req, res) => {
    try {
      const cabData = insertCabSchema.parse(req.body);
      const cab = await storage.createCab(cabData);
      res.status(201).json(cab);
    } catch (error) {
      console.error("Error creating CAB ticket:", error);
      res.status(400).json({ message: "Failed to create CAB ticket" });
    }
  });

  // Procedure routes (4 types organized by Git repository)
  app.get('/api/git-repos/:repoId/procedures', async (req, res) => {
    try {
      const repoId = parseInt(req.params.repoId);
      const procedures = await storage.getProcedures(repoId);
      res.json(procedures);
    } catch (error) {
      console.error("Error fetching procedures:", error);
      res.status(500).json({ message: "Failed to fetch procedures" });
    }
  });

  app.get('/api/git-repos/:repoId/procedures/:type', async (req, res) => {
    try {
      const repoId = parseInt(req.params.repoId);
      const type = req.params.type;
      const procedures = await storage.getProceduresByType(repoId, type);
      res.json(procedures);
    } catch (error) {
      console.error("Error fetching procedures by type:", error);
      res.status(500).json({ message: "Failed to fetch procedures by type" });
    }
  });

  app.post('/api/procedures', async (req, res) => {
    try {
      const procedureData = insertProcedureSchema.parse(req.body);
      const procedure = await storage.createProcedure(procedureData);
      res.status(201).json(procedure);
    } catch (error) {
      console.error("Error creating procedure:", error);
      res.status(400).json({ message: "Failed to create procedure" });
    }
  });

  app.patch('/api/procedures/:id/toggle', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const procedure = await storage.toggleProcedureCompletion(id);
      res.json(procedure);
    } catch (error) {
      console.error("Error toggling procedure completion:", error);
      res.status(500).json({ message: "Failed to toggle procedure completion" });
    }
  });

  // Git Repository CRUD operations
  app.get('/api/git-repos/all', async (req, res) => {
    try {
      // Récupérer tous les repositories Git distincts (pas spécifiques à une version)
      const allRepos = await db.select({
        id: gitRepos.id,
        name: gitRepos.name,
        url: gitRepos.url,
        description: gitRepos.description,
      })
      .from(gitRepos)
      .groupBy(gitRepos.name, gitRepos.url, gitRepos.id, gitRepos.description);
      
      res.json(allRepos);
    } catch (error) {
      console.error("Error fetching all git repos:", error);
      res.status(500).json({ message: "Failed to fetch git repos" });
    }
  });

  app.post('/api/project-versions/:id/git-repos', async (req, res) => {
    try {
      const projectVersionId = parseInt(req.params.id);
      const gitRepoData = { ...req.body, projectVersionId };
      const gitRepo = await storage.createGitRepo(gitRepoData);
      res.status(201).json(gitRepo);
    } catch (error) {
      console.error("Error creating git repo:", error);
      res.status(400).json({ message: "Failed to create git repo" });
    }
  });

  app.patch('/api/git-repos/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const gitRepo = await storage.updateGitRepo(id, req.body);
      res.json(gitRepo);
    } catch (error) {
      console.error("Error updating git repo:", error);
      res.status(400).json({ message: "Failed to update git repo" });
    }
  });

  app.delete('/api/git-repos/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteGitRepo(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting git repo:", error);
      res.status(500).json({ message: "Failed to delete git repo" });
    }
  });

  // Project PV CRUD operations
  app.post('/api/project-versions/:id/pvs', async (req, res) => {
    try {
      const projectVersionId = parseInt(req.params.id);
      const pvData = { ...req.body, projectVersionId };
      const pv = await storage.createProjectPv(pvData);
      res.status(201).json(pv);
    } catch (error) {
      console.error("Error creating project PV:", error);
      res.status(400).json({ message: "Failed to create project PV" });
    }
  });

  app.patch('/api/project-pvs/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const pv = await storage.updateProjectPv(id, req.body);
      res.json(pv);
    } catch (error) {
      console.error("Error updating project PV:", error);
      res.status(400).json({ message: "Failed to update project PV" });
    }
  });

  app.delete('/api/project-pvs/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProjectPv(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project PV:", error);
      res.status(500).json({ message: "Failed to delete project PV" });
    }
  });

  // CAB CRUD operations
  app.post('/api/project-versions/:id/cabs', async (req, res) => {
    try {
      const projectVersionId = parseInt(req.params.id);
      const cabData = { ...req.body, projectVersionId };
      const cab = await storage.createCab(cabData);
      res.status(201).json(cab);
    } catch (error) {
      console.error("Error creating CAB:", error);
      res.status(400).json({ message: "Failed to create CAB" });
    }
  });

  app.patch('/api/cabs/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cab = await storage.updateCab(id, req.body);
      res.json(cab);
    } catch (error) {
      console.error("Error updating CAB:", error);
      res.status(400).json({ message: "Failed to update CAB" });
    }
  });

  app.delete('/api/cabs/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCab(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting CAB:", error);
      res.status(500).json({ message: "Failed to delete CAB" });
    }
  });

  // Release procedures aggregation
  app.get('/api/releases/:releaseId/procedures', async (req, res) => {
    try {
      const releaseId = parseInt(req.params.releaseId);
      const procedures = await storage.getReleaseProcedures(releaseId);
      res.json(procedures);
    } catch (error) {
      console.error("Error fetching release procedures:", error);
      res.status(500).json({ message: "Failed to fetch release procedures" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
