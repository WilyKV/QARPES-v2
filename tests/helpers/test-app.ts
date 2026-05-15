/**
 * Helper: createTestApp
 *
 * TODO (developer) — ce helper nécessite une refactorisation de server/index.ts :
 *   1. Extraire la création de l'app Express dans une fonction exportée `createApp()`
 *      qui retourne l'instance Express SANS appeler app.listen().
 *   2. `createApp()` doit accepter un objet `overrides` optionnel permettant d'injecter
 *      un mock de storage et de contrôler NODE_ENV.
 *   3. server/index.ts garde le `(async () => { app.listen(...) })()` mais appelle
 *      createApp() en interne.
 *
 * Signature attendue dans server/index.ts (ou server/app.ts) :
 *
 *   export async function createApp(opts?: {
 *     storage?: IStorage;
 *     nodeEnv?: string;
 *   }): Promise<Express>
 *
 * Jusqu'à ce que ce refactor soit fait, createTestApp() lèvera une erreur explicite
 * pour que les tests échouent avec un message clair (Red Phase).
 */

import type { Express } from "express";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

export interface TestAppOptions {
  /** Override NODE_ENV pour l'instance de l'app (ex: 'production') */
  nodeEnv?: string;
}

/**
 * Crée et retourne une instance Express de test (sans app.listen).
 *
 * PRÉREQUIS : server/app.ts doit être créé par le developer avec une fonction
 * exportée `createApp()` qui retourne l'instance Express sans appeler app.listen().
 *
 * En attendant ce refactor, cette fonction lève une erreur explicite avec un
 * message clair indiquant ce qui doit être implémenté (Red Phase).
 */
export async function createTestApp(opts?: TestAppOptions): Promise<Express> {
  const previousNodeEnv = process.env.NODE_ENV;

  if (opts?.nodeEnv) {
    process.env.NODE_ENV = opts.nodeEnv;
  }

  try {
    // Construit le chemin absolu vers server/app.ts depuis la racine du projet.
    // Utilise import.meta.url pour éviter les problèmes de résolution ESM dans Vitest.
    // __dirname = /app/tests/helpers → remonter 2 niveaux → /app → + server/app.ts
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const serverAppPath = join(__dirname, "..", "..", "server", "app.ts");

    // Tente d'importer createApp depuis server/app.ts (fichier à créer par le developer)
    // Si le fichier n'existe pas, l'import échouera avec ERR_MODULE_NOT_FOUND → Red Phase
    const { createApp } = await import(serverAppPath);
    const app = await createApp({ nodeEnv: opts?.nodeEnv });
    return app;
  } finally {
    // Restaure NODE_ENV même en cas d'erreur
    if (opts?.nodeEnv) {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
}
