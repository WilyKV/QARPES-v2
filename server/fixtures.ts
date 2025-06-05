import { storage } from "./storage";

export async function createFixtures() {
  try {
    console.log("Creating fixtures...");

    // Create additional users
    const users = [
      {
        id: "user-1",
        email: "marie.dupont@omneseducation.com",
        firstName: "Marie",
        lastName: "Dupont",
        profileImageUrl: null,
      },
      {
        id: "user-2", 
        email: "jean.martin@omneseducation.com",
        firstName: "Jean",
        lastName: "Martin",
        profileImageUrl: null,
      },
      {
        id: "user-3",
        email: "sophie.bernard@omneseducation.com", 
        firstName: "Sophie",
        lastName: "Bernard",
        profileImageUrl: null,
      },
      {
        id: "user-4",
        email: "pierre.moreau@omneseducation.com",
        firstName: "Pierre", 
        lastName: "Moreau",
        profileImageUrl: null,
      },
      {
        id: "user-5",
        email: "claire.rousseau@omneseducation.com",
        firstName: "Claire",
        lastName: "Rousseau", 
        profileImageUrl: null,
      }
    ];

    for (const user of users) {
      await storage.upsertUser(user);
    }

    // Create teams
    const teams = [
      {
        name: "Équipe Frontend",
        description: "Développement des interfaces utilisateur et expérience client",
        leaderId: "user-1",
      },
      {
        name: "Équipe Backend", 
        description: "Architecture serveur, APIs et intégrations",
        leaderId: "user-2",
      },
      {
        name: "Équipe DevOps",
        description: "Infrastructure, déploiement et monitoring", 
        leaderId: "user-3",
      },
      {
        name: "Équipe Mobile",
        description: "Applications mobiles iOS et Android",
        leaderId: "user-4",
      }
    ];

    const createdTeams = [];
    for (const team of teams) {
      const createdTeam = await storage.createTeam(team);
      createdTeams.push(createdTeam);
    }

    // Add team members
    const teamMembers = [
      // Frontend team
      { teamId: createdTeams[0].id, userId: "user-1", role: "Leader" },
      { teamId: createdTeams[0].id, userId: "user-5", role: "Developer" },
      { teamId: createdTeams[0].id, userId: "demo-user-id", role: "Developer" },
      
      // Backend team  
      { teamId: createdTeams[1].id, userId: "user-2", role: "Leader" },
      { teamId: createdTeams[1].id, userId: "user-4", role: "Developer" },
      
      // DevOps team
      { teamId: createdTeams[2].id, userId: "user-3", role: "Leader" },
      { teamId: createdTeams[2].id, userId: "user-1", role: "Ops" },
      
      // Mobile team
      { teamId: createdTeams[3].id, userId: "user-4", role: "Leader" },
      { teamId: createdTeams[3].id, userId: "user-5", role: "Developer" },
    ];

    for (const member of teamMembers) {
      await storage.addTeamMember(member);
    }

    // Create projects
    const projects = [
      {
        name: "Portail Étudiant v3.0",
        description: "Refonte complète du portail étudiant avec nouvelle UI/UX",
        status: "in_progress",
        priority: "high", 
        teamId: createdTeams[0].id,
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-06-30"),
        budget: 150000,
      },
      {
        name: "API Gateway", 
        description: "Mise en place d'une gateway API centralisée",
        status: "in_progress",
        priority: "medium",
        teamId: createdTeams[1].id,
        startDate: new Date("2024-02-01"), 
        endDate: new Date("2024-05-15"),
        budget: 80000,
      },
      {
        name: "Infrastructure Cloud",
        description: "Migration vers l'infrastructure cloud AWS",
        status: "planning",
        priority: "high",
        teamId: createdTeams[2].id, 
        startDate: new Date("2024-04-01"),
        endDate: new Date("2024-08-31"),
        budget: 200000,
      },
      {
        name: "App Mobile Étudiants",
        description: "Application mobile native pour les étudiants", 
        status: "completed",
        priority: "medium",
        teamId: createdTeams[3].id,
        startDate: new Date("2023-09-01"),
        endDate: new Date("2024-01-31"), 
        budget: 120000,
      },
      {
        name: "Système de Notation",
        description: "Nouveau système de gestion des notes et évaluations",
        status: "in_progress", 
        priority: "high",
        teamId: createdTeams[1].id,
        startDate: new Date("2024-03-01"),
        endDate: new Date("2024-07-15"),
        budget: 90000,
      }
    ];

    const createdProjects = [];
    for (const project of projects) {
      const createdProject = await storage.createProject(project);
      createdProjects.push(createdProject);
    }

    // Create releases
    const releases = [
      {
        releaseId: "202401-01",
        name: "Release Q1 2024",
        description: "Première release majeure de l'année avec le nouveau portail étudiant",
        status: "completed",
        teamId: createdTeams[0].id,
        plannedDate: new Date("2024-01-31"),
        actualDate: new Date("2024-02-02"),
        notes: "Déploiement réussi avec quelques ajustements mineurs",
      },
      {
        releaseId: "202403-01", 
        name: "Release Backend Q1",
        description: "Déploiement de la nouvelle API Gateway et améliorations backend",
        status: "in_progress",
        teamId: createdTeams[1].id,
        plannedDate: new Date("2024-03-15"),
        actualDate: null,
        notes: "Tests en cours, déploiement prévu comme planifié",
      },
      {
        releaseId: "202404-01",
        name: "Release Infrastructure", 
        description: "Migration cloud et nouvelles capacités d'infrastructure",
        status: "planning",
        teamId: createdTeams[2].id,
        plannedDate: new Date("2024-04-30"),
        actualDate: null,
        notes: "Planification en cours, dépendant de la validation sécurité",
      },
      {
        releaseId: "202406-01",
        name: "Release Été 2024",
        description: "Gros déploiement d'été avec multiples fonctionnalités",
        status: "planning", 
        teamId: createdTeams[0].id,
        plannedDate: new Date("2024-06-15"),
        actualDate: null,
        notes: "Release majeure incluant portail v3 et nouvelles fonctionnalités",
      }
    ];

    const createdReleases = [];
    for (const release of releases) {
      const createdRelease = await storage.createRelease(release);
      createdReleases.push(createdRelease);
    }

    // Link projects to releases
    const releaseProjects = [
      { releaseId: createdReleases[0].id, projectId: createdProjects[3].id }, // App Mobile -> Release Q1
      { releaseId: createdReleases[1].id, projectId: createdProjects[1].id }, // API Gateway -> Release Backend Q1
      { releaseId: createdReleases[1].id, projectId: createdProjects[4].id }, // Système Notation -> Release Backend Q1  
      { releaseId: createdReleases[2].id, projectId: createdProjects[2].id }, // Infrastructure -> Release Infrastructure
      { releaseId: createdReleases[3].id, projectId: createdProjects[0].id }, // Portail v3 -> Release Été
      { releaseId: createdReleases[3].id, projectId: createdProjects[4].id }, // Système Notation -> Release Été
    ];

    for (const rp of releaseProjects) {
      await storage.addProjectToRelease(rp);
    }

    // Create ARB requests
    const arbRequests = [
      {
        title: "Accès serveur production",
        description: "Demande d'accès en lecture aux serveurs de production pour le monitoring des performances durant la release",
        type: "access",
        status: "approved",
        priority: "high",
        requesterId: "user-3",
        approverId: "user-2", 
        teamId: createdTeams[2].id,
        projectId: createdProjects[2].id,
        requestedAt: new Date("2024-02-10"),
        approvedAt: new Date("2024-02-12"),
        budget: null,
        justification: "Nécessaire pour surveiller la migration cloud",
      },
      {
        title: "Budget supplémentaire UI/UX",
        description: "Demande de budget additionnel pour l'amélioration de l'expérience utilisateur du portail étudiant",
        type: "budget", 
        status: "pending",
        priority: "medium",
        requesterId: "user-1",
        approverId: null,
        teamId: createdTeams[0].id,
        projectId: createdProjects[0].id,
        requestedAt: new Date("2024-03-01"),
        approvedAt: null,
        budget: 25000,
        justification: "Tests utilisateur montrent le besoin d'améliorations UX",
      },
      {
        title: "Responsabilité lead technique",
        description: "Transfert de responsabilité de lead technique pour le projet API Gateway",
        type: "responsibility",
        status: "approved", 
        priority: "high",
        requesterId: "user-2",
        approverId: "user-1",
        teamId: createdTeams[1].id,
        projectId: createdProjects[1].id,
        requestedAt: new Date("2024-02-20"),
        approvedAt: new Date("2024-02-22"),
        budget: null,
        justification: "Réorganisation des équipes pour optimiser les compétences",
      },
      {
        title: "Accès base de données analytics", 
        description: "Demande d'accès aux données analytics pour le développement du tableau de bord",
        type: "access",
        status: "rejected",
        priority: "low",
        requesterId: "user-5",
        approverId: "user-3",
        teamId: createdTeams[0].id, 
        projectId: createdProjects[0].id,
        requestedAt: new Date("2024-02-05"),
        approvedAt: new Date("2024-02-08"),
        budget: null,
        justification: "Données sensibles, alternatives proposées",
      },
      {
        title: "Budget formation DevOps",
        description: "Formation avancée en DevOps et cloud pour l'équipe infrastructure",
        type: "budget",
        status: "pending", 
        priority: "medium",
        requesterId: "user-3",
        approverId: null,
        teamId: createdTeams[2].id,
        projectId: createdProjects[2].id,
        requestedAt: new Date("2024-03-05"),
        approvedAt: null,
        budget: 15000,
        justification: "Montée en compétences nécessaire pour la migration cloud",
      }
    ];

    for (const arb of arbRequests) {
      await storage.createArb(arb);
    }

    console.log("Fixtures created successfully!");
    console.log(`- ${users.length + 1} users created`);
    console.log(`- ${teams.length} teams created`);
    console.log(`- ${teamMembers.length} team memberships created`);
    console.log(`- ${projects.length} projects created`);
    console.log(`- ${releases.length} releases created`);
    console.log(`- ${releaseProjects.length} release-project links created`);
    console.log(`- ${arbRequests.length} ARB requests created`);

  } catch (error) {
    console.error("Error creating fixtures:", error);
    throw error;
  }
}