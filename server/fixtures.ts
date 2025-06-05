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

  // Create authentic users based on your screenshots
  const demoUsers = await db.insert(users).values([
    // Équipe Développement - Responsables
    {
      id: "kevin.nicol",
      email: "kevin.nicol@omneseducation.com",
      firstName: "Kevin",
      lastName: "NICOL"
    },
    {
      id: "ivana.lackovic",
      email: "ivana.lackovic@omneseducation.com",
      firstName: "Ivana",
      lastName: "LACKOVIC"
    },
    
    // Domaine 1 - GASTELLIER Florence
    {
      id: "florence.gastellier",
      email: "fgastellier@omneseducation.com",
      firstName: "Florence",
      lastName: "GASTELLIER"
    },
    {
      id: "guillaume.zavan",
      email: "guillaume.zavan@omneseducation.com",
      firstName: "Guillaume",
      lastName: "ZAVAN"
    },
    {
      id: "sophea.thong",
      email: "sophea.thong@omneseducation.com",
      firstName: "Sophéa",
      lastName: "THONG"
    },
    {
      id: "anas.mersoul",
      email: "anas.mersoul@omneseducation.com",
      firstName: "Anas",
      lastName: "MERSOUL"
    },
    {
      id: "guillaume.ulrich",
      email: "guillaume.ulrich@omneseducation.com",
      firstName: "Guillaume",
      lastName: "ULRICH"
    },
    {
      id: "adrian.gallet",
      email: "adrian.gallet@omneseducation.com",
      firstName: "Adrian",
      lastName: "GALLET"
    },
    {
      id: "mohammed.hazzez",
      email: "mohammed.hazzez@omneseducation.com",
      firstName: "Mohammed",
      lastName: "HAZZEZ"
    },
    {
      id: "lionel.mollard",
      email: "lionel.mollard@omneseducation.com",
      firstName: "Lionel",
      lastName: "MOLLARD"
    },
    {
      id: "nourreddine.berjaoui",
      email: "nourreddine.berjaoui@omneseducation.com",
      firstName: "Nourreddine",
      lastName: "BERJAOUI"
    },
    {
      id: "mohamed.sahraoui",
      email: "mohamed.sahraoui@omneseducation.com",
      firstName: "Mohamed",
      lastName: "SAHRAOUI"
    },
    {
      id: "mehdi.fadili",
      email: "mehdi.fadili@omneseducation.com",
      firstName: "Mehdi",
      lastName: "FADILI"
    },
    
    // Domaine 2 - HOUDEBINE Stéphanie
    {
      id: "stephanie.houdebine",
      email: "shoudebine@omneseducation.com",
      firstName: "Stéphanie",
      lastName: "HOUDEBINE"
    },
    {
      id: "yannick.meunier",
      email: "yannick.meunier@omneseducation.com",
      firstName: "Yannick",
      lastName: "MEUNIER"
    },
    {
      id: "bertrand.berthomieu",
      email: "bertrand.berthomieu@omneseducation.com",
      firstName: "Bertrand",
      lastName: "BERTHOMIEU"
    },
    {
      id: "hachmi.halfaoui",
      email: "hachmi.halfaoui@omneseducation.com",
      firstName: "Hachmi",
      lastName: "HALFAOUI"
    },
    {
      id: "carole.helene",
      email: "carole.helene@omneseducation.com",
      firstName: "Carole",
      lastName: "HELENE"
    },
    {
      id: "julie.ramadanoski",
      email: "julie.ramadanoski@omneseducation.com",
      firstName: "Julie",
      lastName: "RAMADANOSKI"
    },
    {
      id: "patrick.lopez",
      email: "patrick.lopez@omneseducation.com",
      firstName: "Patrick",
      lastName: "LOPEZ"
    },
    {
      id: "alain.kizil",
      email: "alain.kizil@omneseducation.com",
      firstName: "Alain",
      lastName: "KIZIL"
    },
    {
      id: "frederic.medrano",
      email: "frederic.medrano@omneseducation.com",
      firstName: "Frederic",
      lastName: "MEDRANO"
    },
    {
      id: "steeven.achi",
      email: "steeven.achi@omneseducation.com",
      firstName: "Steeven",
      lastName: "ACHI"
    },
    {
      id: "mohamed.drine",
      email: "mohamed.drine@omneseducation.com",
      firstName: "Mohamed",
      lastName: "DRINE"
    },
    {
      id: "sofiaa.faddi",
      email: "sofiaa.faddi@omneseducation.com",
      firstName: "Sofiaa",
      lastName: "FADDI"
    },
    {
      id: "karim.amdouni",
      email: "karim.amdouni@omneseducation.com",
      firstName: "Karim",
      lastName: "AMDOUNI"
    },
    {
      id: "mody.kane",
      email: "mody.kane@omneseducation.com",
      firstName: "Mody",
      lastName: "KANE"
    },
    {
      id: "mohamed.ali.ksouri",
      email: "mohamed.ali.ksouri@omneseducation.com",
      firstName: "Mohamed Ali",
      lastName: "KSOURI"
    },
    {
      id: "cyrille.satge",
      email: "cyrille.satge@omneseducation.com",
      firstName: "Cyrille",
      lastName: "SATGE"
    },
    
    // Domaine 3 - BILLON Laurent
    {
      id: "laurent.billon",
      email: "lbillon@omneseducation.com",
      firstName: "Laurent",
      lastName: "BILLON"
    },
    {
      id: "julien.francisco",
      email: "julien.francisco@omneseducation.com",
      firstName: "Julien",
      lastName: "FRANCISCO"
    },
    {
      id: "hajer.saffar",
      email: "hajer.saffar@omneseducation.com",
      firstName: "Hajer",
      lastName: "SAFFAR"
    },
    {
      id: "nicolas.chambaz",
      email: "nicolas.chambaz@omneseducation.com",
      firstName: "Nicolas",
      lastName: "CHAMBAZ"
    },
    {
      id: "camille.camara",
      email: "camille.camara@omneseducation.com",
      firstName: "Camille",
      lastName: "CAMARA"
    },
    {
      id: "amar.bouabbache",
      email: "amar.bouabbache@omneseducation.com",
      firstName: "Amar",
      lastName: "BOUABBACHE"
    },
    
    // Domaine 4 - CHIOUCHIOU Walid
    {
      id: "walid.chiouchiou",
      email: "wchiouchiou@omneseducation.com",
      firstName: "Walid",
      lastName: "CHIOUCHIOU"
    },
    {
      id: "abdessamad.elouarti",
      email: "abdessamad.elouarti@omneseducation.com",
      firstName: "Abdessamad",
      lastName: "EL OUARTI"
    },
    {
      id: "sebastien.excoffon",
      email: "sebastien.excoffon@omneseducation.com",
      firstName: "Sebastien",
      lastName: "EXCOFFON"
    },
    {
      id: "yacine.mennaa",
      email: "yacine.mennaa@omneseducation.com",
      firstName: "Yacine",
      lastName: "MENNAA"
    },
    {
      id: "vincent.ravanel",
      email: "vincent.ravanel@omneseducation.com",
      firstName: "Vincent",
      lastName: "RAVANEL"
    },
    
    // Équipe DevSecOps/Transverse
    {
      id: "jacques.roubault",
      email: "jacques.roubault@omneseducation.com",
      firstName: "Jacques",
      lastName: "ROUBAULT"
    },
    {
      id: "thomas.prelot",
      email: "thomas.prelot@omneseducation.com",
      firstName: "Thomas",
      lastName: "PRELOT"
    },
    {
      id: "cyril.chalaux",
      email: "cyril.chalaux@omneseducation.com",
      firstName: "Cyril",
      lastName: "CHALAUX"
    },
    {
      id: "kim.hung",
      email: "kim.hung@omneseducation.com",
      firstName: "Kim",
      lastName: "HUNG"
    },
    {
      id: "arnaud.damme",
      email: "arnaud.damme@omneseducation.com",
      firstName: "Arnaud",
      lastName: "DAMME"
    },
    
    // Équipe Opérationnelle
    {
      id: "laouni.zergaoui",
      email: "laouni.zergaoui@omneseducation.com",
      firstName: "Laouni",
      lastName: "ZERGAOUI"
    },
    {
      id: "vincent.doyelle",
      email: "vincent.doyelle@omneseducation.com",
      firstName: "Vincent",
      lastName: "DOYELLE"
    },
    {
      id: "tahar.djemaa",
      email: "tahar.djemaa@omneseducation.com",
      firstName: "Tahar",
      lastName: "DJEMAA"
    },
    {
      id: "babacar.leye",
      email: "babacar.leye@omneseducation.com",
      firstName: "Babacar",
      lastName: "LEYE"
    },
    {
      id: "francois.gille",
      email: "francois.gille@omneseducation.com",
      firstName: "François",
      lastName: "GILLE"
    },
    {
      id: "aurelia.leger",
      email: "aurelia.leger@omneseducation.com",
      firstName: "Aurelia",
      lastName: "LEGER"
    },
    {
      id: "olivier.nerrand",
      email: "olivier.nerrand@omneseducation.com",
      firstName: "Olivier",
      lastName: "NERRAND"
    },
    {
      id: "muzamil.adigun",
      email: "muzamil.adigun@omneseducation.com",
      firstName: "Muzamil",
      lastName: "ADIGUN"
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

  // Create releases based on the user's screenshot
  const createdReleases = await db.insert(releases).values([
    // Active releases
    {
      releaseId: "202504-01",
      name: "Release 202504-01 - Techaway",
      description: "Release Techaway avril 2025",
      status: "in_progress",
      teamId: createdTeams[6].id,
      plannedDate: new Date("2025-04-15"),
      releaseDate: "2025-04-15"
    },
    {
      releaseId: "202505-01",
      name: "Release 202505-01 - Calendriers-Assos",
      description: "Release Calendriers-Assos mai 2025",
      status: "in_progress",
      teamId: createdTeams[0].id,
      plannedDate: new Date("2025-05-15"),
      releaseDate: "2025-05-15"
    },
    {
      releaseId: "202506-03",
      name: "Release 202506-03 - Lot TreLot",
      description: "Release Lot TreLot juin 2025",
      status: "planning",
      teamId: createdTeams[1].id,
      plannedDate: new Date("2025-06-15"),
      releaseDate: "2025-06-15"
    },
    {
      releaseId: "202506-04",
      name: "Release 202506-04 - Nemo",
      description: "Release Nemo juin 2025",
      status: "planning",
      teamId: createdTeams[1].id,
      plannedDate: new Date("2025-06-15"),
      releaseDate: "2025-06-15"
    },
    // Deployed releases (historical)
    {
      releaseId: "202504-03",
      name: "Release 202504-03 - Match'Up",
      description: "Release Match'Up avril 2025",
      status: "deployed",
      teamId: createdTeams[8].id,
      plannedDate: new Date("2025-04-03"),
      releaseDate: "2025-04-03"
    },
    {
      releaseId: "202505-06",
      name: "Release 202505-06 - Match'Up",
      description: "Release Match'Up mai 2025",
      status: "deployed",
      teamId: createdTeams[8].id,
      plannedDate: new Date("2025-05-06"),
      releaseDate: "2025-05-06"
    },
    {
      releaseId: "202504-02",
      name: "Release 202504-02 - Ypareo",
      description: "Release Ypareo avril 2025",
      status: "deployed",
      teamId: createdTeams[7].id,
      plannedDate: new Date("2025-04-02"),
      releaseDate: "2025-04-02"
    },
    {
      releaseId: "202505-12",
      name: "Release 202505-12 - Match'Up",
      description: "Release Match'Up mai 2025",
      status: "deployed",
      teamId: createdTeams[8].id,
      plannedDate: new Date("2025-05-12"),
      releaseDate: "2025-05-12"
    },
    {
      releaseId: "202505-21",
      name: "Release 202505-21 - Match'Up",
      description: "Release Match'Up mai 2025",
      status: "deployed",
      teamId: createdTeams[8].id,
      plannedDate: new Date("2025-05-21"),
      releaseDate: "2025-05-21"
    },
    {
      releaseId: "202505-27",
      name: "Release 202505-27 - Matchup",
      description: "Release Matchup mai 2025",
      status: "deployed",
      teamId: createdTeams[8].id,
      plannedDate: new Date("2025-05-27"),
      releaseDate: "2025-05-27"
    },
    {
      releaseId: "202506-01",
      name: "Release 202506-01 - Lot Egaronne",
      description: "Release Lot Egaronne juin 2025",
      status: "deployed",
      teamId: createdTeams[2].id,
      plannedDate: new Date("2025-06-01"),
      releaseDate: "2025-06-01"
    },
    {
      releaseId: "202505-01",
      name: "Release 202505-01 - Newform",
      description: "Release Newform mai 2025",
      status: "deployed",
      teamId: createdTeams[9].id,
      plannedDate: new Date("2025-05-01"),
      releaseDate: "2025-05-01"
    },
    {
      releaseId: "202505-02",
      name: "Release 202505-02 - Nemo",
      description: "Release Nemo mai 2025",
      status: "deployed",
      teamId: createdTeams[1].id,
      plannedDate: new Date("2025-05-02"),
      releaseDate: "2025-05-02"
    },
    {
      releaseId: "202505-03",
      name: "Release 202505-03 - Nemo [fix]",
      description: "Release Nemo fix mai 2025",
      status: "deployed",
      teamId: createdTeams[1].id,
      plannedDate: new Date("2025-05-03"),
      releaseDate: "2025-05-03"
    },
    {
      releaseId: "202506-05",
      name: "Release 202506-05 - Matchup",
      description: "Release Matchup juin 2025",
      status: "deployed",
      teamId: createdTeams[8].id,
      plannedDate: new Date("2025-06-05"),
      releaseDate: "2025-06-05"
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