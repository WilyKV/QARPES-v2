import { prisma } from "./db";
// @ts-ignore
import process from 'process';

export async function createFixtures() {
  console.log("Creating fixtures...");

  // Suppression des données existantes (ordre pour respecter les contraintes de clés étrangères)
  await prisma.pvFile.deleteMany();
  await prisma.projectPv.deleteMany();
  await prisma.procedure.deleteMany();
  await prisma.commit.deleteMany();
  await prisma.gitRepo.deleteMany();
  await prisma.cab.deleteMany();
  await prisma.projectVersion.deleteMany();
  await prisma.releaseProject.deleteMany();
  await prisma.release.deleteMany();
  await prisma.arb.deleteMany();
  await prisma.project.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  // Création des utilisateurs
  await prisma.user.createMany({
    data: [
      // Équipe Développement - Responsables
      {
        id: "kevin.nicol",
        email: "kevin.nicol@omneseducation.com",
        firstName: "Kevin",
        lastName: "NICOL",
      },
      {
        id: "ivana.lackovic",
        email: "ivana.lackovic@omneseducation.com",
        firstName: "Ivana",
        lastName: "LACKOVIC",
      },

      // Domaine 1 - GASTELLIER Florence
      {
        id: "florence.gastellier",
        email: "fgastellier@omneseducation.com",
        firstName: "Florence",
        lastName: "GASTELLIER",
      },
      {
        id: "guillaume.zavan",
        email: "guillaume.zavan@omneseducation.com",
        firstName: "Guillaume",
        lastName: "ZAVAN",
      },
      {
        id: "sophea.thong",
        email: "sophea.thong@omneseducation.com",
        firstName: "Sophéa",
        lastName: "THONG",
      },
      {
        id: "anas.mersoul",
        email: "anas.mersoul@omneseducation.com",
        firstName: "Anas",
        lastName: "MERSOUL",
      },
      {
        id: "guillaume.ulrich",
        email: "guillaume.ulrich@omneseducation.com",
        firstName: "Guillaume",
        lastName: "ULRICH",
      },
      {
        id: "adrian.gallet",
        email: "adrian.gallet@omneseducation.com",
        firstName: "Adrian",
        lastName: "GALLET",
      },
      {
        id: "mohammed.hazzez",
        email: "mohammed.hazzez@omneseducation.com",
        firstName: "Mohammed",
        lastName: "HAZZEZ",
      },
      {
        id: "lionel.mollard",
        email: "lionel.mollard@omneseducation.com",
        firstName: "Lionel",
        lastName: "MOLLARD",
      },
      {
        id: "nourreddine.berjaoui",
        email: "nourreddine.berjaoui@omneseducation.com",
        firstName: "Nourreddine",
        lastName: "BERJAOUI",
      },
      {
        id: "mohamed.sahraoui",
        email: "mohamed.sahraoui@omneseducation.com",
        firstName: "Mohamed",
        lastName: "SAHRAOUI",
      },
      {
        id: "mehdi.fadili",
        email: "mehdi.fadili@omneseducation.com",
        firstName: "Mehdi",
        lastName: "FADILI",
      },

      // Domaine 2 - HOUDEBINE Stéphanie
      {
        id: "stephanie.houdebine",
        email: "shoudebine@omneseducation.com",
        firstName: "Stéphanie",
        lastName: "HOUDEBINE",
      },
      {
        id: "yannick.meunier",
        email: "yannick.meunier@omneseducation.com",
        firstName: "Yannick",
        lastName: "MEUNIER",
      },
      {
        id: "bertrand.berthomieu",
        email: "bertrand.berthomieu@omneseducation.com",
        firstName: "Bertrand",
        lastName: "BERTHOMIEU",
      },
      {
        id: "hachmi.halfaoui",
        email: "hachmi.halfaoui@omneseducation.com",
        firstName: "Hachmi",
        lastName: "HALFAOUI",
      },
      {
        id: "carole.helene",
        email: "carole.helene@omneseducation.com",
        firstName: "Carole",
        lastName: "HELENE",
      },
      {
        id: "julie.ramadanoski",
        email: "julie.ramadanoski@omneseducation.com",
        firstName: "Julie",
        lastName: "RAMADANOSKI",
      },
      {
        id: "patrick.lopez",
        email: "patrick.lopez@omneseducation.com",
        firstName: "Patrick",
        lastName: "LOPEZ",
      },
      {
        id: "alain.kizil",
        email: "alain.kizil@omneseducation.com",
        firstName: "Alain",
        lastName: "KIZIL",
      },
      {
        id: "frederic.medrano",
        email: "frederic.medrano@omneseducation.com",
        firstName: "Frederic",
        lastName: "MEDRANO",
      },
      {
        id: "steeven.achi",
        email: "steeven.achi@omneseducation.com",
        firstName: "Steeven",
        lastName: "ACHI",
      },
      {
        id: "mohamed.drine",
        email: "mohamed.drine@omneseducation.com",
        firstName: "Mohamed",
        lastName: "DRINE",
      },
      {
        id: "sofiaa.faddi",
        email: "sofiaa.faddi@omneseducation.com",
        firstName: "Sofiaa",
        lastName: "FADDI",
      },
      {
        id: "karim.amdouni",
        email: "karim.amdouni@omneseducation.com",
        firstName: "Karim",
        lastName: "AMDOUNI",
      },
      {
        id: "mody.kane",
        email: "mody.kane@omneseducation.com",
        firstName: "Mody",
        lastName: "KANE",
      },
      {
        id: "mohamed.ali.ksouri",
        email: "mohamed.ali.ksouri@omneseducation.com",
        firstName: "Mohamed Ali",
        lastName: "KSOURI",
      },
      {
        id: "cyrille.satge",
        email: "cyrille.satge@omneseducation.com",
        firstName: "Cyrille",
        lastName: "SATGE",
      },

      // Domaine 3 - BILLON Laurent
      {
        id: "laurent.billon",
        email: "lbillon@omneseducation.com",
        firstName: "Laurent",
        lastName: "BILLON",
      },
      {
        id: "julien.francisco",
        email: "julien.francisco@omneseducation.com",
        firstName: "Julien",
        lastName: "FRANCISCO",
      },
      {
        id: "hajer.saffar",
        email: "hajer.saffar@omneseducation.com",
        firstName: "Hajer",
        lastName: "SAFFAR",
      },
      {
        id: "nicolas.chambaz",
        email: "nicolas.chambaz@omneseducation.com",
        firstName: "Nicolas",
        lastName: "CHAMBAZ",
      },
      {
        id: "camille.camara",
        email: "camille.camara@omneseducation.com",
        firstName: "Camille",
        lastName: "CAMARA",
      },
      {
        id: "amar.bouabbache",
        email: "amar.bouabbache@omneseducation.com",
        firstName: "Amar",
        lastName: "BOUABBACHE",
      },

      // Domaine 4 - CHIOUCHIOU Walid
      {
        id: "walid.chiouchiou",
        email: "wchiouchiou@omneseducation.com",
        firstName: "Walid",
        lastName: "CHIOUCHIOU",
      },
      {
        id: "abdessamad.elouarti",
        email: "abdessamad.elouarti@omneseducation.com",
        firstName: "Abdessamad",
        lastName: "EL OUARTI",
      },
      {
        id: "sebastien.excoffon",
        email: "sebastien.excoffon@omneseducation.com",
        firstName: "Sebastien",
        lastName: "EXCOFFON",
      },
      {
        id: "yacine.mennaa",
        email: "yacine.mennaa@omneseducation.com",
        firstName: "Yacine",
        lastName: "MENNAA",
      },
      {
        id: "vincent.ravanel",
        email: "vincent.ravanel@omneseducation.com",
        firstName: "Vincent",
        lastName: "RAVANEL",
      },

      // Équipe DevSecOps/Transverse
      {
        id: "jacques.roubault",
        email: "jacques.roubault@omneseducation.com",
        firstName: "Jacques",
        lastName: "ROUBAULT",
      },
      {
        id: "thomas.prelot",
        email: "thomas.prelot@omneseducation.com",
        firstName: "Thomas",
        lastName: "PRELOT",
      },
      {
        id: "cyril.chalaux",
        email: "cyril.chalaux@omneseducation.com",
        firstName: "Cyril",
        lastName: "CHALAUX",
      },
      {
        id: "kim.hung",
        email: "kim.hung@omneseducation.com",
        firstName: "Kim",
        lastName: "HUNG",
      },
      {
        id: "arnaud.damme",
        email: "arnaud.damme@omneseducation.com",
        firstName: "Arnaud",
        lastName: "DAMME",
      },

      // Équipe Opérationnelle
      {
        id: "laouni.zergaoui",
        email: "laouni.zergaoui@omneseducation.com",
        firstName: "Laouni",
        lastName: "ZERGAOUI",
      },
      {
        id: "vincent.doyelle",
        email: "vincent.doyelle@omneseducation.com",
        firstName: "Vincent",
        lastName: "DOYELLE",
      },
      {
        id: "tahar.djemaa",
        email: "tahar.djemaa@omneseducation.com",
        firstName: "Tahar",
        lastName: "DJEMAA",
      },
      {
        id: "babacar.leye",
        email: "babacar.leye@omneseducation.com",
        firstName: "Babacar",
        lastName: "LEYE",
      },
      {
        id: "francois.gille",
        email: "francois.gille@omneseducation.com",
        firstName: "François",
        lastName: "GILLE",
      },
      {
        id: "aurelia.leger",
        email: "aurelia.leger@omneseducation.com",
        firstName: "Aurelia",
        lastName: "LEGER",
      },
      {
        id: "olivier.nerrand",
        email: "olivier.nerrand@omneseducation.com",
        firstName: "Olivier",
        lastName: "NERRAND",
      },
      {
        id: "muzamil.adigun",
        email: "muzamil.adigun@omneseducation.com",
        firstName: "Muzamil",
        lastName: "ADIGUN",
      },
    ],
    skipDuplicates: true,
  });
  const usersList = await prisma.user.findMany();

  // Création des équipes
  await prisma.team.createMany({
    data: [
      {
        name: "E2I",
        description: "Équipe E2I - Écosystème d'Innovation Intégré",
        leaderId: "kevin.nicol",
      },
      {
        name: "Nemo",
        description: "Équipe Nemo - Plateforme de gestion étudiante",
        leaderId: "ivana.lackovic",
      },
      {
        name: "Iris",
        description: "Équipe Iris - Interface et systèmes",
        leaderId: "florence.gastellier",
      },
      {
        name: "Carte Étudiante",
        description: "Équipe Carte Étudiante",
        leaderId: "guillaume.zavan",
      },
      {
        name: "EUBS",
        description: "Équipe EUBS - European University Business School",
        leaderId: "sophea.thong",
      },
      {
        name: "Formulaire de Candidature",
        description: "Équipe Formulaire de Candidature",
        leaderId: "anas.mersoul",
      },
      {
        name: "Techaway",
        description: "Équipe Techaway - Solutions techniques",
        leaderId: "guillaume.ulrich",
      },
      {
        name: "Ypareo",
        description: "Équipe Ypareo - Gestion pédagogique",
        leaderId: "adrian.gallet",
      },
      {
        name: "Match'Up",
        description: "Équipe Match'Up - Plateforme de matching",
        leaderId: "mohammed.hazzez",
      },
      {
        name: "Newform Backoffice",
        description: "Équipe Newform Backoffice",
        leaderId: "lionel.mollard",
      },
      {
        name: "NewmanTrek",
        description: "Équipe NewmanTrek - Automatisation des tests",
        leaderId: "nourreddine.berjaoui",
      },
      {
        name: "CodeGhost",
        description: "Équipe CodeGhost - Features d'amélio sans projet",
        leaderId: "mohamed.sahraoui",
      },
    ],
    skipDuplicates: true,
  });
  const teamsList = await prisma.team.findMany();

  // Ajout des membres d'équipe
  for (const team of teamsList) {
    await prisma.teamMember.createMany({
      data: [
        { teamId: team.id, userId: usersList[0].id, role: "leader" },
        { teamId: team.id, userId: usersList[0].id, role: "member" },
        { teamId: team.id, userId: usersList[1].id, role: "member" },
      ],
      skipDuplicates: true,
    });
  }

  // Création des projets
  await prisma.project.createMany({
    data: [
      // E2I
      {
        name: "E2I v1.0.0 - Lot Egoronne",
        description: "Lot Egoronne pour la plateforme E2I",
        status: "production",
        teamId: teamsList[0].id,
        repositoryUrl: "https://github.com/omneseducation/e2i-egoronne",
      },
      {
        name: "E2I v1.0.1 - Lot TreLot",
        description: "Lot TreLot pour la plateforme E2I",
        status: "testing",
        teamId: teamsList[0].id,
        repositoryUrl: "https://github.com/omneseducation/e2i-trelot",
      },
      // Nemo
      {
        name: "Nemo v4.1.0",
        description: "Version 4.1.0 de la plateforme Nemo",
        status: "production",
        teamId: teamsList[1].id,
        repositoryUrl: "https://github.com/omneseducation/nemo",
      },
      {
        name: "Nemo v4.1.1 - fix isActive",
        description: "Correction du bug isActive dans Nemo",
        status: "testing",
        teamId: teamsList[1].id,
        repositoryUrl: "https://github.com/omneseducation/nemo",
      },
      {
        name: "Nemo v4.2.0",
        description: "Version 4.2.0 de la plateforme Nemo",
        status: "development",
        teamId: teamsList[1].id,
        repositoryUrl: "https://github.com/omneseducation/nemo",
      },
      // Iris
      {
        name: "IRIS / WP6 v3.2.0 - Lot Egoronne",
        description: "Lot Egoronne pour IRIS WP6",
        status: "production",
        teamId: teamsList[2].id,
        repositoryUrl: "https://github.com/omneseducation/iris-wp6",
      },
      // EUBS
      {
        name: "EUBS v1.1.0 - Lot Egoronne",
        description: "Lot Egoronne pour EUBS",
        status: "production",
        teamId: teamsList[4].id,
        repositoryUrl: "https://github.com/omneseducation/eubs",
      },
      // Formulaire de Candidature
      {
        name: "Release FDC 2.6.4",
        description: "Version 2.6.4 du Formulaire de Candidature",
        status: "production",
        teamId: teamsList[5].id,
        repositoryUrl: "https://github.com/omneseducation/formulaire-candidature",
      },
      // Techaway
      {
        name: "Techaway v2.0.0",
        description: "Version 2.0.0 de Techaway",
        status: "development",
        teamId: teamsList[6].id,
        repositoryUrl: "https://github.com/omneseducation/techaway",
      },
      // Ypareo
      {
        name: "Ypareo v3.0.1",
        description: "Version 3.0.1 de Ypareo",
        status: "production",
        teamId: teamsList[7].id,
        repositoryUrl: "https://github.com/omneseducation/ypareo",
      },
      // Match'Up
      {
        name: "Match'Up v1.3.6",
        description: "Version 1.3.6 de Match'Up",
        status: "production",
        teamId: teamsList[8].id,
        repositoryUrl: "https://github.com/omneseducation/matchup",
      },
      // Newform Backoffice
      {
        name: "Newform Backoffice v1.0.0",
        description: "Version 1.0.0 du Newform Backoffice",
        status: "testing",
        teamId: teamsList[9].id,
        repositoryUrl: "https://github.com/omneseducation/newform-backoffice",
      },
      // NewmanTrek
      {
        name: "NewmanTrek v1.0.0",
        description: "Version 1.0.0 de NewmanTrek - Automatisation des tests",
        status: "development",
        teamId: teamsList[10].id,
        repositoryUrl: "https://github.com/omneseducation/newman-trek",
      },
    ],
    skipDuplicates: true,
  });
  const projectsList = await prisma.project.findMany();

  // Création des releases (sans teamId, car non présent dans le schéma Prisma)
  // Lors de la création des releases et des versions, utiliser les statuts :
  const releaseStatuses = ["0", "1", "2", "3", "4", "5", "Annulé"];
  await prisma.release.createMany({
    data: [
      {
        releaseId: "202504-01",
        name: "Release 202504-01 - Techaway",
        description: "Release Techaway avril 2025",
        status: "0", // En développement
        recetteDate: new Date("2025-04-10"),
        preprodDate: new Date("2025-04-13"),
        productionDate: new Date("2025-04-15"),
      },
      {
        releaseId: "202505-01",
        name: "Release 202505-01 - Calendriers-Assos",
        description: "Release Calendriers-Assos mai 2025",
        status: "1", // A déployer
        recetteDate: new Date("2025-05-10"),
        preprodDate: new Date("2025-05-13"),
        productionDate: new Date("2025-05-15"),
      },
      {
        releaseId: "202506-03",
        name: "Release 202506-03 - Lot TreLot",
        description: "Release Lot TreLot juin 2025",
        status: "2", // Recette en cours
      },
      {
        releaseId: "202506-04",
        name: "Release 202506-04 - Nemo",
        description: "Release Nemo juin 2025",
        status: "3", // En préproduction
      },
      {
        releaseId: "202504-03",
        name: "Release 202504-03 - Match'Up",
        description: "Release Match'Up avril 2025",
        status: "4", // Mis en production
      },
      {
        releaseId: "202505-06",
        name: "Release 202505-06 - Match'Up",
        description: "Release Match'Up mai 2025",
        status: "4",
      },
      {
        releaseId: "202504-02",
        name: "Release 202504-02 - Ypareo",
        description: "Release Ypareo avril 2025",
        status: "4",
      },
      {
        releaseId: "202505-12",
        name: "Release 202505-12 - Match'Up",
        description: "Release Match'Up mai 2025",
        status: "4",
      },
      {
        releaseId: "202505-21",
        name: "Release 202505-21 - Match'Up",
        description: "Release Match'Up mai 2025",
        status: "4",
      },
      {
        releaseId: "202505-27",
        name: "Release 202505-27 - Matchup",
        description: "Release Matchup mai 2025",
        status: "5", // Merge final
      },
      {
        releaseId: "202506-01",
        name: "Release 202506-01 - Lot Egaronne",
        description: "Release Lot Egaronne juin 2025",
        status: "5",
      },
      {
        releaseId: "202505-01",
        name: "Release 202505-01 - Newform",
        description: "Release Newform mai 2025",
        status: "Annulé",
      },
      {
        releaseId: "202505-02",
        name: "Release 202505-02 - Nemo",
        description: "Release Nemo mai 2025",
        status: "Annulé",
      },
      {
        releaseId: "202505-03",
        name: "Release 202505-03 - Nemo [fix]",
        description: "Release Nemo fix mai 2025",
        status: "Annulé",
      },
      {
        releaseId: "202506-05",
        name: "Release 202506-05 - Matchup",
        description: "Release Matchup juin 2025",
        status: "Annulé",
      },
    ],
    skipDuplicates: true,
  });
  const releasesList = await prisma.release.findMany();

  // Association releases <-> projets (ReleaseProject)
  // Pour chaque release, on associe 2 à 3 projets (pour la démo)
  const releaseProjectData = [];
  for (const release of releasesList) {
    // Associer les 2 ou 3 premiers projets à chaque release (ou random)
    const numProjects = Math.floor(Math.random() * 2) + 2; // 2 ou 3 projets
    const shuffledProjects = [...projectsList].sort(() => 0.5 - Math.random());
    for (const project of shuffledProjects.slice(0, numProjects)) {
      releaseProjectData.push({
        releaseId: release.id,
        projectId: project.id,
      });
    }
  }
  if (releaseProjectData.length > 0) {
    await prisma.releaseProject.createMany({
      data: releaseProjectData,
      skipDuplicates: true,
    });
  }

  // Création des versions de projet, git repos, commits, CAB, procédures, PV, fichiers PV
  for (const project of projectsList.slice(0, 3)) {
    const version = await prisma.projectVersion.create({
      data: {
        projectId: project.id,
        version: "1.0.0",
        status: "production",
        description: `Version 1.0.0 du projet ${project.name}`,
      },
    });

    // Git repos
    const gitRepo1 = await prisma.gitRepo.create({
      data: {
        projectVersionId: version.id,
        name: "backend-api",
        url: `${project.repositoryUrl}/backend`,
        branch: "main",
        lastCommitHash: "abc123def456",
      },
    });
    const gitRepo2 = await prisma.gitRepo.create({
      data: {
        projectVersionId: version.id,
        name: "frontend-app",
        url: `${project.repositoryUrl}/frontend`,
        branch: "main",
        lastCommitHash: "def456ghi789",
      },
    });

    // Commits
    await prisma.commit.createMany({
      data: [
        {
          gitRepoId: gitRepo1.id,
          hash: "abc123def456",
          message: "feat: Add authentication system",
          author: "Pierre Martin",
          authorEmail: "p.martin@omneseducation.com",
          committedAt: new Date("2025-01-10T10:30:00Z"),
        },
        {
          gitRepoId: gitRepo1.id,
          hash: "def456ghi789",
          message: "fix: Resolve database connection issue",
          author: "Sophie Dubois",
          authorEmail: "s.dubois@omneseducation.com",
          committedAt: new Date("2025-01-11T14:20:00Z"),
        },
        {
          gitRepoId: gitRepo2.id,
          hash: "ghi789jkl012",
          message: "feat: Implement user dashboard",
          author: "Demo User",
          authorEmail: "demo.user@omneseducation.com",
          committedAt: new Date("2025-01-12T09:15:00Z"),
        },
      ],
      skipDuplicates: true,
    });

    // CAB
    await prisma.cab.createMany({
      data: [
        {
          projectVersionId: version.id,
          ticketNumber: `CAB-${project.id}-001`,
          title: "Déploiement en production",
          description: "Demande de déploiement de la version 1.0.0 en production",
          status: "approved",
          priority: "high",
          assigneeId: usersList[0].id,
          dueDate: new Date("2025-01-20"),
        },
        {
          projectVersionId: version.id,
          ticketNumber: `CAB-${project.id}-002`,
          title: "Configuration des variables d'environnement",
          description: "Configuration des variables pour l'environnement de production",
          status: "in_progress",
          priority: "medium",
          assigneeId: usersList[1].id,
          dueDate: new Date("2025-01-18"),
        },
      ],
      skipDuplicates: true,
    });

    // Procédures
    const procedureTypes = [
      { type: "environment_variables", title: "Configuration des variables", description: "Configuration des variables d'environnement" },
      { type: "service_verification", title: "Vérification des services", description: "Vérification du bon fonctionnement des services" },
      { type: "command_execution", title: "Exécution des commandes", description: "Exécution des commandes de déploiement" },
      { type: "data_import", title: "Import des données", description: "Import et migration des données" },
    ];
    for (const repo of [gitRepo1, gitRepo2]) {
      for (let index = 0; index < procedureTypes.length; index++) {
        const procType = procedureTypes[index];
        await prisma.procedure.create({
          data: {
            gitRepoId: repo.id,
            type: procType.type,
            title: `${procType.title} - ${repo.name}`,
            description: `${procType.description} pour le repository ${repo.name}`,
            content: {
              steps: [
                `Étape 1 pour ${procType.title}`,
                `Étape 2 pour ${procType.title}`,
                `Étape 3 pour ${procType.title}`,
              ],
              commands: procType.type === "command_execution" ? [
                "npm install",
                "npm run build",
                "npm run deploy",
              ] : [],
              variables: procType.type === "environment_variables" ? {
                DATABASE_URL: "postgresql://...",
                API_KEY: "***",
                NODE_ENV: "production",
              } : {},
            },
            order: index,
            isCompleted: Math.random() > 0.5,
          },
        });
      }
    }

    // PVs et fichiers PV
    const pvTypes = [
      "pv_fonctionnel_recette",
      "pv_metier_recette",
      "pv_conformite_preprod",
      "pv_tests_homologation_preprod",
    ];
    for (const pvType of pvTypes) {
      const pv = await prisma.projectPv.create({
        data: {
          projectVersionId: version.id,
          type: pvType,
          status: Math.random() > 0.5 ? "completed" : "draft",
        },
      });
      await prisma.pvFile.createMany({
        data: [
          {
            pvId: pv.id,
            fileName: `${pvType}_document.pdf`,
            filePath: `/uploads/pvs/${pv.id}/${pvType}_document.pdf`,
            fileSize: 1024567,
            mimeType: "application/pdf",
          },
          {
            pvId: pv.id,
            fileName: `${pvType}_screenshots.zip`,
            filePath: `/uploads/pvs/${pv.id}/${pvType}_screenshots.zip`,
            fileSize: 2048934,
            mimeType: "application/zip",
          },
        ],
        skipDuplicates: true,
      });
    }
  }

  // ARB
  await prisma.arb.createMany({
    data: [
      {
        title: "Accès base de données production",
        description: "Demande d'accès en lecture à la base de données de production pour l'équipe QA",
        type: "access",
        status: "pending",
        requesterId: usersList[2]?.id || usersList[0].id,
        teamId: teamsList[0]?.id || teamsList[0].id,
        projectId: projectsList[0]?.id || projectsList[0].id,
        priority: "high",
        dueDate: new Date("2025-01-25"),
      },
      {
        title: "Budget serveurs cloud",
        description: "Allocation budget pour les serveurs cloud du projet Nemo",
        type: "budget",
        status: "approved",
        requesterId: usersList[1]?.id || usersList[0].id,
        approverId: usersList[0]?.id || usersList[0].id,
        teamId: teamsList[1]?.id || teamsList[0].id,
        projectId: projectsList[2]?.id || projectsList[0].id,
        budget: 500000,
        priority: "medium",
        dueDate: new Date("2025-02-01"),
      },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Fixtures created successfully!");
  console.log(`Created ${teamsList.length} teams`);
  console.log(`Created ${projectsList.length} projects`);
  console.log(`Created ${releasesList.length} releases`);
}

// Correction stricte : n'exécuter le seed que si ce fichier est lancé directement (jamais lors d'un import)
if (typeof process !== 'undefined' && process.argv[1] && import.meta && import.meta.url.endsWith(process.argv[1])) {
  createFixtures()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Erreur lors du seed :", err);
      process.exit(1);
    });
}