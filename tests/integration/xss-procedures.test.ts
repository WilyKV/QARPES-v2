/**
 * RED PHASE — [Phase 6] XSS sanitization on procedure content (integration)
 *
 * Ces tests échouent jusqu'à ce que :
 *   1. server/lib/sanitize.ts soit créé (exporte sanitizeRichText)
 *   2. La sanitisation soit câblée dans storage.createProcedure() et
 *      storage.updateProcedure() — champ `content` du modèle Procedure
 *   3. server/app.ts soit créé (requis par createTestApp)
 *
 * Routes procedure existantes dans server/routes.ts :
 *   POST /api/version-git-repos/:versionGitRepoId/procedures  → createProcedure
 *   PATCH /api/procedures/:id                                  → updateProcedure
 *
 * TODO (developer) — Prérequis pour activer les tests it.skip :
 *   - Exposer une fonction de seed dans les helpers de test OU documenter
 *     un versionGitRepoId connu inséré par les fixtures (server/fixtures-complete.ts).
 *   - Alternativement : créer un helper tests/helpers/seed-procedure.ts qui
 *     utilise directement prisma pour insérer un ProjectVersion + GitRepo +
 *     ProjectVersionGitRepo de test, retourne son ID, et les supprime en afterAll.
 *   - Sans cela, les tests d'intégration ne peuvent pas déterminer un
 *     versionGitRepoId valide sans requêter la DB.
 *
 * Paquet recommandé côté sanitisation : sanitize-html (npm install sanitize-html @types/sanitize-html)
 */

import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createTestApp } from "../helpers/test-app";
import { loginAs } from "../helpers/auth";
import type { Express } from "express";

// =============================================================================
// [Phase 6] XSS sanitization on procedure content
// =============================================================================

describe("[Phase 6] XSS sanitization on procedure content", () => {
  let app: Express;
  let adminCookie: string;

  beforeAll(async () => {
    // createTestApp échoue tant que server/app.ts n'est pas créé (Red Phase)
    app = await createTestApp();
    adminCookie = await loginAs(app, "admin");
  });

  // ---------------------------------------------------------------------------
  // Smoke test : vérifier que la dépendance de sanitisation est importable
  // Ce test DOIT passer une fois sanitize-html installé, MÊME AVANT que
  // le câblage dans storage soit fait. C'est la première "Green" attendue.
  // ---------------------------------------------------------------------------

  describe("dependency availability", () => {
    it("should have sanitizeRichText importable from server/lib/sanitize.ts", async () => {
      // Arrange
      const { fileURLToPath } = await import("url");
      const { default: path } = await import("path");
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const modulePath = path.join(__dirname, "..", "..", "server", "lib", "sanitize.ts");

      // Act
      const mod = await import(modulePath);

      // Assert
      expect(mod.sanitizeRichText).toBeDefined();
      expect(typeof mod.sanitizeRichText).toBe("function");
    });
  });

  // ---------------------------------------------------------------------------
  // Tests d'intégration via HTTP — nécessitent createTestApp + un versionGitRepoId valide
  //
  // TODO (developer) : remplacer KNOWN_VERSION_GIT_REPO_ID par l'ID réel
  // d'une entrée ProjectVersionGitRepo créée par les fixtures.
  // Chercher dans server/fixtures-complete.ts la création de
  // ProjectVersionGitRepo (table pivot entre ProjectVersion et GitRepo).
  // ---------------------------------------------------------------------------

  // Sentinel : si le developer fournit un ID connu via variable d'environnement,
  // les tests passent de it.skip à it actif.
  const KNOWN_VERSION_GIT_REPO_ID = process.env.TEST_VERSION_GIT_REPO_ID
    ? parseInt(process.env.TEST_VERSION_GIT_REPO_ID, 10)
    : null;

  const itOrSkip = KNOWN_VERSION_GIT_REPO_ID !== null ? it : it.skip;

  describe("POST /api/version-git-repos/:id/procedures — content sanitization on creation", () => {
    itOrSkip(
      "should strip <script> from procedure.content on creation",
      async () => {
        // Arrange
        const payload = {
          type: "command_execution",
          title: "Deploy step",
          content: "<p>Run deploy</p><script>alert(1)</script>",
          order: 1,
        };

        // Act
        const response = await request(app)
          .post(`/api/version-git-repos/${KNOWN_VERSION_GIT_REPO_ID}/procedures`)
          .set("Cookie", adminCookie)
          .send(payload)
          .expect(201);

        // Assert
        expect(response.body.content).toBeDefined();
        expect(response.body.content).not.toContain("<script>");
        expect(response.body.content).not.toContain("alert(1)");
        expect(response.body.content).toContain("<p>Run deploy</p>");
      }
    );

    itOrSkip(
      "should strip on* attributes from procedure.content on creation",
      async () => {
        // Arrange
        const payload = {
          type: "command_execution",
          title: "Step with XSS attr",
          content: '<p onclick="steal()">Click here</p>',
          order: 2,
        };

        // Act
        const response = await request(app)
          .post(`/api/version-git-repos/${KNOWN_VERSION_GIT_REPO_ID}/procedures`)
          .set("Cookie", adminCookie)
          .send(payload)
          .expect(201);

        // Assert
        expect(response.body.content).not.toContain("onclick");
        expect(response.body.content).toContain("Click here");
      }
    );

    itOrSkip(
      "should strip javascript: URLs from procedure.content on creation",
      async () => {
        // Arrange
        const payload = {
          type: "data_import",
          title: "Import step",
          content: '<p>See <a href="javascript:alert(1)">link</a></p>',
          order: 3,
        };

        // Act
        const response = await request(app)
          .post(`/api/version-git-repos/${KNOWN_VERSION_GIT_REPO_ID}/procedures`)
          .set("Cookie", adminCookie)
          .send(payload)
          .expect(201);

        // Assert
        expect(response.body.content).not.toContain("javascript:");
        expect(response.body.content).toContain("link");
      }
    );

    itOrSkip(
      "should preserve <strong> and <em> in procedure.content on creation",
      async () => {
        // Arrange
        const payload = {
          type: "service_verification",
          title: "Verify step",
          content: "<p><strong>Important:</strong> <em>check logs</em></p>",
          order: 4,
        };

        // Act
        const response = await request(app)
          .post(`/api/version-git-repos/${KNOWN_VERSION_GIT_REPO_ID}/procedures`)
          .set("Cookie", adminCookie)
          .send(payload)
          .expect(201);

        // Assert
        expect(response.body.content).toContain("<strong>Important:</strong>");
        expect(response.body.content).toContain("<em>check logs</em>");
      }
    );
  });

  describe("PATCH /api/procedures/:id — content sanitization on update", () => {
    itOrSkip(
      "should strip <script> from procedure.content on update (PATCH)",
      async () => {
        // Arrange — créer d'abord une procédure légitime
        const createResponse = await request(app)
          .post(`/api/version-git-repos/${KNOWN_VERSION_GIT_REPO_ID}/procedures`)
          .set("Cookie", adminCookie)
          .send({
            type: "command_execution",
            title: "Procedure to update",
            content: "<p>Initial content</p>",
            order: 10,
          })
          .expect(201);

        const procedureId = createResponse.body.id;

        // Act — mettre à jour avec du contenu malicieux
        const updateResponse = await request(app)
          .patch(`/api/procedures/${procedureId}`)
          .set("Cookie", adminCookie)
          .send({
            content: "<p>Updated</p><script>steal(document.cookie)</script>",
          })
          .expect(200);

        // Assert
        expect(updateResponse.body.content).not.toContain("<script>");
        expect(updateResponse.body.content).not.toContain("steal");
        expect(updateResponse.body.content).toContain("<p>Updated</p>");
      }
    );

    itOrSkip(
      "should preserve null content without error on update (PATCH)",
      async () => {
        // Arrange
        const createResponse = await request(app)
          .post(`/api/version-git-repos/${KNOWN_VERSION_GIT_REPO_ID}/procedures`)
          .set("Cookie", adminCookie)
          .send({
            type: "environment_variables",
            title: "Env step",
            content: "<p>Env variables</p>",
            order: 20,
          })
          .expect(201);

        const procedureId = createResponse.body.id;

        // Act — mettre à jour en effaçant le content (null)
        const updateResponse = await request(app)
          .patch(`/api/procedures/${procedureId}`)
          .set("Cookie", adminCookie)
          .send({ content: null })
          .expect(200);

        // Assert — pas d'erreur 500, le content null est accepté
        expect(updateResponse.status).toBe(200);
      }
    );
  });

  // ---------------------------------------------------------------------------
  // Test de non-régression : les routes procedures répondent toujours
  // ---------------------------------------------------------------------------

  describe("non-regression — procedures routes still respond", () => {
    it("should return 401 when calling POST /api/version-git-repos/1/procedures without auth", async () => {
      // Arrange + Act
      const response = await request(app)
        .post("/api/version-git-repos/1/procedures")
        .send({
          type: "command_execution",
          title: "Test",
          content: "<p>test</p>",
        });

      // Assert — 401 car pas de cookie de session
      expect(response.status).toBe(401);
    });

    it("should return 401 when calling PATCH /api/procedures/1 without auth", async () => {
      // Arrange + Act
      const response = await request(app)
        .patch("/api/procedures/1")
        .send({ content: "<p>updated</p>" });

      // Assert
      expect(response.status).toBe(401);
    });
  });
});
