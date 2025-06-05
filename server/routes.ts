import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createFixtures } from "./fixtures";
import { gitRepos } from "@shared/schema";
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
      
      let targetReleaseId = releaseId;
      
      // If createRelease is provided, create a new release first
      if (createRelease) {
        const releaseData = req.body;
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

  const httpServer = createServer(app);
  return httpServer;
}
