/**
 * RED PHASE — these tests will fail until Phase 1 is implemented.
 *
 * Phase 1 : middleware global `requireAuth` appliqué à toutes les routes /api/*
 * sauf la whitelist : /api/login, /api/callback, /api/logout, /api/auth/demo
 *
 * Pour faire passer ces tests, le developer doit :
 *   1. Créer server/app.ts avec une fonction exportée `createApp()` qui retourne
 *      l'instance Express sans appeler app.listen().
 *   2. Créer server/middleware/auth.ts avec le middleware `requireAuth` qui :
 *      - Retourne 401 JSON { message: "Unauthorized" } si pas de session valide
 *      - Passe au next() si la session est valide
 *      - Est bypassé pour les routes de la whitelist
 *   3. Monter `requireAuth` globalement AVANT les routes protégées dans server/app.ts
 *      ou server/routes.ts.
 *
 * Stratégie : on utilise supertest + createTestApp() (helper qui importe server/app.ts).
 * La DB PostgreSQL tourne dans Docker ; pas de mock Prisma.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createTestApp } from "../helpers/test-app";
import { loginAs } from "../helpers/auth";

// [Phase 1] requireAuth middleware
describe("[Phase 1] requireAuth middleware", () => {
  let app: Express;

  beforeAll(async () => {
    // RED: échoue tant que server/app.ts n'exporte pas createApp()
    app = await createTestApp({ nodeEnv: "development" });
  });

  afterAll(async () => {
    // Nettoyage éventuel (fermeture de connexions DB)
    // Le developer peut ajouter un teardown ici si nécessaire
  });

  // ─────────────────────────────────────────────────────────────
  // Routes publiques (whitelist)
  // ─────────────────────────────────────────────────────────────
  describe("Public routes (whitelist) — should be reachable without session", () => {
    it("should return 302 (redirect to OAuth) when GET /api/login without session", async () => {
      // Arrange — aucune session
      // Act
      const response = await request(app)
        .get("/api/login")
        .redirects(0);

      // Assert — doit rediriger (vers Microsoft OAuth ou vers /api/auth/demo fallback)
      // 302 = redirect vers Microsoft login
      // 500 si MICROSOFT_CLIENT_ID manquant — acceptable, mais PAS 401
      expect([302, 500]).toContain(response.status);
      expect(response.status).not.toBe(401);
    });

    it("should return 200 or 302 when GET /api/logout without session (not 401)", async () => {
      // Arrange — aucune session
      // Act
      const response = await request(app)
        .get("/api/logout")
        .redirects(0);

      // Assert — logout doit être accessible sans session
      expect([200, 302, 204]).toContain(response.status);
      expect(response.status).not.toBe(401);
    });

    it("should return 302 with Set-Cookie when GET /api/auth/demo?role=admin in dev", async () => {
      // Arrange
      // Act
      const response = await request(app)
        .get("/api/auth/demo?role=admin")
        .redirects(0);

      // Assert
      expect(response.status).toBe(302);
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("should be reachable (not 401) when GET /api/callback without prior auth", async () => {
      // Arrange — pas de session, pas de code OAuth valide
      // Act
      const response = await request(app)
        .get("/api/callback?error=access_denied")
        .redirects(0);

      // Assert — le callback doit être accessible (whitelist), peut rediriger vers /api/login
      // Mais NE DOIT PAS retourner 401
      expect(response.status).not.toBe(401);
      // Valeurs attendues : 302 (redirect vers login), ou 400 (bad state — Phase 2)
      expect([302, 400]).toContain(response.status);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Routes protégées — sans session → 401
  // ─────────────────────────────────────────────────────────────
  describe("Protected routes — should return 401 without session", () => {
    it("should return 401 when GET /api/teams without cookie", async () => {
      // Arrange — pas de cookie
      // Act
      const response = await request(app).get("/api/teams");

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ message: "Unauthorized" });
    });

    it("should return 401 when GET /api/projects without cookie", async () => {
      // Arrange
      // Act
      const response = await request(app).get("/api/projects");

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ message: "Unauthorized" });
    });

    it("should return 401 when GET /api/releases without cookie", async () => {
      // Arrange
      // Act
      const response = await request(app).get("/api/releases");

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ message: "Unauthorized" });
    });

    it("should return 401 when GET /api/auth/user without cookie", async () => {
      // Arrange
      // Act
      const response = await request(app).get("/api/auth/user");

      // Assert
      // /api/auth/user fait déjà une vérification manuelle de session,
      // mais après Phase 1 le middleware global doit court-circuiter avant
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ message: expect.any(String) });
    });

    it("should return 401 when POST /api/teams without cookie", async () => {
      // Arrange
      // Act
      const response = await request(app)
        .post("/api/teams")
        .send({ name: "Test Team" });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ message: "Unauthorized" });
    });

    it("should return 401 when DELETE /api/releases/1 without cookie", async () => {
      // Arrange
      // Act
      const response = await request(app).delete("/api/releases/1");

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ message: "Unauthorized" });
    });

    it("should return 401 when GET /api/dashboard/stats without cookie", async () => {
      // Arrange
      // Act
      const response = await request(app).get("/api/dashboard/stats");

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ message: "Unauthorized" });
    });

    it("should return 401 when GET /api/admin/audit-logs without cookie", async () => {
      // Arrange
      // Act
      const response = await request(app).get("/api/admin/audit-logs");

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ message: "Unauthorized" });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Routes protégées — avec session valide → 200
  // ─────────────────────────────────────────────────────────────
  describe("Protected routes — should return 200 with valid session", () => {
    let adminCookie: string;

    beforeAll(async () => {
      // RED: échoue si loginAs échoue (pas de Set-Cookie sur /api/auth/demo)
      adminCookie = await loginAs(app, "admin");
    });

    it("should return 200 when GET /api/teams with admin session", async () => {
      // Arrange
      // Act
      const response = await request(app)
        .get("/api/teams")
        .set("Cookie", adminCookie);

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should return 200 and user object when GET /api/auth/user with valid session", async () => {
      // Arrange
      // Act
      const response = await request(app)
        .get("/api/auth/user")
        .set("Cookie", adminCookie);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        email: expect.any(String),
      });
    });

    it("should return 200 and stats object when GET /api/dashboard/stats with valid session", async () => {
      // Arrange
      // Act
      const response = await request(app)
        .get("/api/dashboard/stats")
        .set("Cookie", adminCookie);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toBeTypeOf("object");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Expiration de session
  // ─────────────────────────────────────────────────────────────
  describe("Session expiration", () => {
    it.skip(
      "should return 401 when GET /api/teams with expired session",
      async () => {
        /**
         * TODO (developer) :
         * Ce test nécessite soit :
         *   a) Une manipulation directe de la session en DB pour mettre expires_at dans le passé
         *   b) Un stub de Date.now() via vi.spyOn(Date, 'now').mockReturnValue(futurTimestamp)
         *
         * Implémentation suggérée :
         *   const futurTimestamp = Date.now() + 8 * 24 * 60 * 60 * 1000; // +8 jours
         *   vi.spyOn(Date, 'now').mockReturnValue(futurTimestamp);
         *   const cookie = await loginAs(app, 'admin'); // session avec expires_at dans le passé
         *   const response = await request(app).get('/api/teams').set('Cookie', cookie);
         *   expect(response.status).toBe(401);
         *   vi.restoreAllMocks();
         */
      }
    );
  });
});
