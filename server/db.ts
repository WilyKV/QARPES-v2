import { PrismaClient } from '@prisma/client';

// Client Prisma instancié de manière lazy.
// Évite de crasher à l'import quand DATABASE_URL n'est pas défini
// (ex: CI GitHub Actions qui exécute uniquement lint/typecheck/tests unitaires).
let _prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!_prisma) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?",
      );
    }
    _prisma = new PrismaClient();
  }
  return _prisma;
}

// Re-export pour compatibilité avec les imports existants.
// En environnement de test sans DB, les mocks interceptent avant l'appel réel.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return getPrisma()[prop as keyof PrismaClient];
  },
});
