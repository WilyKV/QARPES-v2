import pkg from 'pg';
const { Pool } = pkg;
// Prisma version (remplace Drizzle)
// Utilisation de require pour compatibilité Node.js/Docker
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Optionnel : supprimer l'ancien Pool si non utilisé
// export const pool = new Pool({ connectionString: process.env.DATABASE_URL });