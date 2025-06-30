import { prisma } from "./db";

export async function createFixtures() {
  console.log("Creating fixtures v2 - simplifié...");

  // Suppression des données existantes (ordre pour respecter les contraintes de clés étrangères)
  // IMPORTANT: Supprimer dans l'ordre inverse des dépendances
  await prisma.arb.deleteMany();
  await prisma.pvFile.deleteMany();
  await prisma.projectPv.deleteMany();
  await prisma.procedure.deleteMany();
  await prisma.commit.deleteMany();
  await prisma.projectVersionGitRepo.deleteMany(); // Supprimer les associations avant les GitRepos
  await prisma.gitRepo.deleteMany();
  await prisma.cab.deleteMany();
  await prisma.projectVersion.deleteMany();
  // IMPORTANT: Supprimer ReleaseProject pour éviter les incohérences
  await prisma.releaseProject.deleteMany();
  await prisma.release.deleteMany();
  await prisma.project.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  // Création des utilisateurs
  await prisma.user.createMany({
    data: [
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
        id: "laurent.billon",
        email: "lbillon@omneseducation.com",
        firstName: "Laurent",
        lastName: "BILLON",
        role: "manager",
        profileImageUrl: "https://avatar.vercel.sh/laurent.billon",
      },
    ],
    skipDuplicates: true,
  });

  // Création des équipes
  await prisma.team.createMany({
    data: [
      {
        name: "Équipe Backend",
        description: "Développement des APIs et services backend",
        leaderId: "kevin.nicol",
      },
      {
        name: "Équipe Frontend", 
        description: "Développement des interfaces utilisateur",
        leaderId: "ivana.lackovic",
      },
      {
        name: "Équipe DevOps",
        description: "Infrastructure et déploiement",
        leaderId: "laurent.billon",
      },
    ],
    skipDuplicates: true,
  });

  const teamsList = await prisma.team.findMany();

  // Création des projets
  await prisma.project.createMany({
    data: [
      {
        name: "QARPES Portal",
        description: "Portail principal de gestion des releases",
        status: "production",
        teamId: teamsList[0]?.id,
        repositoryUrl: "https://github.com/omnes/qarpes-portal",
      },
      {
        name: "User Management API",
        description: "API de gestion des utilisateurs et authentification",
        status: "production", 
        teamId: teamsList[0]?.id,
        repositoryUrl: "https://github.com/omnes/user-api",
      },
      {
        name: "Notification Service",
        description: "Service de notifications en temps réel",
        status: "testing",
        teamId: teamsList[0]?.id,
        repositoryUrl: "https://github.com/omnes/notification-service",
      },
      {
        name: "Analytics Dashboard",
        description: "Tableau de bord analytique",
        status: "development",
        teamId: teamsList[1]?.id,
        repositoryUrl: "https://github.com/omnes/analytics-dashboard",
      },
      {
        name: "Mobile App",
        description: "Application mobile React Native",
        status: "development",
        teamId: teamsList[1]?.id,
        repositoryUrl: "https://github.com/omnes/mobile-app",
      },
    ],
    skipDuplicates: true,
  });

  // Création des releases avec dates réalistes et cohérentes
  await prisma.release.createMany({
    data: [
      // Releases terminées avec toutes les dates
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
      
      // Releases en cours avec seulement certaines dates
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
      
      // Releases futures avec toutes les dates planifiées
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
      
      // Release annulée - AUCUNE date
      {
        releaseId: "202505-03",
        name: "Release Mai 2025 - Features expérimentales",
        description: "Features expérimentales annulées suite aux retours utilisateurs",
        status: "Annulé",
        recetteDate: null,
        preprodDate: null,
        productionDate: null,
      },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Fixtures v2 créées avec succès !");
  console.log(`📊 Statistiques:`);
  console.log(`   - ${(await prisma.user.count())} utilisateurs`);
  console.log(`   - ${(await prisma.team.count())} équipes`);
  console.log(`   - ${(await prisma.project.count())} projets`);
  console.log(`   - ${(await prisma.release.count())} releases`);
  
  console.log(`📝 Note: Les associations projet ↔ release se feront via ProjectVersion.releaseId (à ajouter plus tard)`);
}
