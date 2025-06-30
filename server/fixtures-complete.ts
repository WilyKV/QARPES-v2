import { prisma } from "./db";

export async function createCompleteFixtures() {
  console.log("Creating complete fixtures...");

  // Suppression des données existantes (ordre pour respecter les contraintes de clés étrangères)
  await prisma.arb.deleteMany();
  await prisma.pvFile.deleteMany();
  await prisma.projectPv.deleteMany();
  await prisma.procedure.deleteMany();
  await prisma.commit.deleteMany();
  await prisma.projectVersionGitRepo.deleteMany();
  await prisma.gitRepo.deleteMany();
  await prisma.cab.deleteMany();
  await prisma.projectVersion.deleteMany();
  await prisma.releaseProject.deleteMany();
  await prisma.release.deleteMany();
  await prisma.project.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  // Création des utilisateurs
  await prisma.user.createMany({
    data: [
      // Direction & Management
      {
        id: "kevin.nicol",
        email: "kevin.nicol@omneseducation.com",
        firstName: "Kevin",
        lastName: "NICOL",
        role: "admin",
        profileImageUrl: "https://avatar.vercel.sh/kevin.nicol",
      },
      {
        id: "ivana.lackovic",
        email: "ivana.lackovic@omneseducation.com",
        firstName: "Ivana",
        lastName: "LACKOVIC",
        role: "manager",
        profileImageUrl: "https://avatar.vercel.sh/ivana.lackovic",
      },
      {
        id: "florence.gastellier",
        email: "fgastellier@omneseducation.com",
        firstName: "Florence",
        lastName: "GASTELLIER",
        role: "manager",
        profileImageUrl: "https://avatar.vercel.sh/florence.gastellier",
      },
      {
        id: "guillaume.zavan",
        email: "guillaume.zavan@omneseducation.com",
        firstName: "Guillaume",
        lastName: "ZAVAN",
        role: "dev",
        profileImageUrl: "https://avatar.vercel.sh/guillaume.zavan",
      },
      {
        id: "sophea.thong",
        email: "sophea.thong@omneseducation.com",
        firstName: "Sophea",
        lastName: "THONG",
        role: "dev",
        profileImageUrl: "https://avatar.vercel.sh/sophea.thong",
      },
      {
        id: "anas.mersoul",
        email: "anas.mersoul@omneseducation.com",
        firstName: "Anas",
        lastName: "MERSOUL",
        role: "dev",
        profileImageUrl: "https://avatar.vercel.sh/anas.mersoul",
      },
      {
        id: "lucas.sahraoui",
        email: "lucas.sahraoui@omneseducation.com",
        firstName: "Lucas",
        lastName: "SAHRAOUI",
        role: "dev",
        profileImageUrl: "https://avatar.vercel.sh/lucas.sahraoui",
      },
      {
        id: "mehdi.fadili",
        email: "mehdi.fadili@omneseducation.com",
        firstName: "Mehdi",
        lastName: "FADILI",
        role: "dev",
        profileImageUrl: "https://avatar.vercel.sh/mehdi.fadili",
      },
      {
        id: "stephanie.houdebine",
        email: "shoudebine@omneseducation.com",
        firstName: "Stéphanie",
        lastName: "HOUDEBINE",
        role: "manager",
        profileImageUrl: "https://avatar.vercel.sh/stephanie.houdebine",
      },
      {
        id: "yannick.meunier",
        email: "yannick.meunier@omneseducation.com",
        firstName: "Yannick",
        lastName: "MEUNIER",
        role: "dev",
        profileImageUrl: "https://avatar.vercel.sh/yannick.meunier",
      },
      {
        id: "bertrand.berthomieu",
        email: "bertrand.berthomieu@omneseducation.com",
        firstName: "Bertrand",
        lastName: "BERTHOMIEU",
        role: "dev",
        profileImageUrl: "https://avatar.vercel.sh/bertrand.berthomieu",
      },
      {
        id: "hachmi.halfaoui",
        email: "hachmi.halfaoui@omneseducation.com",
        firstName: "Hachmi",
        lastName: "HALFAOUI",
        role: "dev",
        profileImageUrl: "https://avatar.vercel.sh/hachmi.halfaoui",
      },
      {
        id: "carole.helene",
        email: "carole.helene@omneseducation.com",
        firstName: "Carole",
        lastName: "HELENE",
        role: "ops",
        profileImageUrl: "https://avatar.vercel.sh/carole.helene",
      },
      {
        id: "julie.ramadanoski",
        email: "julie.ramadanoski@omneseducation.com",
        firstName: "Julie",
        lastName: "RAMADANOSKI",
        role: "ops",
        profileImageUrl: "https://avatar.vercel.sh/julie.ramadanoski",
      },
      {
        id: "patrick.lopez",
        email: "patrick.lopez@omneseducation.com",
        firstName: "Patrick",
        lastName: "LOPEZ",
        role: "dev",
        profileImageUrl: "https://avatar.vercel.sh/patrick.lopez",
      },
      {
        id: "guillaume.ulrich",
        email: "guillaume.ulrich@omneseducation.com",
        firstName: "Guillaume",
        lastName: "ULRICH",
        role: "dev",
        profileImageUrl: "https://avatar.vercel.sh/guillaume.ulrich",
      },
      {
        id: "cyrille.satge",
        email: "cyrille.satge@omneseducation.com",
        firstName: "Cyrille",
        lastName: "SATGE",
        role: "dev",
        profileImageUrl: "https://avatar.vercel.sh/cyrille.satge",
      },
      {
        id: "laurent.billon",
        email: "lbillon@omneseducation.com",
        firstName: "Laurent",
        lastName: "BILLON",
        role: "manager",
        profileImageUrl: "https://avatar.vercel.sh/laurent.billon",
      },
      {
        id: "julien.francisco",
        email: "julien.francisco@omneseducation.com",
        firstName: "Julien",
        lastName: "FRANCISCO",
        role: "dev",
        profileImageUrl: "https://avatar.vercel.sh/julien.francisco",
      },
      {
        id: "hajer.saffar",
        email: "hajer.saffar@omneseducation.com",
        firstName: "Hajer",
        lastName: "SAFFAR",
        role: "dev",
        profileImageUrl: "https://avatar.vercel.sh/hajer.saffar",
      },
      {
        id: "nicolas.chambaz",
        email: "nicolas.chambaz@omneseducation.com",
        firstName: "Nicolas",
        lastName: "CHAMBAZ",
        role: "dev",
        profileImageUrl: "https://avatar.vercel.sh/nicolas.chambaz",
      },
      {
        id: "camille.camara",
        email: "camille.camara@omneseducation.com",
        firstName: "Camille",
        lastName: "CAMARA",
        role: "dev",
        profileImageUrl: "https://avatar.vercel.sh/camille.camara",
      },
      {
        id: "amar.bouabbache",
        email: "amar.bouabbache@omneseducation.com",
        firstName: "Amar",
        lastName: "BOUABBACHE",
        role: "dev",
        profileImageUrl: "https://avatar.vercel.sh/amar.bouabbache",
      },
      {
        id: "walid.chiouchiou",
        email: "wchiouchiou@omneseducation.com",
        firstName: "Walid",
        lastName: "CHIOUCHIOU",
        role: "manager",
        profileImageUrl: "https://avatar.vercel.sh/walid.chiouchiou",
      },
      {
        id: "yannis.boudendorf",
        email: "yannis.boudendorf@omneseducation.com",
        firstName: "Yannis",
        lastName: "BOUDENDORF",
        role: "dev",
        profileImageUrl: "https://avatar.vercel.sh/yannis.boudendorf",
      },
      {
        id: "amandine.bourdon",
        email: "amandine.bourdon@omneseducation.com",
        firstName: "Amandine",
        lastName: "BOURDON",
        role: "dev",
        profileImageUrl: "https://avatar.vercel.sh/amandine.bourdon",
      },
      {
        id: "lucas.nerrand",
        email: "lucas.nerrand@omneseducation.com",
        firstName: "Lucas",
        lastName: "NERRAND",
        role: "dev",
        profileImageUrl: "https://avatar.vercel.sh/lucas.nerrand",
      },
      {
        id: "muzamil.adigun",
        email: "muzamil.adigun@omneseducation.com",
        firstName: "Muzamil",
        lastName: "ADIGUN",
        role: "dev",
        profileImageUrl: "https://avatar.vercel.sh/muzamil.adigun",
      },
      {
        id: "jacques.roubault",
        email: "jacques.roubault@omneseducation.com",
        firstName: "Jacques",
        lastName: "ROUBAULT",
        role: "ops",
        profileImageUrl: "https://avatar.vercel.sh/jacques.roubault",
      },
      {
        id: "thomas.prelot",
        email: "thomas.prelot@omneseducation.com",
        firstName: "Thomas",
        lastName: "PRELOT",
        role: "ops",
        profileImageUrl: "https://avatar.vercel.sh/thomas.prelot",
      },
      {
        id: "cyril.chalaux",
        email: "cyril.chalaux@omneseducation.com",
        firstName: "Cyril",
        lastName: "CHALAUX",
        role: "ops",
        profileImageUrl: "https://avatar.vercel.sh/cyril.chalaux",
      },
      {
        id: "aurelia.leger",
        email: "aurelia.leger@omneseducation.com",
        firstName: "Aurelia",
        lastName: "LEGER",
        role: "qa",
        profileImageUrl: "https://avatar.vercel.sh/aurelia.leger",
      },
      {
        id: "francois.gille",
        email: "francois.gille@omneseducation.com",
        firstName: "François",
        lastName: "GILLE",
        role: "qa",
        profileImageUrl: "https://avatar.vercel.sh/francois.gille",
      },
    ],
    skipDuplicates: true,
  });

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
        description: "Équipe Carte Étudiante - Gestion des badges et accès",
        leaderId: "guillaume.zavan",
      },
      {
        name: "EUBS",
        description: "Équipe EUBS - European University Business School",
        leaderId: "sophea.thong",
      },
      {
        name: "Formulaire de Candidature",
        description: "Équipe Formulaire de Candidature - Processus d'admission",
        leaderId: "anas.mersoul",
      },
      {
        name: "Techaway",
        description: "Équipe Techaway - Solutions techniques et formations",
        leaderId: "guillaume.ulrich",
      },
      {
        name: "Ypareo",
        description: "Équipe Ypareo - Système de gestion de l'apprentissage",
        leaderId: "stephanie.houdebine",
      },
      {
        name: "Match'Up",
        description: "Équipe Match'Up - Plateforme de matching étudiants-entreprises",
        leaderId: "laurent.billon",
      },
      {
        name: "Plateforme OMNES",
        description: "Équipe Plateforme OMNES - Plateforme institutionnelle",
        leaderId: "walid.chiouchiou",
      },
      {
        name: "DevOps",
        description: "Équipe DevOps - Infrastructure et déploiements",
        leaderId: "jacques.roubault",
      },
      {
        name: "QA",
        description: "Équipe QA - Tests et qualité",
        leaderId: "aurelia.leger",
      },
    ],
    skipDuplicates: true,
  });

  const teamsList = await prisma.team.findMany();

  // Création des membres d'équipe
  await prisma.teamMember.createMany({
    data: [
      // E2I Team
      { teamId: teamsList[0].id, userId: "kevin.nicol", role: "lead" },
      { teamId: teamsList[0].id, userId: "guillaume.zavan", role: "senior" },
      { teamId: teamsList[0].id, userId: "sophea.thong", role: "member" },
      
      // Nemo Team
      { teamId: teamsList[1].id, userId: "ivana.lackovic", role: "lead" },
      { teamId: teamsList[1].id, userId: "anas.mersoul", role: "senior" },
      { teamId: teamsList[1].id, userId: "lucas.sahraoui", role: "member" },
      { teamId: teamsList[1].id, userId: "mehdi.fadili", role: "member" },
      
      // Iris Team
      { teamId: teamsList[2].id, userId: "florence.gastellier", role: "lead" },
      { teamId: teamsList[2].id, userId: "yannick.meunier", role: "senior" },
      { teamId: teamsList[2].id, userId: "bertrand.berthomieu", role: "member" },
      
      // Carte Étudiante Team
      { teamId: teamsList[3].id, userId: "guillaume.zavan", role: "lead" },
      { teamId: teamsList[3].id, userId: "patrick.lopez", role: "senior" },
      
      // EUBS Team
      { teamId: teamsList[4].id, userId: "sophea.thong", role: "lead" },
      { teamId: teamsList[4].id, userId: "cyrille.satge", role: "member" },
      
      // Formulaire de Candidature Team
      { teamId: teamsList[5].id, userId: "anas.mersoul", role: "lead" },
      { teamId: teamsList[5].id, userId: "lucas.sahraoui", role: "member" },
      
      // Techaway Team
      { teamId: teamsList[6].id, userId: "guillaume.ulrich", role: "lead" },
      { teamId: teamsList[6].id, userId: "yannis.boudendorf", role: "senior" },
      { teamId: teamsList[6].id, userId: "amandine.bourdon", role: "member" },
      
      // Ypareo Team
      { teamId: teamsList[7].id, userId: "stephanie.houdebine", role: "lead" },
      { teamId: teamsList[7].id, userId: "hachmi.halfaoui", role: "senior" },
      { teamId: teamsList[7].id, userId: "carole.helene", role: "member" },
      { teamId: teamsList[7].id, userId: "julie.ramadanoski", role: "member" },
      
      // Match'Up Team
      { teamId: teamsList[8].id, userId: "laurent.billon", role: "lead" },
      { teamId: teamsList[8].id, userId: "julien.francisco", role: "senior" },
      { teamId: teamsList[8].id, userId: "hajer.saffar", role: "member" },
      { teamId: teamsList[8].id, userId: "nicolas.chambaz", role: "member" },
      { teamId: teamsList[8].id, userId: "camille.camara", role: "member" },
      { teamId: teamsList[8].id, userId: "amar.bouabbache", role: "member" },
      
      // Plateforme OMNES Team  
      { teamId: teamsList[9].id, userId: "walid.chiouchiou", role: "lead" },
      { teamId: teamsList[9].id, userId: "yannis.boudendorf", role: "senior" },
      { teamId: teamsList[9].id, userId: "amandine.bourdon", role: "member" },
      { teamId: teamsList[9].id, userId: "lucas.nerrand", role: "member" },
      { teamId: teamsList[9].id, userId: "muzamil.adigun", role: "member" },
      
      // DevOps Team
      { teamId: teamsList[10].id, userId: "jacques.roubault", role: "lead" },
      { teamId: teamsList[10].id, userId: "thomas.prelot", role: "senior" },
      { teamId: teamsList[10].id, userId: "cyril.chalaux", role: "member" },
      
      // QA Team
      { teamId: teamsList[11].id, userId: "aurelia.leger", role: "lead" },
      { teamId: teamsList[11].id, userId: "francois.gille", role: "member" },
    ],
    skipDuplicates: true,
  });

  // Création des projets
  await prisma.project.createMany({
    data: [
      {
        name: "E2I - Egaronne",
        description: "E2I - Ecole d'ingénieur Egaronne - Plateforme de gestion académique et administrative complète",
        status: "production",
        teamId: teamsList[0].id,
        repositoryUrl: "https://github.com/omneseducation/e2i-egaronne",
      },
      {
        name: "Nemo",
        description: "Plateforme de gestion étudiante - Suivi des parcours académiques et évaluations",
        status: "production",
        teamId: teamsList[1].id,
        repositoryUrl: "https://github.com/omneseducation/nemo",
      },
      {
        name: "IRIS / WP6",
        description: "Interface de gestion des ressources et systèmes intégrés",
        status: "production",
        teamId: teamsList[2].id,
        repositoryUrl: "https://github.com/omneseducation/iris-wp6",
      },
      {
        name: "Carte Étudiante",
        description: "Système de gestion des cartes étudiantes et badges d'accès",
        status: "testing",
        teamId: teamsList[3].id,
        repositoryUrl: "https://github.com/omneseducation/carte-etudiante",
      },
      {
        name: "EUBS",
        description: "European University Business School - Plateforme académique spécialisée",
        status: "development",
        teamId: teamsList[4].id,
        repositoryUrl: "https://github.com/omneseducation/eubs",
      },
      {
        name: "FDC",
        description: "Formulaire de Candidature - Processus d'admission en ligne",
        status: "production",
        teamId: teamsList[5].id,
        repositoryUrl: "https://github.com/omneseducation/formulaire-candidature",
      },
      {
        name: "Techaway",
        description: "Plateforme de formation technique et certification",
        status: "development",
        teamId: teamsList[6].id,
        repositoryUrl: "https://github.com/omneseducation/techaway",
      },
      {
        name: "Ypareo",
        description: "Système de gestion de l'apprentissage et alternance",
        status: "production",
        teamId: teamsList[7].id,
        repositoryUrl: "https://github.com/omneseducation/ypareo",
      },
      {
        name: "Match'Up",
        description: "Plateforme de matching étudiants-entreprises",
        status: "production",
        teamId: teamsList[8].id,
        repositoryUrl: "https://github.com/omneseducation/matchup",
      },
      {
        name: "Plateforme OMNES",
        description: "Plateforme institutionnelle unifiée OMNES Education",
        status: "preproduction",
        teamId: teamsList[9].id,
        repositoryUrl: "https://github.com/omneseducation/plateforme-omnes",
      },
    ],
    skipDuplicates: true,
  });

  const projectsList = await prisma.project.findMany();

  // Création des releases avec dates réalistes et statuts cohérents
  await prisma.release.createMany({
    data: [
      {
        releaseId: "202411-01",
        name: "Release Novembre 2024 - Corrections urgentes",
        description: "Corrections de bugs critiques avant les vacances de fin d'année",
        status: "5", // Merge final
        recetteDate: new Date("2024-11-10"),
        preprodDate: new Date("2024-11-15"),
        productionDate: new Date("2024-11-20"),
      },
      {
        releaseId: "202412-01",
        name: "Release Décembre 2024 - Stabilisation",
        description: "Release de stabilisation de fin d'année",
        status: "5", // Merge final
        recetteDate: new Date("2024-12-05"),
        preprodDate: new Date("2024-12-10"),
        productionDate: new Date("2024-12-15"),
      },
      {
        releaseId: "202501-01",
        name: "Release Janvier 2025 - Nouvelles fonctionnalités",
        description: "Déploiement des nouvelles fonctionnalités développées en fin 2024",
        status: "4", // Mis en production
        recetteDate: new Date("2025-01-08"),
        preprodDate: new Date("2025-01-13"),
        productionDate: new Date("2025-01-18"),
      },
      {
        releaseId: "202502-01",
        name: "Release Février 2025 - Hotfixes",
        description: "Corrections de bugs post-déploiement janvier",
        status: "5", // Merge final
        recetteDate: new Date("2025-02-03"),
        preprodDate: new Date("2025-02-08"),
        productionDate: new Date("2025-02-13"),
      },
      {
        releaseId: "202503-01",
        name: "Release Mars 2025 - Améliorations UX",
        description: "Améliorations de l'expérience utilisateur",
        status: "4", // Mis en production
        recetteDate: new Date("2025-03-05"),
        preprodDate: new Date("2025-03-10"),
        productionDate: new Date("2025-03-15"),
      },
      {
        releaseId: "202504-01",
        name: "Release Avril 2025 - Nouvelles API",
        description: "Déploiement des nouvelles APIs REST",
        status: "4", // Mis en production
        recetteDate: new Date("2025-04-07"),
        preprodDate: new Date("2025-04-12"),
        productionDate: new Date("2025-04-17"),
      },
      {
        releaseId: "202505-01",
        name: "Release Mai 2025 - Sécurité",
        description: "Renforcement de la sécurité et mise à jour des dépendances",
        status: "4", // Mis en production
        recetteDate: new Date("2025-05-05"),
        preprodDate: new Date("2025-05-10"),
        productionDate: new Date("2025-05-15"),
      },
      {
        releaseId: "202506-01",
        name: "Release Juin 2025 - Mobile First",
        description: "Refonte mobile-first et amélioration de l'UX",
        status: "3", // En préproduction
        recetteDate: new Date("2025-06-02"),
        preprodDate: new Date("2025-06-07"),
        productionDate: new Date("2025-06-12"),
      },
      {
        releaseId: "202506-02",
        name: "Release Juin 2025 - API v2",
        description: "Nouvelle version de l'API REST avec documentation Swagger",
        status: "2", // Recette en cours
        recetteDate: new Date("2025-06-09"),
        preprodDate: new Date("2025-06-14"),
        productionDate: new Date("2025-06-19"),
      },
      {
        releaseId: "202507-01",
        name: "Release Juillet 2025 - IA Intégration",
        description: "Intégration des fonctionnalités d'intelligence artificielle",
        status: "1", // À déployer
        recetteDate: new Date("2025-07-01"),
        preprodDate: new Date("2025-07-06"),
        productionDate: new Date("2025-07-11"),
      },
      {
        releaseId: "202507-02",
        name: "Release Juillet 2025 - Analytics",
        description: "Nouveau module d'analytics et reporting avancé",
        status: "0", // En développement
        recetteDate: new Date("2025-07-15"),
        preprodDate: new Date("2025-07-20"),
        productionDate: new Date("2025-07-25"),
      },
      {
        releaseId: "202508-01",
        name: "Release Août 2025 - Performance",
        description: "Optimisation des performances et amélioration de la scalabilité",
        status: "0", // En développement
        recetteDate: new Date("2025-08-05"),
        preprodDate: new Date("2025-08-10"),
        productionDate: new Date("2025-08-15"),
      },
      {
        releaseId: "202508-02",
        name: "Release Août 2025 - Monitoring",
        description: "Amélioration du monitoring et alerting",
        status: "0", // En développement
        recetteDate: new Date("2025-08-12"),
        preprodDate: new Date("2025-08-17"),
        productionDate: new Date("2025-08-22"),
      },
      {
        releaseId: "202509-01",
        name: "Release Septembre 2025 - Refactoring",
        description: "Refactoring majeur du code legacy",
        status: "0", // En développement
        recetteDate: new Date("2025-09-02"),
        preprodDate: new Date("2025-09-07"),
        productionDate: new Date("2025-09-12"),
      },
      {
        releaseId: "202510-01",
        name: "Release Octobre 2025 - Features Q4",
        description: "Nouvelles fonctionnalités pour le Q4",
        status: "0", // En développement
        recetteDate: new Date("2025-10-07"),
        preprodDate: new Date("2025-10-12"),
        productionDate: new Date("2025-10-17"),
      },
      {
        releaseId: "202505-03",
        name: "Release Mai 2025 - Features expérimentales",
        description: "Features expérimentales annulées suite aux retours utilisateurs",
        status: "Annulé",
        recetteDate: null,
        preprodDate: null,
        productionDate: null,
      },
      {
        releaseId: "202506-03",
        name: "Release Juin 2025 - Projet pilote",
        description: "Projet pilote annulé pour cause de restructuration",
        status: "Annulé",
        recetteDate: null,
        preprodDate: null,
        productionDate: null,
      },
    ],
    skipDuplicates: true,
  });

  const releasesList = await prisma.release.findMany();

  // Création des associations release-projet
  await prisma.releaseProject.createMany({
    data: [
      // Associer les projets aux releases
      { releaseId: releasesList[0].id, projectId: projectsList[0].id }, // E2I à Release Novembre
      { releaseId: releasesList[0].id, projectId: projectsList[1].id }, // Nemo à Release Novembre
      { releaseId: releasesList[1].id, projectId: projectsList[2].id }, // Iris à Release Décembre
      { releaseId: releasesList[2].id, projectId: projectsList[3].id }, // Carte Étudiante à Release Janvier
      { releaseId: releasesList[3].id, projectId: projectsList[4].id }, // EUBS à Release Février
    ],
    skipDuplicates: true,
  });

  // Création des versions de projet (format X.Y.Z strict)
  await prisma.projectVersion.createMany({
    data: [
      // E2I versions
      {
        projectId: projectsList[0].id,
        version: "1.0.0",
        description: "Version initiale E2I Egaronne",
        status: "production",
        releaseId: releasesList[0].id,
        isActive: false,
      },
      {
        projectId: projectsList[0].id,
        version: "1.0.1",
        description: "Corrections mineures E2I",
        status: "production",
        releaseId: releasesList[0].id,
        isActive: false,
      },
      {
        projectId: projectsList[0].id,
        version: "1.1.0",
        description: "Nouvelles fonctionnalités E2I",
        status: "testing",
        releaseId: releasesList[1].id,
        isActive: true,
      },
      // Nemo versions
      {
        projectId: projectsList[1].id,
        version: "4.1.0",
        description: "Version stable Nemo",
        status: "production",
        releaseId: releasesList[0].id,
        isActive: false,
      },
      {
        projectId: projectsList[1].id,
        version: "4.1.1",
        description: "Corrections Nemo isActive",
        status: "production",
        releaseId: releasesList[0].id,
        isActive: false,
      },
      {
        projectId: projectsList[1].id,
        version: "4.2.0",
        description: "Nouvelles fonctionnalités Nemo",
        status: "production",
        releaseId: releasesList[1].id,
        isActive: false,
      },
      {
        projectId: projectsList[1].id,
        version: "4.3.0",
        description: "Version majeure Nemo",
        status: "development",
        releaseId: releasesList[2].id,
        isActive: true,
      },
      // Iris versions
      {
        projectId: projectsList[2].id,
        version: "3.2.0",
        description: "Version stable Iris",
        status: "production",
        releaseId: releasesList[0].id,
        isActive: false,
      },
      {
        projectId: projectsList[2].id,
        version: "3.2.1",
        description: "Hotfix Iris AD",
        status: "production",
        releaseId: releasesList[1].id,
        isActive: false,
      },
      {
        projectId: projectsList[2].id,
        version: "4.0.0",
        description: "Version majeure Iris",
        status: "testing",
        releaseId: releasesList[2].id,
        isActive: true,
      },
      // Autres projets
      {
        projectId: projectsList[3].id,
        version: "1.1.0",
        description: "Améliorations Carte Étudiante",
        status: "testing",
        releaseId: releasesList[2].id,
        isActive: true,
      },
      {
        projectId: projectsList[4].id,
        version: "2.0.0",
        description: "Version majeure EUBS",
        status: "development",
        releaseId: releasesList[3].id,
        isActive: true,
      },
      {
        projectId: projectsList[5].id,
        version: "2.6.4",
        description: "Version stable FDC",
        status: "production",
        releaseId: releasesList[0].id,
        isActive: true,
      },
      {
        projectId: projectsList[6].id,
        version: "2.0.0",
        description: "Version 2.0 Techaway",
        status: "development",
        releaseId: releasesList[3].id,
        isActive: true,
      },
      {
        projectId: projectsList[7].id,
        version: "3.0.1",
        description: "Corrections Ypareo",
        status: "testing",
        releaseId: releasesList[2].id,
        isActive: true,
      },
      {
        projectId: projectsList[8].id,
        version: "1.9.0",
        description: "Nouvelles fonctionnalités Match'Up",
        status: "production",
        releaseId: releasesList[1].id,
        isActive: true,
      },
      {
        projectId: projectsList[9].id,
        version: "1.0.0",
        description: "Version initiale Plateforme OMNES",
        status: "preproduction",
        releaseId: releasesList[2].id,
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  const versionsList = await prisma.projectVersion.findMany();

  // Création des repositories Git
  await prisma.gitRepo.createMany({
    data: [
      {
        name: "e2i-frontend",
        url: "https://github.com/omneseducation/e2i-frontend.git",
        branch: "main",
        lastCommitHash: "abc123ef",
      },
      {
        name: "e2i-backend",
        url: "https://github.com/omneseducation/e2i-backend.git",
        branch: "develop",
        lastCommitHash: "def456gh",
      },
      {
        name: "nemo-core",
        url: "https://github.com/omneseducation/nemo-core.git",
        branch: "main",
        lastCommitHash: "ghi789jk",
      },
      {
        name: "nemo-api",
        url: "https://github.com/omneseducation/nemo-api.git",
        branch: "main",
        lastCommitHash: "jkl012mn",
      },
      {
        name: "iris-vision",
        url: "https://github.com/omneseducation/iris-vision.git",
        branch: "main",
        lastCommitHash: "mno345pq",
      },
      {
        name: "iris-backend",
        url: "https://github.com/omneseducation/iris-backend.git",
        branch: "main",
        lastCommitHash: "pqr678st",
      },
      {
        name: "carte-etudiante",
        url: "https://github.com/omneseducation/carte-etudiante.git",
        branch: "main",
        lastCommitHash: "stu901vw",
      },
      {
        name: "eubs-system",
        url: "https://github.com/omneseducation/eubs.git",
        branch: "develop",
        lastCommitHash: "vwx234yz",
      },
      {
        name: "formulaire-candidature",
        url: "https://github.com/omneseducation/fdc.git",
        branch: "main",
        lastCommitHash: "yza567bc",
      },
      {
        name: "techaway-platform",
        url: "https://github.com/omneseducation/techaway.git",
        branch: "develop",
        lastCommitHash: "bcd890ef",
      },
    ],
    skipDuplicates: true,
  });

  const reposList = await prisma.gitRepo.findMany();

  // Création des associations version-repository
  await prisma.projectVersionGitRepo.createMany({
    data: [
      // E2I associations
      { projectVersionId: versionsList[0].id, gitRepoId: reposList[0].id }, // E2I 1.0.0 -> frontend
      { projectVersionId: versionsList[0].id, gitRepoId: reposList[1].id }, // E2I 1.0.0 -> backend
      { projectVersionId: versionsList[2].id, gitRepoId: reposList[0].id }, // E2I 1.1.0 -> frontend
      { projectVersionId: versionsList[2].id, gitRepoId: reposList[1].id }, // E2I 1.1.0 -> backend
      
      // Nemo associations
      { projectVersionId: versionsList[3].id, gitRepoId: reposList[2].id }, // Nemo 4.1.0 -> core
      { projectVersionId: versionsList[5].id, gitRepoId: reposList[2].id }, // Nemo 4.2.0 -> core
      { projectVersionId: versionsList[5].id, gitRepoId: reposList[3].id }, // Nemo 4.2.0 -> api
      { projectVersionId: versionsList[6].id, gitRepoId: reposList[2].id }, // Nemo 4.3.0 -> core
      { projectVersionId: versionsList[6].id, gitRepoId: reposList[3].id }, // Nemo 4.3.0 -> api
      
      // Iris associations
      { projectVersionId: versionsList[7].id, gitRepoId: reposList[4].id }, // Iris 3.2.0 -> vision
      { projectVersionId: versionsList[9].id, gitRepoId: reposList[4].id }, // Iris 4.0.0 -> vision
      { projectVersionId: versionsList[9].id, gitRepoId: reposList[5].id }, // Iris 4.0.0 -> backend
      
      // Autres associations
      { projectVersionId: versionsList[10].id, gitRepoId: reposList[6].id }, // Carte Étudiante
      { projectVersionId: versionsList[11].id, gitRepoId: reposList[7].id }, // EUBS
      { projectVersionId: versionsList[12].id, gitRepoId: reposList[8].id }, // FDC
      { projectVersionId: versionsList[13].id, gitRepoId: reposList[9].id }, // Techaway
    ],
    skipDuplicates: true,
  });

  const associationsList = await prisma.projectVersionGitRepo.findMany();

  // Création de quelques procédures d'exemple
  await prisma.procedure.createMany({
    data: [
      {
        versionGitRepoId: associationsList[0].id,
        type: "environment_variables",
        title: "Variables d'environnement E2I Frontend",
        description: "Configuration des variables pour E2I frontend v1.0.0",
        content: JSON.stringify({
          variables: [
            { name: "DATABASE_URL", value: "postgresql://localhost:5432/e2i", description: "URL de la base de données" },
            { name: "API_KEY", value: "e2i-api-key-123", description: "Clé API externe" },
            { name: "REDIS_URL", value: "redis://localhost:6379", description: "URL Redis pour le cache" },
          ]
        }),
        order: 1,
      },
      {
        versionGitRepoId: associationsList[5].id,
        type: "service_verification",
        title: "Vérification des services Nemo",
        description: "Vérifications pour Nemo v4.2.0",
        content: JSON.stringify({
          checks: [
            { service: "Database PostgreSQL", status: "OK", url: "postgresql://nemo-db:5432" },
            { service: "Redis Cache", status: "OK", url: "redis://nemo-cache:6379" },
            { service: "External API", status: "WARNING", url: "https://api.external.com/v1" },
            { service: "File Storage", status: "OK", path: "/var/nemo/uploads" },
          ]
        }),
        order: 1,
      },
      {
        versionGitRepoId: associationsList[10].id,
        type: "command_execution",
        title: "Commandes de déploiement Iris",
        description: "Commandes pour déployer Iris v4.0.0",
        content: JSON.stringify({
          commands: [
            { step: 1, command: "docker build -t iris-vision:4.0.0 .", description: "Construction de l'image Docker" },
            { step: 2, command: "docker-compose up -d", description: "Démarrage des services" },
            { step: 3, command: "python manage.py migrate", description: "Application des migrations" },
            { step: 4, command: "python manage.py collectstatic", description: "Collection des fichiers statiques" },
          ]
        }),
        order: 1,
      },
    ],
    skipDuplicates: true,
  });

  // Création de quelques commits d'exemple
  await prisma.commit.createMany({
    data: [
      {
        versionGitRepoId: associationsList[0].id, // E2I frontend 1.0.0
        hash: "abc123ef",
        message: "feat: ajout du composant de navigation principal",
        author: "Kevin NICOL",
        authorEmail: "kevin.nicol@omneseducation.com",
        committedAt: new Date("2025-01-10T10:30:00Z"),
      },
      {
        versionGitRepoId: associationsList[4].id, // Nemo core 4.1.0
        hash: "ghi789jk",
        message: "fix: correction du bug isActive dans le service utilisateur",
        author: "Ivana LACKOVIC",
        authorEmail: "ivana.lackovic@omneseducation.com",
        committedAt: new Date("2025-01-12T14:15:00Z"),
      },
      {
        versionGitRepoId: associationsList[8].id, // Iris vision 4.0.0
        hash: "mno345pq",
        message: "refactor: refactorisation du module de vision artificielle",
        author: "Florence GASTELLIER",
        authorEmail: "fgastellier@omneseducation.com",
        committedAt: new Date("2025-01-15T09:45:00Z"),
      },
    ],
    skipDuplicates: true,
  });

  const totalUsers = await prisma.user.count();
  const totalTeams = await prisma.team.count();
  const totalProjects = await prisma.project.count();
  const totalVersions = await prisma.projectVersion.count();
  const totalRepos = await prisma.gitRepo.count();
  const totalReleases = await prisma.release.count();
  const totalAssociations = await prisma.projectVersionGitRepo.count();
  const totalProcedures = await prisma.procedure.count();

  console.log("✅ Fixtures complètes créées avec succès !");
  console.log(`- ${totalUsers} utilisateurs créés`);
  console.log(`- ${totalTeams} équipes créées avec leurs membres`);
  console.log(`- ${totalProjects} projets créés`);
  console.log(`- ${totalVersions} versions créées (format X.Y.Z)`);
  console.log(`- ${totalRepos} repositories Git créés`);
  console.log(`- ${totalReleases} releases créées (tous statuts 0-5 + Annulé)`);
  console.log(`- ${totalAssociations} associations version-repo créées`);
  console.log(`- ${totalProcedures} procédures créées`);
}
