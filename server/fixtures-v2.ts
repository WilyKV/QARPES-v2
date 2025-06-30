import { prisma } from "./db";

export async function createFixtures() {
  console.log("Creating fixtures v2...");

  // Suppression des données existantes (ordre pour respecter les contraintes de clés étrangères)
  await prisma.arb.deleteMany();
  await prisma.pvFile.deleteMany();
  await prisma.projectPv.deleteMany();
  await prisma.procedure.deleteMany();
  await prisma.commit.deleteMany();
  await prisma.gitRepo.deleteMany();
  await prisma.cab.deleteMany();
  // SUPPRESSION : Plus de ReleaseProject
  // await prisma.releaseProject.deleteMany();
  await prisma.projectVersion.deleteMany();
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

  const projectsList = await prisma.project.findMany();

  // Création des releases avec dates réalistes
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

  const releasesList = await prisma.release.findMany();

  // Création des versions de projet avec associations cohérentes aux releases
  console.log("Création des versions de projet...");
  
  // Pour chaque projet, créer des versions associées à différentes releases
  for (let i = 0; i < projectsList.length; i++) {
    const project = projectsList[i];
    
    // Version 1.0.0 - Production (release Nov 2024)
    await prisma.projectVersion.create({
      data: {
        projectId: project.id,
        version: "1.0.0",
        status: "production",
        description: `Version initiale du projet ${project.name} déployée en production`,
        releaseId: releasesList[0]?.id, // Nov 2024
      },
    });
    
    // Version 1.1.0 - Production (release Dec 2024) - pas tous les projets
    if (i % 2 === 0) {
      await prisma.projectVersion.create({
        data: {
          projectId: project.id,
          version: "1.1.0",
          status: "production",
          description: `Version intermédiaire avec corrections pour ${project.name}`,
          releaseId: releasesList[1]?.id, // Dec 2024
        },
      });
    }
    
    // Version 1.2.0 - Production (release Jan 2025) - seulement certains projets
    if (i % 3 === 0) {
      await prisma.projectVersion.create({
        data: {
          projectId: project.id,
          version: "1.2.0", 
          status: "production",
          description: `Version avec nouvelles fonctionnalités pour ${project.name}`,
          releaseId: releasesList[2]?.id, // Jan 2025
        },
      });
    }
    
    // Version 2.0.0 - En cours selon le statut (releases futures)
    const statusForNew = i % 4 === 0 ? "preproduction" : i % 4 === 1 ? "testing" : i % 4 === 2 ? "development" : "testing";
    const releaseIndex = Math.min(i % 4 + 3, releasesList.length - 2); // Éviter la release annulée
    
    await prisma.projectVersion.create({
      data: {
        projectId: project.id,
        version: "2.0.0",
        status: statusForNew,
        description: `Nouvelle version majeure en cours pour ${project.name}`,
        releaseId: releasesList[releaseIndex]?.id,
      },
    });
  }

  // Note : PLUS de création de ReleaseProject !
  // Les associations passent uniquement par ProjectVersion.releaseId

  console.log("✅ Fixtures v2 créées avec succès !");
  console.log(`📊 Statistiques:`);
  console.log(`   - ${(await prisma.user.count())} utilisateurs`);
  console.log(`   - ${(await prisma.team.count())} équipes`);
  console.log(`   - ${(await prisma.project.count())} projets`);
  console.log(`   - ${(await prisma.release.count())} releases`);
  console.log(`   - ${(await prisma.projectVersion.count())} versions de projet`);
  
  // Vérification des associations
  const releasesWithVersions = await prisma.release.findMany({
    include: {
      projectVersions: {
        include: {
          project: true
        }
      }
    }
  });
  
  console.log(`📈 Associations release ↔ projet via versions :`);
  for (const release of releasesWithVersions) {
    const uniqueProjects = new Set(release.projectVersions.map(v => v.project.name));
    console.log(`   - ${release.name}: ${uniqueProjects.size} projets via ${release.projectVersions.length} versions`);
  }
}
