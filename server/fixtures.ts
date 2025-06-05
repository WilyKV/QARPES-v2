import { db } from "./db";
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
  pvFiles
} from "@shared/schema";

export async function createFixtures() {
  console.log("Creating fixtures...");

  // Clear existing data
  await db.delete(pvFiles);
  await db.delete(projectPvs);
  await db.delete(procedures);
  await db.delete(commits);
  await db.delete(gitRepos);
  await db.delete(cab);
  await db.delete(projectVersions);
  await db.delete(releaseProjects);
  await db.delete(releases);
  await db.delete(arb);
  await db.delete(projects);
  await db.delete(teamMembers);
  await db.delete(teams);

  // Create demo users
  const demoUsers = await db.insert(users).values([
    {
      id: "demo-user-id",
      email: "demo.user@omneseducation.com",
      firstName: "Demo",
      lastName: "User",
      profileImageUrl: "https://replit.com/public/images/mark.png"
    },
    {
      id: "lead-dev-id",
      email: "lead.dev@omneseducation.com",
      firstName: "Pierre",
      lastName: "Martin",
      profileImageUrl: "https://replit.com/public/images/mark.png"
    },
    {
      id: "qa-engineer-id",
      email: "qa.engineer@omneseducation.com",
      firstName: "Sophie",
      lastName: "Dubois",
      profileImageUrl: "https://replit.com/public/images/mark.png"
    }
  ]).returning();

  // Create teams according to your screenshot
  const createdTeams = await db.insert(teams).values([
    {
      name: "E2I",
      description: "Équipe E2I - Écosystème d'Innovation Intégré",
      leaderId: "lead-dev-id"
    },
    {
      name: "Nemo",
      description: "Équipe Nemo - Plateforme de gestion étudiante",
      leaderId: "demo-user-id"
    },
    {
      name: "Iris",
      description: "Équipe Iris - Interface et systèmes",
      leaderId: "qa-engineer-id"
    },
    {
      name: "Carte Étudiante",
      description: "Équipe Carte Étudiante",
      leaderId: "lead-dev-id"
    },
    {
      name: "EUBS",
      description: "Équipe EUBS - European University Business School",
      leaderId: "demo-user-id"
    },
    {
      name: "Formulaire de Candidature",
      description: "Équipe Formulaire de Candidature",
      leaderId: "qa-engineer-id"
    },
    {
      name: "Techaway",
      description: "Équipe Techaway - Solutions techniques",
      leaderId: "lead-dev-id"
    },
    {
      name: "Ypareo",
      description: "Équipe Ypareo - Gestion pédagogique",
      leaderId: "demo-user-id"
    },
    {
      name: "Match'Up",
      description: "Équipe Match'Up - Plateforme de matching",
      leaderId: "qa-engineer-id"
    },
    {
      name: "Newform Backoffice",
      description: "Équipe Newform Backoffice",
      leaderId: "lead-dev-id"
    },
    {
      name: "NewmanTrek",
      description: "Équipe NewmanTrek - Automatisation des tests",
      leaderId: "demo-user-id"
    },
    {
      name: "CodeGhost",
      description: "Équipe CodeGhost - Features d'amélio sans projet",
      leaderId: "qa-engineer-id"
    }
  ]).returning();

  // Add team members
  for (const team of createdTeams) {
    await db.insert(teamMembers).values([
      { teamId: team.id, userId: team.leaderId!, role: "leader" },
      { teamId: team.id, userId: demoUsers[0].id, role: "member" },
      { teamId: team.id, userId: demoUsers[1].id, role: "member" }
    ]);
  }

  // Create projects according to your screenshot
  const createdProjects = await db.insert(projects).values([
    // E2I
    {
      name: "E2I v1.0.0 - Lot Egoronne",
      description: "Lot Egoronne pour la plateforme E2I",
      status: "production",
      teamId: createdTeams[0].id,
      repositoryUrl: "https://github.com/omneseducation/e2i-egoronne"
    },
    {
      name: "E2I v1.0.1 - Lot TreLot",
      description: "Lot TreLot pour la plateforme E2I",
      status: "testing",
      teamId: createdTeams[0].id,
      repositoryUrl: "https://github.com/omneseducation/e2i-trelot"
    },
    // Nemo
    {
      name: "Nemo v4.1.0",
      description: "Version 4.1.0 de la plateforme Nemo",
      status: "production",
      teamId: createdTeams[1].id,
      repositoryUrl: "https://github.com/omneseducation/nemo"
    },
    {
      name: "Nemo v4.1.1 - fix isActive",
      description: "Correction du bug isActive dans Nemo",
      status: "testing",
      teamId: createdTeams[1].id,
      repositoryUrl: "https://github.com/omneseducation/nemo"
    },
    {
      name: "Nemo v4.2.0",
      description: "Version 4.2.0 de la plateforme Nemo",
      status: "development",
      teamId: createdTeams[1].id,
      repositoryUrl: "https://github.com/omneseducation/nemo"
    },
    // Iris
    {
      name: "IRIS / WP6 v3.2.0 - Lot Egoronne",
      description: "Lot Egoronne pour IRIS WP6",
      status: "production",
      teamId: createdTeams[2].id,
      repositoryUrl: "https://github.com/omneseducation/iris-wp6"
    },
    // EUBS
    {
      name: "EUBS v1.1.0 - Lot Egoronne",
      description: "Lot Egoronne pour EUBS",
      status: "production",
      teamId: createdTeams[4].id,
      repositoryUrl: "https://github.com/omneseducation/eubs"
    },
    // Formulaire de Candidature
    {
      name: "Release FDC 2.6.4",
      description: "Version 2.6.4 du Formulaire de Candidature",
      status: "production",
      teamId: createdTeams[5].id,
      repositoryUrl: "https://github.com/omneseducation/formulaire-candidature"
    },
    // Techaway
    {
      name: "Techaway v2.0.0",
      description: "Version 2.0.0 de Techaway",
      status: "development",
      teamId: createdTeams[6].id,
      repositoryUrl: "https://github.com/omneseducation/techaway"
    },
    // Ypareo
    {
      name: "Ypareo v3.0.1",
      description: "Version 3.0.1 de Ypareo",
      status: "production",
      teamId: createdTeams[7].id,
      repositoryUrl: "https://github.com/omneseducation/ypareo"
    },
    // Match'Up
    {
      name: "Match'Up v1.3.6",
      description: "Version 1.3.6 de Match'Up",
      status: "production",
      teamId: createdTeams[8].id,
      repositoryUrl: "https://github.com/omneseducation/matchup"
    },
    // Newform Backoffice
    {
      name: "Newform Backoffice v1.0.0",
      description: "Version 1.0.0 du Newform Backoffice",
      status: "testing",
      teamId: createdTeams[9].id,
      repositoryUrl: "https://github.com/omneseducation/newform-backoffice"
    },
    // NewmanTrek
    {
      name: "NewmanTrek v1.0.0",
      description: "Version 1.0.0 de NewmanTrek - Automatisation des tests",
      status: "development",
      teamId: createdTeams[10].id,
      repositoryUrl: "https://github.com/omneseducation/newman-trek"
    }
  ]).returning();

  // Create releases
  const createdReleases = await db.insert(releases).values([
    {
      releaseId: "202506-01",
      name: "Release Janvier 2025",
      description: "Release de janvier avec les projets E2I et Nemo",
      status: "planning",
      teamId: createdTeams[0].id,
      plannedDate: new Date("2025-01-15"),
      releaseDate: "2025-01-15"
    },
    {
      releaseId: "202506-02",
      name: "Release Février 2025",
      description: "Release de février avec IRIS et EUBS",
      status: "in_progress",
      teamId: createdTeams[2].id,
      plannedDate: new Date("2025-02-15"),
      releaseDate: "2025-02-15"
    }
  ]).returning();

  // Create project versions with git repos, commits, CAB tickets, and procedures
  for (const project of createdProjects.slice(0, 3)) {
    const version = await db.insert(projectVersions).values({
      projectId: project.id,
      version: "1.0.0",
      status: "production",
      description: `Version 1.0.0 du projet ${project.name}`
    }).returning();

    // Create git repositories for this version
    const gitRepo1 = await db.insert(gitRepos).values({
      projectVersionId: version[0].id,
      name: "backend-api",
      url: `${project.repositoryUrl}/backend`,
      branch: "main",
      lastCommitHash: "abc123def456"
    }).returning();

    const gitRepo2 = await db.insert(gitRepos).values({
      projectVersionId: version[0].id,
      name: "frontend-app",
      url: `${project.repositoryUrl}/frontend`,
      branch: "main",
      lastCommitHash: "def456ghi789"
    }).returning();

    // Create commits for each repository
    await db.insert(commits).values([
      {
        gitRepoId: gitRepo1[0].id,
        hash: "abc123def456",
        message: "feat: Add authentication system",
        author: "Pierre Martin",
        authorEmail: "p.martin@omneseducation.com",
        committedAt: new Date("2025-01-10T10:30:00Z")
      },
      {
        gitRepoId: gitRepo1[0].id,
        hash: "def456ghi789",
        message: "fix: Resolve database connection issue",
        author: "Sophie Dubois",
        authorEmail: "s.dubois@omneseducation.com",
        committedAt: new Date("2025-01-11T14:20:00Z")
      },
      {
        gitRepoId: gitRepo2[0].id,
        hash: "ghi789jkl012",
        message: "feat: Implement user dashboard",
        author: "Demo User",
        authorEmail: "demo.user@omneseducation.com",
        committedAt: new Date("2025-01-12T09:15:00Z")
      }
    ]);

    // Create CAB tickets
    await db.insert(cab).values([
      {
        projectVersionId: version[0].id,
        ticketNumber: `CAB-${project.id}-001`,
        title: "Déploiement en production",
        description: "Demande de déploiement de la version 1.0.0 en production",
        status: "approved",
        priority: "high",
        assigneeId: "lead-dev-id",
        dueDate: "2025-01-20"
      },
      {
        projectVersionId: version[0].id,
        ticketNumber: `CAB-${project.id}-002`,
        title: "Configuration des variables d'environnement",
        description: "Configuration des variables pour l'environnement de production",
        status: "in_progress",
        priority: "medium",
        assigneeId: "qa-engineer-id",
        dueDate: "2025-01-18"
      }
    ]);

    // Create 4 types of procedures for each repository
    const procedureTypes = [
      { type: "environment_variables", title: "Configuration des variables", description: "Configuration des variables d'environnement" },
      { type: "service_verification", title: "Vérification des services", description: "Vérification du bon fonctionnement des services" },
      { type: "command_execution", title: "Exécution des commandes", description: "Exécution des commandes de déploiement" },
      { type: "data_import", title: "Import des données", description: "Import et migration des données" }
    ];

    for (const repo of [gitRepo1[0], gitRepo2[0]]) {
      for (let index = 0; index < procedureTypes.length; index++) {
        const procType = procedureTypes[index];
        await db.insert(procedures).values({
          gitRepoId: repo.id,
          type: procType.type,
          title: `${procType.title} - ${repo.name}`,
          description: `${procType.description} pour le repository ${repo.name}`,
          content: {
            steps: [
              `Étape 1 pour ${procType.title}`,
              `Étape 2 pour ${procType.title}`,
              `Étape 3 pour ${procType.title}`
            ],
            commands: procType.type === "command_execution" ? [
              "npm install",
              "npm run build",
              "npm run deploy"
            ] : [],
            variables: procType.type === "environment_variables" ? {
              "DATABASE_URL": "postgresql://...",
              "API_KEY": "***",
              "NODE_ENV": "production"
            } : {}
          },
          order: index,
          isCompleted: Math.random() > 0.5
        });
      }
    }

    // Create 4 types of PVs for this version
    const pvTypes = [
      "pv_fonctionnel_recette",
      "pv_metier_recette", 
      "pv_conformite_preprod",
      "pv_tests_homologation_preprod"
    ];

    for (const pvType of pvTypes) {
      const pv = await db.insert(projectPvs).values({
        projectVersionId: version[0].id,
        type: pvType,
        status: Math.random() > 0.5 ? "completed" : "draft"
      }).returning();

      // Add some sample files for each PV
      await db.insert(pvFiles).values([
        {
          pvId: pv[0].id,
          fileName: `${pvType}_document.pdf`,
          filePath: `/uploads/pvs/${pv[0].id}/${pvType}_document.pdf`,
          fileSize: 1024567,
          mimeType: "application/pdf"
        },
        {
          pvId: pv[0].id,
          fileName: `${pvType}_screenshots.zip`,
          filePath: `/uploads/pvs/${pv[0].id}/${pvType}_screenshots.zip`,
          fileSize: 2048934,
          mimeType: "application/zip"
        }
      ]);
    }
  }

  // Create ARB entries
  await db.insert(arb).values([
    {
      title: "Accès base de données production",
      description: "Demande d'accès en lecture à la base de données de production pour l'équipe QA",
      type: "access",
      status: "pending",
      requesterId: "qa-engineer-id",
      teamId: createdTeams[0].id,
      projectId: createdProjects[0].id,
      priority: "high",
      dueDate: "2025-01-25"
    },
    {
      title: "Budget serveurs cloud",
      description: "Allocation budget pour les serveurs cloud du projet Nemo",
      type: "budget",
      status: "approved",
      requesterId: "demo-user-id",
      approverId: "lead-dev-id",
      teamId: createdTeams[1].id,
      projectId: createdProjects[2].id,
      budget: 500000, // 5000€ in cents
      priority: "medium",
      dueDate: "2025-02-01"
    }
  ]);

  console.log("✅ Fixtures created successfully!");
  console.log(`Created ${createdTeams.length} teams`);
  console.log(`Created ${createdProjects.length} projects`);
  console.log(`Created ${createdReleases.length} releases`);
}