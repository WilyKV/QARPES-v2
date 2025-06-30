import { prisma } from "./db";

export async function createFixtures() {
  console.log("Creating simple fixtures...");

  // Suppression des données existantes (ordre simplifié)
  await prisma.arb.deleteMany();
  await prisma.releaseProject.deleteMany();
  await prisma.release.deleteMany();
  await prisma.project.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Données supprimées");

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
    ],
    skipDuplicates: true,
  });

  console.log("✅ Utilisateurs créés");

  // Création d'une équipe
  const team = await prisma.team.create({
    data: {
      name: "E2I",
      description: "Équipe E2I - Écosystème d'Innovation Intégré",
      leaderId: "kevin.nicol",
    },
  });

  // Création des membres d'équipe
  await prisma.teamMember.createMany({
    data: [
      { teamId: team.id, userId: "kevin.nicol", role: "lead" },
      { teamId: team.id, userId: "ivana.lackovic", role: "member" },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Équipe créée");

  // Création d'un projet
  const project = await prisma.project.create({
    data: {
      name: "E2I - Egaronne",
      description: "E2I - Ecole d'ingénieur Egaronne - Plateforme de gestion académique",
      status: "production",
      teamId: team.id,
      repositoryUrl: "https://github.com/omneseducation/e2i-egaronne",
    },
  });

  console.log("✅ Projet créé");

  // Création d'une release
  const release = await prisma.release.create({
    data: {
      releaseId: "202506-01",
      name: "Release Juin 2025 - Test",
      description: "Release de test",
      status: "3",
      recetteDate: new Date("2025-06-02"),
      preprodDate: new Date("2025-06-07"),
      productionDate: new Date("2025-06-12"),
    },
  });

  console.log("✅ Release créée");

  console.log("✅ Fixtures de base créées avec succès !");
  console.log(`📊 Statistiques:`);
  console.log(`   - ${(await prisma.user.count())} utilisateurs`);
  console.log(`   - ${(await prisma.team.count())} équipes`);
  console.log(`   - ${(await prisma.project.count())} projets`);
  console.log(`   - ${(await prisma.release.count())} releases`);
}
