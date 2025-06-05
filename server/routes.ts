import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertTeamSchema,
  insertProjectSchema,
  insertReleaseSchema,
  insertArbSchema,
  insertTeamMemberSchema,
  insertReleaseProjectSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const session = req.session as any;
      const sessionUser = session?.user;
      
      if (!sessionUser || !sessionUser.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(sessionUser.id);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Team routes
  app.get('/api/teams', isAuthenticated, async (req, res) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.get('/api/teams/:id', isAuthenticated, async (req, res) => {
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

  app.post('/api/teams', isAuthenticated, async (req, res) => {
    try {
      const teamData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(teamData);
      res.status(201).json(team);
    } catch (error) {
      console.error("Error creating team:", error);
      res.status(400).json({ message: "Failed to create team" });
    }
  });

  app.put('/api/teams/:id', isAuthenticated, async (req, res) => {
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

  app.delete('/api/teams/:id', isAuthenticated, async (req, res) => {
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
  app.get('/api/teams/:id/members', isAuthenticated, async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.post('/api/teams/:id/members', isAuthenticated, async (req, res) => {
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

  app.delete('/api/teams/:teamId/members/:userId', isAuthenticated, async (req, res) => {
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
  app.get('/api/projects', isAuthenticated, async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/:id', isAuthenticated, async (req, res) => {
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

  app.post('/api/projects', isAuthenticated, async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(400).json({ message: "Failed to create project" });
    }
  });

  app.put('/api/projects/:id', isAuthenticated, async (req, res) => {
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

  app.delete('/api/projects/:id', isAuthenticated, async (req, res) => {
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
  app.get('/api/releases', isAuthenticated, async (req, res) => {
    try {
      const releases = await storage.getReleases();
      res.json(releases);
    } catch (error) {
      console.error("Error fetching releases:", error);
      res.status(500).json({ message: "Failed to fetch releases" });
    }
  });

  app.get('/api/releases/:id', isAuthenticated, async (req, res) => {
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

  app.post('/api/releases', isAuthenticated, async (req, res) => {
    try {
      const releaseData = insertReleaseSchema.parse(req.body);
      const release = await storage.createRelease(releaseData);
      res.status(201).json(release);
    } catch (error) {
      console.error("Error creating release:", error);
      res.status(400).json({ message: "Failed to create release" });
    }
  });

  app.put('/api/releases/:id', isAuthenticated, async (req, res) => {
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

  app.delete('/api/releases/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRelease(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting release:", error);
      res.status(500).json({ message: "Failed to delete release" });
    }
  });

  // Release-Project routes
  app.post('/api/releases/:releaseId/projects', isAuthenticated, async (req, res) => {
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

  app.delete('/api/releases/:releaseId/projects/:projectId', isAuthenticated, async (req, res) => {
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

  // ARB routes
  app.get('/api/arb', isAuthenticated, async (req, res) => {
    try {
      const arbs = await storage.getArbs();
      res.json(arbs);
    } catch (error) {
      console.error("Error fetching ARBs:", error);
      res.status(500).json({ message: "Failed to fetch ARBs" });
    }
  });

  app.get('/api/arb/:id', isAuthenticated, async (req, res) => {
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

  app.post('/api/arb', isAuthenticated, async (req: any, res) => {
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

  app.put('/api/arb/:id', isAuthenticated, async (req, res) => {
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

  app.delete('/api/arb/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteArb(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting ARB:", error);
      res.status(500).json({ message: "Failed to delete ARB" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
