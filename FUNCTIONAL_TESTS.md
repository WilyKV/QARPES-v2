# Tests Fonctionnels QARPES-v2

## 📝 Résumé

Ce document décrit les tests fonctionnels automatiques mis en place pour l'application QARPES-v2.

## ✅ Corrections effectuées

### 1. **Correction du bug de création de release**
- **Problème** : Erreur `Unique constraint failed on the fields: (releaseId)` lors de la création de releases
- **Cause** : Le `releaseId` fourni manuellement pouvait déjà exister dans la base de données
- **Solution** : Ajout d'une vérification avant la création pour détecter les doublons et retourner une erreur explicite

**Fichier modifié** : `server/storage.ts`
```typescript
if (releaseId) {
  // Si un releaseId est fourni, vérifier qu'il n'existe pas déjà
  const existing = await prisma.release.findUnique({
    where: { releaseId },
  });
  
  if (existing) {
    throw new Error(`Release with releaseId "${releaseId}" already exists`);
  }
}
```

### 2. **Modification du schéma TypeScript**
- **Problème** : Le `releaseId` était requis dans le type `InsertRelease`
- **Solution** : Le `releaseId` est maintenant optionnel pour permettre la génération automatique

**Fichier modifié** : `shared/schema.ts`
```typescript
export type InsertRelease = {
  releaseId?: string;  // Maintenant optionnel
  name: string;
  // ...
}
```

## 🧪 Tests fonctionnels automatiques

### Tests implémentés

Les tests suivants sont exécutés automatiquement à chaque rechargement de l'application en mode développement :

#### 1. **Test de création avec ID auto-généré**
- ✅ Vérifie que le système génère automatiquement un `releaseId` au format `YYYYMM-NN`
- ✅ Vérifie l'incrémentation correcte du numéro de séquence

#### 2. **Test de création avec ID personnalisé**
- ✅ Vérifie qu'un `releaseId` personnalisé est correctement utilisé
- ✅ Vérifie que l'ID fourni est bien sauvegardé

#### 3. **Test de prévention des doublons**
- ✅ Vérifie qu'une erreur est levée lors de la tentative de création d'une release avec un `releaseId` existant
- ✅ Vérifie que le message d'erreur est explicite

#### 4. **Test de mise à jour de release**
- ✅ Vérifie que la description peut être modifiée
- ✅ Vérifie que le statut peut être modifié

#### 5. **Test de mise à jour des dates**
- ✅ Vérifie que les dates (recette, préprod, production) peuvent être définies
- ✅ Vérifie que les dates sont correctement sauvegardées

### Fichiers créés

**Fichier** : `server/functional-tests.ts`
- Contient tous les tests fonctionnels
- Export de la fonction `runFunctionalTests()`
- Nettoyage automatique après chaque test (suppression des données de test)

### Intégration automatique

**Fichier modifié** : `server/index.ts`
```typescript
// Exécuter les tests fonctionnels automatiquement
const { runFunctionalTests } = await import("./functional-tests");
await runFunctionalTests();
```

Les tests sont exécutés :
- ✅ À chaque démarrage de l'application en mode développement
- ✅ Après le chargement des fixtures
- ✅ Avant que le serveur ne commence à écouter les requêtes

## 📊 Résultats

Lors du dernier lancement :
```
🧪 Exécution des tests fonctionnels...

  ✅ Création de release avec ID auto-généré (12ms)
  ✅ Création de release avec ID personnalisé (9ms)
  ✅ Prévention des doublons de releaseId (9ms)
  ✅ Mise à jour de release (12ms)
  ✅ Mise à jour des dates (13ms)

📊 Résultats des tests fonctionnels:
   ✅ Réussis: 5
   ❌ Échoués: 0
   ⏱️  Durée totale: 55ms

✨ Tous les tests fonctionnels sont passés avec succès!
```

## 🚀 Utilisation

### Exécution automatique
Les tests s'exécutent automatiquement à chaque fois que vous lancez :
```bash
make reload-app
```

### Comportement en cas d'échec
Si un test échoue :
- ❌ Le test est marqué comme échoué dans les logs
- ⚠️ Un message d'avertissement est affiché
- ✅ L'application continue de fonctionner normalement

Cela permet de détecter les problèmes sans bloquer le développement.

## 🔧 Extension des tests

Pour ajouter un nouveau test, il suffit de :

1. Créer une fonction de test dans `server/functional-tests.ts`
```typescript
async function testMyNewFeature() {
  // Votre code de test ici
  const result = await storage.someMethod();
  if (!result) {
    throw new Error('Test failed');
  }
}
```

2. L'ajouter dans la fonction `runFunctionalTests()`
```typescript
results.push(await runTest('Mon nouveau test', testMyNewFeature));
```

3. Relancer l'application avec `make reload-app`

## 📝 Notes importantes

- Les tests nettoient automatiquement les données créées (cleanup)
- Les tests n'interfèrent pas avec les données de fixtures
- Les tests sont isolés les uns des autres
- Chaque test crée et supprime ses propres données

## 🎯 Bonnes pratiques

1. **Isolation** : Chaque test doit être indépendant
2. **Nettoyage** : Toujours supprimer les données créées après le test
3. **Assertions claires** : Lever des erreurs explicites avec des messages clairs
4. **Performance** : Garder les tests rapides (< 100ms par test si possible)
