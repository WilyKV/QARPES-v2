/**
 * Tests fonctionnels pour ROVER
 * Exécuté automatiquement au démarrage de l'application
 */

import { storage } from './storage.js';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const tests: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<TestResult> {
  const start = Date.now();
  try {
    await testFn();
    const duration = Date.now() - start;
    console.log(`  ✅ ${name} (${duration}ms)`);
    return { name, passed: true, duration };
  } catch (error) {
    const duration = Date.now() - start;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`  ❌ ${name} (${duration}ms)`);
    console.log(`     Error: ${errorMessage}`);
    return { name, passed: false, error: errorMessage, duration };
  }
}

/**
 * Test de création de release avec génération automatique d'ID
 */
async function testReleaseCreationAutoId() {
  const releaseName = `Test Release Auto ${Date.now()}`;
  const release = await storage.createRelease({
    name: releaseName,
    description: 'Test release avec ID auto-généré',
    status: '0',
    productionDate: new Date(),
  });

  if (!release.releaseId) {
    throw new Error('ReleaseId should be auto-generated');
  }

  if (!release.releaseId.match(/^\d{6}-\d{2}$/)) {
    throw new Error(`ReleaseId format incorrect: ${release.releaseId} (attendu: YYYYMM-NN)`);
  }

  // Cleanup
  await storage.deleteRelease(release.id);
}

/**
 * Test de création de release avec ID personnalisé
 */
async function testReleaseCreationCustomId() {
  const customId = `999999-${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
  const releaseName = `Test Release Custom ${Date.now()}`;
  
  const release = await storage.createRelease({
    name: releaseName,
    releaseId: customId,
    description: 'Test release avec ID personnalisé',
    status: '0',
    productionDate: new Date(),
  });

  if (release.releaseId !== customId) {
    throw new Error(`ReleaseId devrait être ${customId}, reçu: ${release.releaseId}`);
  }

  // Cleanup
  await storage.deleteRelease(release.id);
}

/**
 * Test de prévention des doublons de releaseId
 */
async function testReleaseIdUniqueness() {
  const customId = `888888-${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
  const releaseName1 = `Test Release Unique 1 ${Date.now()}`;
  
  // Créer la première release
  const release1 = await storage.createRelease({
    name: releaseName1,
    releaseId: customId,
    description: 'Test release 1',
    status: '0',
    productionDate: new Date(),
  });

  // Essayer de créer une deuxième release avec le même ID
  let errorThrown = false;
  try {
    await storage.createRelease({
      name: `Test Release Unique 2 ${Date.now()}`,
      releaseId: customId,
      description: 'Test release 2',
      status: '0',
      productionDate: new Date(),
    });
  } catch (error) {
    errorThrown = true;
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes('already exists')) {
      throw new Error(`Message d'erreur incorrect: ${errorMessage}`);
    }
  }

  if (!errorThrown) {
    throw new Error('Une erreur aurait dû être levée pour un releaseId en doublon');
  }

  // Cleanup
  await storage.deleteRelease(release1.id);
}

/**
 * Test de mise à jour de release
 */
async function testReleaseUpdate() {
  const releaseName = `Test Release Update ${Date.now()}`;
  
  // Créer une release
  const release = await storage.createRelease({
    name: releaseName,
    description: 'Description initiale',
    status: '0',
    productionDate: new Date(),
  });

  // Mettre à jour la release
  const updatedRelease = await storage.updateRelease(release.id, {
    description: 'Description mise à jour',
    status: '1',
  });

  if (updatedRelease.description !== 'Description mise à jour') {
    throw new Error('La description n\'a pas été mise à jour');
  }

  if (updatedRelease.status !== '1') {
    throw new Error('Le statut n\'a pas été mis à jour');
  }

  // Cleanup
  await storage.deleteRelease(release.id);
}

/**
 * Test de mise à jour des dates
 */
async function testReleaseDateUpdate() {
  const releaseName = `Test Release Date ${Date.now()}`;
  
  // Créer une release
  const release = await storage.createRelease({
    name: releaseName,
    description: 'Test des dates',
    status: '0',
  });

  // Mettre à jour les dates
  const recetteDate = new Date('2025-12-01');
  const preprodDate = new Date('2025-12-10');
  const productionDate = new Date('2025-12-15');

  const updatedRelease = await storage.updateRelease(release.id, {
    recetteDate: recetteDate as any,
    preprodDate: preprodDate as any,
    productionDate: productionDate as any,
  });

  if (!updatedRelease.recetteDate) {
    throw new Error('La date de recette n\'a pas été définie');
  }

  if (!updatedRelease.preprodDate) {
    throw new Error('La date de préprod n\'a pas été définie');
  }

  if (!updatedRelease.productionDate) {
    throw new Error('La date de production n\'a pas été définie');
  }

  // Cleanup
  await storage.deleteRelease(release.id);
}

/**
 * Exécute tous les tests fonctionnels
 */
export async function runFunctionalTests() {
  console.log('\n🧪 Exécution des tests fonctionnels...\n');

  const results: TestResult[] = [];

  results.push(await runTest('Création de release avec ID auto-généré', testReleaseCreationAutoId));
  results.push(await runTest('Création de release avec ID personnalisé', testReleaseCreationCustomId));
  results.push(await runTest('Prévention des doublons de releaseId', testReleaseIdUniqueness));
  results.push(await runTest('Mise à jour de release', testReleaseUpdate));
  results.push(await runTest('Mise à jour des dates', testReleaseDateUpdate));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\n📊 Résultats des tests fonctionnels:`);
  console.log(`   ✅ Réussis: ${passed}`);
  console.log(`   ❌ Échoués: ${failed}`);
  console.log(`   ⏱️  Durée totale: ${totalDuration}ms`);

  if (failed > 0) {
    console.log('\n⚠️  Certains tests ont échoué, mais l\'application continue de fonctionner.');
  } else {
    console.log('\n✨ Tous les tests fonctionnels sont passés avec succès!\n');
  }

  return { passed, failed, results };
}
