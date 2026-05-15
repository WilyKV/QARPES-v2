/**
 * RED PHASE — these tests will fail until Phase 2 is implemented.
 *
 * Phase 2 : route /api/auth/demo
 *   - Doit retourner 404 en NODE_ENV=production
 *   - Les rôles valides doivent être alignés sur :
 *     ["admin", "prod", "architecte", "po", "chef_projet", "viewer"]
 *   - Les anciens rôles (manager, dev, ops) ne sont plus dans la whitelist
 *     et doivent être repliés sur "viewer"
 *   - Un rôle inconnu doit être replié sur "viewer"
 *   - Pas de paramètre role → défaut "viewer"
 *
 * Pour faire passer ces tests, le developer doit modifier server/replitAuth.ts :
 *   1. Ajouter un guard NODE_ENV=production → res.status(404).json(...)
 *   2. Mettre à jour validRoles : ["admin", "prod", "architecte", "po", "chef_projet", "viewer"]
 *   3. S'assurer que la session est sauvegardée AVANT le redirect (Set-Cookie sur 302)
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createTestApp } from "../helpers/test-app";

// [Phase 2] Demo auth route
describe("[Phase 2] Demo auth route (/api/auth/demo)", () => {
  // ─────────────────────────────────────────────────────────────
  // Tests en mode development
  // ─────────────────────────────────────────────────────────────
  describe("in development (NODE_ENV=development)", () => {
    let app: Express;

    beforeAll(async () => {
      // RED: échoue tant que server/app.ts n'exporte pas createApp()
      app = await createTestApp({ nodeEnv: "development" });
    });

    it("should return 302 and set session cookie when GET /api/auth/demo?role=admin", async () => {
      // Arrange
      // Act
      const response = await request(app)
        .get("/api/auth/demo?role=admin")
        .redirects(0);

      // Assert
      expect(response.status).toBe(302);
      expect(response.headers["set-cookie"]).toBeDefined();
      expect(response.headers["set-cookie"]).not.toHaveLength(0);
    });

    it("should return 302 and set session cookie when GET /api/auth/demo?role=prod", async () => {
      // Arrange
      // Act
      const response = await request(app)
        .get("/api/auth/demo?role=prod")
        .redirects(0);

      // Assert — "prod" est dans les nouveaux validRoles
      expect(response.status).toBe(302);
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("should return 302 and set session cookie when GET /api/auth/demo?role=architecte", async () => {
      // Arrange
      // Act
      const response = await request(app)
        .get("/api/auth/demo?role=architecte")
        .redirects(0);

      // Assert — "architecte" est dans les nouveaux validRoles
      expect(response.status).toBe(302);
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("should return 302 and set session cookie when GET /api/auth/demo?role=po", async () => {
      // Arrange
      // Act
      const response = await request(app)
        .get("/api/auth/demo?role=po")
        .redirects(0);

      // Assert — "po" est dans les nouveaux validRoles
      expect(response.status).toBe(302);
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("should return 302 and set session cookie when GET /api/auth/demo?role=chef_projet", async () => {
      // Arrange
      // Act
      const response = await request(app)
        .get("/api/auth/demo?role=chef_projet")
        .redirects(0);

      // Assert — "chef_projet" est dans les nouveaux validRoles
      expect(response.status).toBe(302);
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("should return 302 and set session cookie when GET /api/auth/demo?role=viewer", async () => {
      // Arrange
      // Act
      const response = await request(app)
        .get("/api/auth/demo?role=viewer")
        .redirects(0);

      // Assert
      expect(response.status).toBe(302);
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("should fall back to viewer when GET /api/auth/demo?role=unknown_role", async () => {
      // Arrange
      // Act
      const response = await request(app)
        .get("/api/auth/demo?role=unknown_role")
        .redirects(0);

      // Assert — role inconnu → viewer (pas de rejet, pas d'erreur)
      expect(response.status).toBe(302);
      expect(response.headers["set-cookie"]).toBeDefined();

      // Vérification que le user créé a le rôle "viewer"
      // On suit le cookie pour interroger /api/auth/user
      const cookies = (response.headers["set-cookie"] as string[])
        .map((c: string) => c.split(";")[0])
        .join("; ");

      const userResponse = await request(app)
        .get("/api/auth/user")
        .set("Cookie", cookies);

      expect(userResponse.status).toBe(200);
      expect(userResponse.body.role).toBe("viewer");
    });

    it("should default to viewer when GET /api/auth/demo without role param", async () => {
      // Arrange
      // Act
      const response = await request(app)
        .get("/api/auth/demo")
        .redirects(0);

      // Assert
      expect(response.status).toBe(302);
      expect(response.headers["set-cookie"]).toBeDefined();

      const cookies = (response.headers["set-cookie"] as string[])
        .map((c: string) => c.split(";")[0])
        .join("; ");

      const userResponse = await request(app)
        .get("/api/auth/user")
        .set("Cookie", cookies);

      expect(userResponse.status).toBe(200);
      expect(userResponse.body.role).toBe("viewer");
    });

    it("should fall back to viewer when GET /api/auth/demo?role=manager (deprecated role)", async () => {
      // Arrange — "manager" était un ancien rôle, ne doit plus être dans validRoles
      // Act
      const response = await request(app)
        .get("/api/auth/demo?role=manager")
        .redirects(0);

      // Assert — doit fonctionner mais avec rôle viewer
      expect(response.status).toBe(302);

      const cookies = (response.headers["set-cookie"] as string[])
        .map((c: string) => c.split(";")[0])
        .join("; ");

      const userResponse = await request(app)
        .get("/api/auth/user")
        .set("Cookie", cookies);

      expect(userResponse.status).toBe(200);
      // "manager" n'est plus dans validRoles → replié sur "viewer"
      expect(userResponse.body.role).toBe("viewer");
    });

    it("should fall back to viewer when GET /api/auth/demo?role=dev (deprecated role)", async () => {
      // Arrange — "dev" était un ancien rôle
      // Act
      const response = await request(app)
        .get("/api/auth/demo?role=dev")
        .redirects(0);

      // Assert
      expect(response.status).toBe(302);

      const cookies = (response.headers["set-cookie"] as string[])
        .map((c: string) => c.split(";")[0])
        .join("; ");

      const userResponse = await request(app)
        .get("/api/auth/user")
        .set("Cookie", cookies);

      expect(userResponse.status).toBe(200);
      expect(userResponse.body.role).toBe("viewer");
    });

    it("should fall back to viewer when GET /api/auth/demo?role=ops (deprecated role)", async () => {
      // Arrange — "ops" était un ancien rôle
      // Act
      const response = await request(app)
        .get("/api/auth/demo?role=ops")
        .redirects(0);

      // Assert
      expect(response.status).toBe(302);

      const cookies = (response.headers["set-cookie"] as string[])
        .map((c: string) => c.split(";")[0])
        .join("; ");

      const userResponse = await request(app)
        .get("/api/auth/user")
        .set("Cookie", cookies);

      expect(userResponse.status).toBe(200);
      expect(userResponse.body.role).toBe("viewer");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Tests en mode production
  // ─────────────────────────────────────────────────────────────
  describe("in production (NODE_ENV=production)", () => {
    let prodApp: Express;
    const originalNodeEnv = process.env.NODE_ENV;

    beforeAll(async () => {
      // RED: échoue tant que server/app.ts n'exporte pas createApp()
      // ET tant que la route ne retourne pas 404 en production
      prodApp = await createTestApp({ nodeEnv: "production" });
    });

    afterAll(() => {
      // Restaure NODE_ENV après les tests prod
      process.env.NODE_ENV = originalNodeEnv;
    });

    it("should return 404 when GET /api/auth/demo in NODE_ENV=production", async () => {
      // Arrange — app montée avec NODE_ENV=production
      // Act
      const response = await request(prodApp)
        .get("/api/auth/demo")
        .redirects(0);

      // Assert — la route de bypass ne doit pas exister en production
      expect(response.status).toBe(404);
    });

    it("should return 404 when GET /api/auth/demo?role=admin in NODE_ENV=production", async () => {
      // Arrange
      // Act
      const response = await request(prodApp)
        .get("/api/auth/demo?role=admin")
        .redirects(0);

      // Assert
      expect(response.status).toBe(404);
    });

    it("should return 404 regardless of role param when NODE_ENV=production", async () => {
      // Arrange — essaie tous les rôles valides
      const roles = ["admin", "prod", "architecte", "po", "chef_projet", "viewer"];

      for (const role of roles) {
        // Act
        const response = await request(prodApp)
          .get(`/api/auth/demo?role=${role}`)
          .redirects(0);

        // Assert
        expect(response.status, `role=${role} devrait retourner 404 en production`).toBe(404);
      }
    });
  });
});
