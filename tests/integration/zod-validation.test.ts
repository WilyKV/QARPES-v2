/**
 * RED PHASE — [Phase 4] Validation Zod via middleware
 *
 * Ces tests échouent jusqu'à ce que :
 *   - server/middleware/validate.ts existe avec la signature :
 *       export function validate(schema: ZodSchema, source?: "body" | "params" | "query"): RequestHandler
 *   - shared/validation/teams.ts, projects.ts, releases.ts existent avec des schémas Zod
 *   - Les schémas sont appliqués sur les endpoints concernés dans server/routes.ts
 *
 * Tous les tests qui font une requête mutante utilisent un cookie admin pour
 * s'assurer que le RBAC ne bloque pas avant la validation Zod.
 * L'ordre d'exécution des middlewares attendu : requireAuth → requirePermission → validate → handler
 *
 * IMPORTANT — distinction Red Phase :
 *   Actuellement, certaines requêtes invalides retournent déjà 400 via des erreurs Prisma
 *   (ex: NaN passé à une colonne Int, null sur un champ requis). Ce n'est PAS une validation Zod.
 *   Pour valider que le middleware Zod est en place, on vérifie que le corps de la réponse 400
 *   contient le champ `errors` (tableau d'erreurs Zod formatées), ce qu'un crash Prisma ne fait pas.
 *   Les tests qui vérifient `res.body.errors` sont les vrais indicateurs de Red Phase.
 */

import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createTestApp } from "../helpers/test-app.js";
import { loginAs } from "../helpers/auth.js";

// ---- setup ------------------------------------------------------------------

let app: Express;
let adminCookie: string;

beforeAll(async () => {
  app = await createTestApp();
  // Cookie admin pour passer le RBAC — la validation Zod vient ensuite
  adminCookie = await loginAs(app, "admin");
}, 30_000);

// ---- tests ------------------------------------------------------------------

describe("[Phase 4] Zod validation middleware", () => {
  // --------------------------------------------------------------------------
  // POST /api/teams — validation du body
  // Schéma attendu : { name: string (non vide, min 1 char) }
  //
  // DISTINCTION Red Phase :
  //   Les assertions sur `res.body.errors` sont le vrai indicateur de Red Phase.
  //   Sans middleware Zod, le champ `errors` n'existe pas dans la réponse
  //   (Prisma retourne { message: "Failed to create team" } sans `errors`).
  // --------------------------------------------------------------------------
  describe("POST /api/teams body validation", () => {
    it("should return 400 with Zod errors array when name is missing", async () => {
      // Arrange — body sans le champ requis
      const body = {};

      // Act
      const res = await request(app)
        .post("/api/teams")
        .set("Cookie", adminCookie)
        .send(body);

      // Assert — le middleware Zod doit retourner 400 avec un tableau d'erreurs structurées
      expect(res.status).toBe(400);
      // RED PHASE : sans middleware Zod, res.body.errors n'existe pas
      expect(res.body).toHaveProperty("errors");
      expect(Array.isArray(res.body.errors)).toBe(true);
    });

    it("should return 400 with Zod errors array when name is empty string", async () => {
      // Arrange — chaîne vide invalide (min 1 char dans le schéma Zod)
      const body = { name: "" };

      // Act
      const res = await request(app)
        .post("/api/teams")
        .set("Cookie", adminCookie)
        .send(body);

      // Assert
      expect(res.status).toBe(400);
      // RED PHASE : Prisma accepte "" comme name valide et retourne 201/400 sans errors[]
      // Le middleware Zod doit intercepter avant Prisma
      expect(res.body).toHaveProperty("errors");
    });

    it("should return 400 with Zod errors array when name is not a string (number)", async () => {
      // Arrange — type incorrect
      const body = { name: 123 };

      // Act
      const res = await request(app)
        .post("/api/teams")
        .set("Cookie", adminCookie)
        .send(body);

      // Assert
      expect(res.status).toBe(400);
      // RED PHASE : sans Zod, Prisma peut accepter 123 comme name (cast implicite) ou crasher différemment
      expect(res.body).toHaveProperty("errors");
    });

    it("should return 400 with Zod errors array when name is null", async () => {
      // Arrange
      const body = { name: null };

      // Act
      const res = await request(app)
        .post("/api/teams")
        .set("Cookie", adminCookie)
        .send(body);

      // Assert
      expect(res.status).toBe(400);
      // RED PHASE : Prisma retourne {"message": "Failed to create team"} sans errors[]
      expect(res.body).toHaveProperty("errors");
    });

    it("should return 201 when body is valid (name is a non-empty string)", async () => {
      // Arrange
      const body = { name: "_ZOD_TEST_valid_team" };

      // Act
      const res = await request(app)
        .post("/api/teams")
        .set("Cookie", adminCookie)
        .send(body);

      // Assert — 201 Created (ou 200 selon l'implémentation du handler)
      expect([200, 201]).toContain(res.status);
      // Le body ne doit PAS contenir errors quand la requête est valide
      expect(res.body).not.toHaveProperty("errors");
    });
  });

  // --------------------------------------------------------------------------
  // PUT /api/teams/:id — validation du body ET des params
  // Param :id doit être un entier positif
  // --------------------------------------------------------------------------
  describe("PUT /api/teams/:id body validation", () => {
    it("should return 400 with Zod errors array when name is missing from body", async () => {
      // Arrange
      const body = {};

      // Act
      const res = await request(app)
        .put("/api/teams/1")
        .set("Cookie", adminCookie)
        .send(body);

      // Assert
      expect(res.status).toBe(400);
      // RED PHASE : sans Zod, Prisma tente l'update avec undefined et crashe différemment
      expect(res.body).toHaveProperty("errors");
    });
  });

  // --------------------------------------------------------------------------
  // Validation des params :id numériques
  // Les routes utilisent parseInt() sans validation → NaN silencieux transmis à Prisma
  // Le middleware validate doit intercepter avant le handler
  //
  // Comportement ACTUEL sans Zod :
  //   - PUT /api/teams/abc  → parseInt("abc") = NaN → Prisma crash → 400 (mais sans errors[])
  //   - PUT /api/teams/0    → Prisma "record not found for update" → 400 (mais sans errors[])
  //   - PUT /api/teams/-1   → Prisma "record not found for update" → 400 (mais sans errors[])
  //   - DELETE /api/teams/abc → parseInt("abc") = NaN → Prisma crash → 500 (pas 400 !)
  //   - GET /api/teams/abc  → parseInt("abc") = NaN → Prisma crash → 500 (pas 400 !)
  // --------------------------------------------------------------------------
  describe("Numeric :id param validation", () => {
    it("should return 400 with Zod errors when PUT /api/teams/:id receives a non-numeric id", async () => {
      // Arrange
      const body = { name: "_ZOD_TEST_invalid_id" };

      // Act
      const res = await request(app)
        .put("/api/teams/abc")
        .set("Cookie", adminCookie)
        .send(body);

      // Assert
      expect(res.status).toBe(400);
      // RED PHASE : sans Zod params validation, pas de champ errors[]
      expect(res.body).toHaveProperty("errors");
    });

    it("should return 400 with Zod errors when PUT /api/teams/:id receives id = 0", async () => {
      // Arrange — 0 n'est pas un id valide (doit être > 0)
      const body = { name: "_ZOD_TEST_zero_id" };

      // Act
      const res = await request(app)
        .put("/api/teams/0")
        .set("Cookie", adminCookie)
        .send(body);

      // Assert
      expect(res.status).toBe(400);
      // RED PHASE : sans Zod, Prisma retourne 400 pour record not found mais sans errors[]
      expect(res.body).toHaveProperty("errors");
    });

    it("should return 400 with Zod errors when PUT /api/teams/:id receives a negative id", async () => {
      // Arrange
      const body = { name: "_ZOD_TEST_negative_id" };

      // Act
      const res = await request(app)
        .put("/api/teams/-1")
        .set("Cookie", adminCookie)
        .send(body);

      // Assert
      expect(res.status).toBe(400);
      // RED PHASE : sans Zod, Prisma retourne 400 pour record not found mais sans errors[]
      expect(res.body).toHaveProperty("errors");
    });

    it("should return 400 (not 500) when DELETE /api/teams/:id receives a non-numeric id", async () => {
      // Act — sans Zod, parseInt("abc") = NaN → Prisma crash → 500 (PrismaClientValidationError)
      // Avec Zod, le middleware intercepte → 400 avant d'atteindre Prisma
      const res = await request(app)
        .delete("/api/teams/abc")
        .set("Cookie", adminCookie);

      // Assert — RED PHASE : sans Zod, c'est 500, pas 400
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errors");
    });

    it("should return 400 (not 500) when DELETE /api/releases/:id receives a non-numeric id", async () => {
      // Act — même comportement que DELETE /api/teams/abc sans Zod
      const res = await request(app)
        .delete("/api/releases/notanumber")
        .set("Cookie", adminCookie);

      // Assert — RED PHASE : sans Zod, c'est 500
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errors");
    });

    it("should return 400 (not 500) when GET /api/teams/:id receives a non-numeric id", async () => {
      // Act — même comportement pour les GET sans Zod
      const res = await request(app)
        .get("/api/teams/abc")
        .set("Cookie", adminCookie);

      // Assert — RED PHASE : sans Zod, Prisma crash donne 500
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errors");
    });
  });

  // --------------------------------------------------------------------------
  // POST /api/projects — validation du body
  // Schéma attendu : { name: string (non vide), teamId?: number }
  // --------------------------------------------------------------------------
  describe("POST /api/projects body validation", () => {
    it("should return 400 with Zod errors when name is missing", async () => {
      // Arrange
      const body = { teamId: 1 };

      // Act
      const res = await request(app)
        .post("/api/projects")
        .set("Cookie", adminCookie)
        .send(body);

      // Assert
      expect(res.status).toBe(400);
      // RED PHASE : sans Zod, Prisma crashe avec PrismaClientValidationError → {"message":...} sans errors[]
      expect(res.body).toHaveProperty("errors");
    });

    it("should return 400 with Zod errors when name is empty string", async () => {
      // Arrange
      const body = { name: "", teamId: 1 };

      // Act
      const res = await request(app)
        .post("/api/projects")
        .set("Cookie", adminCookie)
        .send(body);

      // Assert
      expect(res.status).toBe(400);
      // RED PHASE : Prisma accepte "" et insère le projet → sans Zod c'est 201, pas 400
      expect(res.body).toHaveProperty("errors");
    });

    it("should return 400 with Zod errors when teamId is not a number (string)", async () => {
      // Arrange — teamId doit être un entier si fourni
      const body = { name: "_ZOD_TEST_project", teamId: "abc" };

      // Act
      const res = await request(app)
        .post("/api/projects")
        .set("Cookie", adminCookie)
        .send(body);

      // Assert
      expect(res.status).toBe(400);
      // RED PHASE : sans Zod, Prisma crash avec PrismaClientValidationError → pas de errors[]
      expect(res.body).toHaveProperty("errors");
    });

    it("should return 201 when body is valid", async () => {
      // Arrange
      const body = { name: "_ZOD_TEST_valid_project" };

      // Act
      const res = await request(app)
        .post("/api/projects")
        .set("Cookie", adminCookie)
        .send(body);

      // Assert
      expect([200, 201]).toContain(res.status);
      expect(res.body).not.toHaveProperty("errors");
    });
  });

  // --------------------------------------------------------------------------
  // POST /api/releases — validation du body
  // Schéma attendu : { name: string (non vide), status?: enum }
  // Valeurs valides pour status : planifiee | en_cours | deployee | annulee
  // --------------------------------------------------------------------------
  describe("POST /api/releases body validation", () => {
    it("should return 400 with Zod errors when name is missing", async () => {
      // Arrange
      const body = { status: "planifiee" };

      // Act
      const res = await request(app)
        .post("/api/releases")
        .set("Cookie", adminCookie)
        .send(body);

      // Assert
      expect(res.status).toBe(400);
      // RED PHASE : sans Zod, Prisma crashe avec PrismaClientValidationError → sans errors[]
      expect(res.body).toHaveProperty("errors");
    });

    it("should return 400 with Zod errors when name is empty string", async () => {
      // Arrange
      const body = { name: "" };

      // Act
      const res = await request(app)
        .post("/api/releases")
        .set("Cookie", adminCookie)
        .send(body);

      // Assert
      expect(res.status).toBe(400);
      // RED PHASE : Prisma accepte "" pour le name → retourne 400 via erreur métier mais sans errors[]
      expect(res.body).toHaveProperty("errors");
    });

    it("should return 400 with Zod errors when status is an invalid enum value", async () => {
      // Arrange — status doit être une valeur de l'enum (planifiee | en_cours | deployee | annulee)
      const body = { name: "_ZOD_TEST_release", status: "INVALID_STATUS_VALUE" };

      // Act
      const res = await request(app)
        .post("/api/releases")
        .set("Cookie", adminCookie)
        .send(body);

      // Assert
      expect(res.status).toBe(400);
      // RED PHASE : sans Zod enum validation, Prisma insère la valeur invalide ou crashe différemment
      expect(res.body).toHaveProperty("errors");
    });

    it("should return 201 when body is valid with no status (optional)", async () => {
      // Arrange — status optionnel, seul name est requis
      const body = { name: "_ZOD_TEST_valid_release" };

      // Act
      const res = await request(app)
        .post("/api/releases")
        .set("Cookie", adminCookie)
        .send(body);

      // Assert
      expect([200, 201]).toContain(res.status);
      expect(res.body).not.toHaveProperty("errors");
    });
  });

  // --------------------------------------------------------------------------
  // Validation du Content-Type / body vide
  // --------------------------------------------------------------------------
  describe("Content-Type and empty body edge cases", () => {
    it("should return 400 with Zod errors when POST /api/teams body is not JSON", async () => {
      // Act — body text/plain non parseable comme JSON → express.json() ignore le body
      // → body sera {} → Zod détecte le name manquant → 400 avec errors[]
      const res = await request(app)
        .post("/api/teams")
        .set("Cookie", adminCookie)
        .set("Content-Type", "text/plain")
        .send("just a string");

      // Assert
      expect(res.status).toBe(400);
      // RED PHASE : sans Zod, le body est {} et Prisma crashe → pas de errors[]
      expect(res.body).toHaveProperty("errors");
    });
  });
});
