import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { prisma } from "./db";

export async function registerRoutes(app: Express): Promise<Server> {
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
          profileImageUrl: "https://ui-avatars.com/api/?name=Kevin+Nicol"
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
      const teamData = req.body;
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
      const teamData = req.body;
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
      const memberData = { ...req.body, teamId };
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
      const projectData = req.body;
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
      const projectData = req.body;
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
      const { yearMonth } = req.query;
      
      if (yearMonth && typeof yearMonth === 'string') {
        // Filtrer les releases par année-mois pour la génération de releaseId
        const releases = await storage.getReleasesByYearMonth(yearMonth);
        res.json(releases);
      } else {
        // Récupérer toutes les releases
        const releases = await storage.getReleases();
        res.json(releases);
      }
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
      const releaseData = req.body;
      const release = await storage.createRelease(releaseData);
      res.status(201).json(release);
    } catch (error) {
      console.error("Error creating release:", error);
      let errorMessage: string;
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null && "message" in error && typeof (error as any).message === "string") {
        errorMessage = (error as any).message;
      } else {
        errorMessage = String(error);
      }
      res.status(400).json({ message: "Failed to create release : " + errorMessage });
    }
  });

  app.put('/api/releases/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const releaseData = req.body;
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

  app.get('/api/releases/:id/project-versions', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const projectVersions = await storage.getReleaseProjectVersions(id);
      res.json(projectVersions);
    } catch (error) {
      console.error("Error fetching release project versions:", error);
      res.status(500).json({ message: "Failed to fetch release project versions" });
    }
  });

  // Release-Project routes
  app.post('/api/releases/:releaseId/projects', async (req, res) => {
    try {
      const releaseId = parseInt(req.params.releaseId);
      const releaseProjectData = { ...req.body, releaseId };
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
      
      console.log('=== ASSOCIATION DEBUG START ===');
      console.log('Params:', req.params);
      console.log('Body:', req.body);
      console.log('Parsed projectId:', projectId);
      console.log('Parsed versionId:', versionId);
      console.log('Received releaseId:', releaseId);
      
      let targetReleaseId = releaseId;
      
      // If createRelease is provided, create a new release first
      if (createRelease) {
        console.log('Creating new release:', createRelease);
        const newRelease = await storage.createRelease(createRelease);
        targetReleaseId = newRelease.id;
        console.log('Created new release with ID:', targetReleaseId);
      }
      
      console.log('Target release ID:', targetReleaseId);
      
      // Verify the version exists before updating
      const existingVersion = await storage.getProjectVersion(versionId);
      if (!existingVersion) {
        console.error('Version not found:', versionId);
        return res.status(404).json({ message: "Project version not found" });
      }
      
      console.log('Existing version found:', { id: existingVersion.id, currentReleaseId: existingVersion.releaseId });
      
      // Associate version to release directly
      console.log('Updating project version with releaseId:', targetReleaseId);
      const updatedVersion = await storage.updateProjectVersion(versionId, { releaseId: targetReleaseId });
      console.log('Updated version result:', { id: updatedVersion.id, newReleaseId: updatedVersion.releaseId });
      
      // Also associate project to release if not already associated
      try {
        console.log('Adding project to release:', { releaseId: targetReleaseId, projectId });
        await storage.addProjectToRelease({ releaseId: targetReleaseId, projectId });
        console.log('Project associated to release successfully');
      } catch (error) {
        // Ignore duplicate key errors - project already associated to release
        console.log("Project already associated to release, skipping...", error.message);
      }
      
      console.log('=== ASSOCIATION DEBUG END ===');
      res.status(201).json({ 
        message: "Project version associated to release successfully",
        releaseId: targetReleaseId,
        versionId: versionId
      });
    } catch (error) {
      console.error("Error associating project version to release:", error);
      res.status(500).json({ message: "Failed to associate project version to release", error: error.message });
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

  // Project version note routes
  app.get('/api/project-versions/:id/note', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const version = await storage.getProjectVersion(id);
      if (!version) return res.status(404).json({ message: 'Version not found' });
      res.json({ note: (version as any).note || null });
    } catch (error) {
      console.error('Error fetching project version note:', error);
      res.status(500).json({ message: 'Failed to fetch project version note' });
    }
  });

  app.patch('/api/project-versions/:id/note', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { note } = req.body as { note?: string | null };
      const updated = await storage.updateProjectVersionNote(id, note ?? null);
      res.json({ id: updated.id, note: (updated as any).note || null });
    } catch (error) {
      console.error('Error updating project version note:', error);
      res.status(500).json({ message: 'Failed to update project version note' });
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
      const userId = req.user?.claims?.sub || req.body.requesterId;
      const arbData = { ...req.body, requesterId: userId };
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
      const arbData = req.body;
      const arbItem = await storage.updateArb(id, arbData);
      res.json(arbItem);
    } catch (error) {
      console.error("Error updating ARB:", error);
      res.status(400).json({ message: "Failed to update ARB" });
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

  // Git repos routes
  app.get('/api/git-repos/all', async (req, res) => {
    try {
      const gitRepos = await storage.getAllGitRepos();
      res.json(gitRepos);
    } catch (error) {
      console.error("Error fetching all git repos:", error);
      res.status(500).json({ message: "Failed to fetch git repos" });
    }
  });

  // Nouvelle route pour récupérer les git repos d'un projet
  app.get('/api/projects/:projectId/git-repos', async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      // Récupérer toutes les versions du projet avec leurs git repos
      const versions = await storage.getProjectVersions(projectId);
      const gitRepos = versions.flatMap(version => version.gitRepos || []);
      
      res.json(gitRepos);
    } catch (error) {
      console.error("Error fetching project git repos:", error);
      res.status(500).json({ message: "Failed to fetch project git repos" });
    }
  });

  app.post('/api/projects/:projectId/versions/:versionId/git-repos', async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const versionId = parseInt(req.params.versionId);
      const { name, url, existingRepoId } = req.body;

      let gitRepo;
      if (existingRepoId) {
        // Associer un repo existant à la version
        gitRepo = await storage.associateGitRepoToVersion(existingRepoId, versionId);
      } else {
        // Créer un nouveau repo et l'associer à la version
        gitRepo = await storage.createGitRepoWithAssociation({
          name,
          url: url || null,
          lastCommitHash: null,
        }, versionId);
      }

      res.status(201).json(gitRepo);
    } catch (error) {
      console.error("Error creating/associating git repo:", error);
      res.status(400).json({ message: "Failed to create/associate git repo" });
    }
  });

  app.put('/api/git-repos/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, url } = req.body;
      const gitRepo = await storage.updateGitRepo(id, { name, url });
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

  // Commit routes
  // Git repo procedure routes
  app.get('/api/git-repos/:gitRepoId/procedures', async (req, res) => {
    try {
      const gitRepoId = parseInt(req.params.gitRepoId);
      const procedures = await storage.getProcedures(gitRepoId);
      res.json(procedures);
    } catch (error) {
      console.error("Error fetching procedures:", error);
      res.status(500).json({ message: "Failed to fetch procedures" });
    }
  });

  app.post('/api/git-repos/:gitRepoId/procedures', async (req, res) => {
    try {
      const gitRepoId = parseInt(req.params.gitRepoId);
      
      // Trouver l'association ProjectVersionGitRepo pour ce gitRepoId
      // Note: Il peut y avoir plusieurs associations si le repo est utilisé dans plusieurs versions
      // Pour l'instant, on prend la première trouvée
      const versionGitRepo = await storage.getVersionGitRepoByGitRepoId(gitRepoId);
      
      if (!versionGitRepo) {
        return res.status(404).json({ message: "Git repo association not found" });
      }
      
      const procedureData = {
        ...req.body,
        versionGitRepoId: versionGitRepo.id,
      };
      const procedure = await storage.createProcedure(procedureData);
      res.status(201).json(procedure);
    } catch (error) {
      console.error("Error creating procedure:", error);
      res.status(500).json({ message: "Failed to create procedure" });
    }
  });

  app.patch('/api/procedures/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const procedure = await storage.updateProcedure(id, req.body);
      res.json(procedure);
    } catch (error) {
      console.error("Error updating procedure:", error);
      res.status(500).json({ message: "Failed to update procedure" });
    }
  });

  app.delete('/api/procedures/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProcedure(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting procedure:", error);
      res.status(500).json({ message: "Failed to delete procedure" });
    }
  });

  // Git repo commit routes
  app.get('/api/git-repos/:gitRepoId/commits', async (req, res) => {
    try {
      const gitRepoId = parseInt(req.params.gitRepoId);
      const commits = await storage.getCommits(gitRepoId);
      res.json(commits);
    } catch (error) {
      console.error("Error fetching commits:", error);
      res.status(500).json({ message: "Failed to fetch commits" });
    }
  });

  // Nouvelle route pour récupérer les commits d'une association spécifique
  app.get('/api/version-git-repos/:versionGitRepoId/commits', async (req, res) => {
    try {
      const versionGitRepoId = parseInt(req.params.versionGitRepoId);
      const commits = await storage.getCommitsByVersionGitRepo(versionGitRepoId);
      res.json(commits);
    } catch (error) {
      console.error("Error fetching commits for version-git-repo:", error);
      res.status(500).json({ message: "Failed to fetch commits for version-git-repo" });
    }
  });

  // Nouvelle route pour récupérer les procédures d'une association spécifique
  app.get('/api/version-git-repos/:versionGitRepoId/procedures', async (req, res) => {
    try {
      const versionGitRepoId = parseInt(req.params.versionGitRepoId);
      const procedures = await storage.getProceduresByVersionGitRepo(versionGitRepoId);
      res.json(procedures);
    } catch (error) {
      console.error("Error fetching procedures for version-git-repo:", error);
      res.status(500).json({ message: "Failed to fetch procedures for version-git-repo" });
    }
  });

  // Nouvelle route pour créer un commit dans une association spécifique
  app.post('/api/version-git-repos/:versionGitRepoId/commits', async (req, res) => {
    try {
      const versionGitRepoId = parseInt(req.params.versionGitRepoId);
      const { hash, message, author, authorEmail } = req.body;
      
      const commit = await storage.createCommit({
        versionGitRepoId,
        hash,
        message,
        author,
        authorEmail: authorEmail || undefined,
        committedAt: new Date(),
      });
      
      res.status(201).json(commit);
    } catch (error) {
      console.error("Error creating commit for version-git-repo:", error);
      res.status(500).json({ message: "Failed to create commit for version-git-repo" });
    }
  });

  // Nouvelle route pour créer une procédure dans une association spécifique
  app.post('/api/version-git-repos/:versionGitRepoId/procedures', async (req, res) => {
    try {
      const versionGitRepoId = parseInt(req.params.versionGitRepoId);
      const { type, title, description, content, order } = req.body;
      
      const procedure = await storage.createProcedure({
        versionGitRepoId,
        type,
        title,
        description: description || undefined,
        content,
        order: order || undefined,
      });
      
      res.status(201).json(procedure);
    } catch (error) {
      console.error("Error creating procedure for version-git-repo:", error);
      res.status(500).json({ message: "Failed to create procedure for version-git-repo" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
