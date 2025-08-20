/**
 * Tests fonctionnels pour les équipes
 * Teste la création, modification et gestion des membres
 */

import { prisma } from "./db";
import type { Team, User } from "@shared/schema";

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

async function testCreateTeam(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    // Créer une équipe de test
    const testTeam = await prisma.team.create({
      data: {
        name: "Test Team",
        description: "Une équipe de test",
        leaderId: null,
      },
    });

    // Vérifier que l'équipe a été créée
    if (!testTeam.id) {
      throw new Error("L'équipe n'a pas d'ID");
    }

    if (testTeam.name !== "Test Team") {
      throw new Error("Le nom de l'équipe ne correspond pas");
    }

    // Nettoyer
    await prisma.team.delete({
      where: { id: testTeam.id },
    });

    return {
      name: "Création d'équipe sans chef",
      passed: true,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name: "Création d'équipe sans chef",
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    };
  }
}

async function testCreateTeamWithLeader(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    // Vérifier qu'il y a au moins un utilisateur
    const users = await prisma.user.findMany({ take: 1 });
    if (users.length === 0) {
      throw new Error("Aucun utilisateur disponible pour le test");
    }

    const leaderId = users[0].id;

    // Créer une équipe avec chef
    const testTeam = await prisma.team.create({
      data: {
        name: "Test Team avec Chef",
        description: "Une équipe avec un chef",
        leaderId: leaderId,
      },
      include: {
        leader: true,
      },
    });

    // Vérifier que l'équipe a un chef
    if (!testTeam.leader) {
      throw new Error("L'équipe n'a pas de chef");
    }

    if (testTeam.leaderId !== leaderId) {
      throw new Error("Le chef d'équipe ne correspond pas");
    }

    // Nettoyer
    await prisma.team.delete({
      where: { id: testTeam.id },
    });

    return {
      name: "Création d'équipe avec chef",
      passed: true,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name: "Création d'équipe avec chef",
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    };
  }
}

async function testUpdateTeam(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    // Créer une équipe de test
    const testTeam = await prisma.team.create({
      data: {
        name: "Test Team Original",
        description: "Description originale",
        leaderId: null,
      },
    });

    // Mettre à jour l'équipe
    const updatedTeam = await prisma.team.update({
      where: { id: testTeam.id },
      data: {
        name: "Test Team Modifié",
        description: "Description modifiée",
      },
    });

    // Vérifier les modifications
    if (updatedTeam.name !== "Test Team Modifié") {
      throw new Error("Le nom n'a pas été modifié");
    }

    if (updatedTeam.description !== "Description modifiée") {
      throw new Error("La description n'a pas été modifiée");
    }

    // Nettoyer
    await prisma.team.delete({
      where: { id: testTeam.id },
    });

    return {
      name: "Modification d'équipe",
      passed: true,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name: "Modification d'équipe",
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    };
  }
}

async function testAddTeamMember(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    // Créer une équipe de test
    const testTeam = await prisma.team.create({
      data: {
        name: "Test Team Membres",
        description: "Test des membres",
        leaderId: null,
      },
    });

    // Récupérer un utilisateur et son membre associé
    const users = await prisma.user.findMany({ take: 1 });
    if (users.length === 0) {
      throw new Error("Aucun utilisateur disponible");
    }

    const userId = users[0].id;
    
    // Récupérer le member associé à cet user
    const memberRecord = await prisma.member.findUnique({
      where: { userId: userId },
    });
    
    if (!memberRecord) {
      throw new Error("Aucun membre trouvé pour cet utilisateur");
    }

    // Ajouter un membre
    const member = await prisma.teamMember.create({
      data: {
        teamId: testTeam.id,
        memberId: memberRecord.id,
        role: "member",
      },
    });

    // Vérifier que le membre a été ajouté
    if (!member.id) {
      throw new Error("Le membre n'a pas été ajouté");
    }

    // Vérifier via la relation
    const teamWithMembers = await prisma.team.findUnique({
      where: { id: testTeam.id },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    if (teamWithMembers?._count.members !== 1) {
      throw new Error(`Nombre de membres incorrect: ${teamWithMembers?._count.members}`);
    }

    // Nettoyer
    await prisma.teamMember.delete({
      where: { id: member.id },
    });
    await prisma.team.delete({
      where: { id: testTeam.id },
    });

    return {
      name: "Ajout d'un membre à l'équipe",
      passed: true,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name: "Ajout d'un membre à l'équipe",
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    };
  }
}

async function testRemoveTeamMember(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    // Créer une équipe de test
    const testTeam = await prisma.team.create({
      data: {
        name: "Test Team Suppression",
        description: "Test de suppression",
        leaderId: null,
      },
    });

    // Récupérer un utilisateur et son membre associé
    const users = await prisma.user.findMany({ take: 1 });
    if (users.length === 0) {
      throw new Error("Aucun utilisateur disponible");
    }

    const userId = users[0].id;
    
    // Récupérer le member associé à cet user
    const memberRecord = await prisma.member.findUnique({
      where: { userId: userId },
    });
    
    if (!memberRecord) {
      throw new Error("Aucun membre trouvé pour cet utilisateur");
    }

    // Ajouter un membre
    const member = await prisma.teamMember.create({
      data: {
        teamId: testTeam.id,
        memberId: memberRecord.id,
        role: "member",
      },
    });

    // Supprimer le membre
    await prisma.teamMember.delete({
      where: { id: member.id },
    });

    // Vérifier que le membre a été supprimé
    const teamWithMembers = await prisma.team.findUnique({
      where: { id: testTeam.id },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    if (teamWithMembers?._count.members !== 0) {
      throw new Error("Le membre n'a pas été supprimé");
    }

    // Nettoyer
    await prisma.team.delete({
      where: { id: testTeam.id },
    });

    return {
      name: "Suppression d'un membre de l'équipe",
      passed: true,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name: "Suppression d'un membre de l'équipe",
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    };
  }
}

async function testUpdateTeamLeader(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    // Récupérer deux utilisateurs
    const users = await prisma.user.findMany({ take: 2 });
    if (users.length < 2) {
      throw new Error("Pas assez d'utilisateurs pour le test");
    }

    // Créer une équipe avec un chef
    const testTeam = await prisma.team.create({
      data: {
        name: "Test Team Chef",
        description: "Test changement de chef",
        leaderId: users[0].id,
      },
    });

    // Changer le chef
    const updatedTeam = await prisma.team.update({
      where: { id: testTeam.id },
      data: {
        leaderId: users[1].id,
      },
      include: {
        leader: true,
      },
    });

    // Vérifier le changement
    if (updatedTeam.leaderId !== users[1].id) {
      throw new Error("Le chef n'a pas été changé");
    }

    if (updatedTeam.leader?.id !== users[1].id) {
      throw new Error("Le chef chargé ne correspond pas");
    }

    // Nettoyer
    await prisma.team.delete({
      where: { id: testTeam.id },
    });

    return {
      name: "Modification du chef d'équipe",
      passed: true,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name: "Modification du chef d'équipe",
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    };
  }
}

export async function runTeamFunctionalTests(): Promise<void> {
  console.log("\n🧪 Exécution des tests fonctionnels des équipes...\n");

  const tests = [
    testCreateTeam,
    testCreateTeamWithLeader,
    testUpdateTeam,
    testAddTeamMember,
    testRemoveTeamMember,
    testUpdateTeamLeader,
  ];

  const results: TestResult[] = [];
  
  for (const test of tests) {
    const result = await test();
    results.push(result);
    
    if (result.passed) {
      console.log(`  ✅ ${result.name} (${result.duration}ms)`);
    } else {
      console.log(`  ❌ ${result.name} (${result.duration}ms)`);
      if (result.error) {
        console.log(`     Erreur: ${result.error}`);
      }
    }
  }

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log("\n📊 Résultats des tests fonctionnels des équipes:");
  console.log(`   ✅ Réussis: ${passed}`);
  console.log(`   ❌ Échoués: ${failed}`);
  console.log(`   ⏱️  Durée totale: ${totalDuration}ms`);

  if (failed === 0) {
    console.log("\n✨ Tous les tests fonctionnels des équipes sont passés avec succès!\n");
  } else {
    console.log("\n⚠️  Certains tests ont échoué. Vérifiez les erreurs ci-dessus.\n");
  }
}
