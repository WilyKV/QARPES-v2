/**
 * RED PHASE — [Phase 3] RBAC server-side authorization
 *              [Phase 7] Admin endpoint protection
 *
 * Ces tests échouent jusqu'à ce que :
 *   - shared/permissions.ts existe
 *   - server/middleware/requirePermission.ts existe avec la signature :
 *       export function requirePermission(perm: string): RequestHandler
 *   - Ce middleware est appliqué sur les endpoints mutants dans server/routes.ts
 *   - GET /api/admin/audit-logs et DELETE /api/admin/audit-logs exigent le rôle admin
 *
 * Stratégie DB-safe :
 *   - Tests "DENY" (403) : aucune écriture DB (bloqué avant le handler)
 *   - Tests "ALLOW" DELETE/PUT : IDs inexistants (9999) → 404 sans écriture
 *   - Tests "ALLOW" POST : corps préfixé "_RBAC_TEST_" pour identifier les enregistrements
 *
 * Mapping endpoint → permission attendue :
 *   POST   /api/teams              → edit_teams        (admin, po, chef_projet)
 *   DELETE /api/teams/:id          → delete_teams      (admin seul)
 *   POST   /api/projects           → edit_projects     (admin, prod, po, chef_projet)
 *   DELETE /api/releases/:id       → delete_releases   (admin, prod)
 *   PUT    /api/arb/:id            → edit_arb          (admin, architecte)
 *   GET    /api/admin/audit-logs   → admin role        (admin seul)
 *   DELETE /api/admin/audit-logs   → admin role        (admin seul)
 */

import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createTestApp } from "../helpers/test-app.js";
import { loginAs } from "../helpers/auth.js";

// ---- types ------------------------------------------------------------------

type Role = "admin" | "prod" | "architecte" | "po" | "chef_projet" | "viewer";
type Expectation = "ALLOW" | "DENY";

// ---- setup ------------------------------------------------------------------

let app: Express;

beforeAll(async () => {
  app = await createTestApp();
}, 30_000);

// ---- helpers ----------------------------------------------------------------

/**
 * Exécute une requête HTTP pour un rôle donné et vérifie que le statut HTTP
 * correspond à l'attente : DENY → 403, ALLOW → tout sauf 403 (peut être
 * 200/201/400/404/500 selon l'état DB).
 */
async function assertRbac(
  method: "get" | "post" | "put" | "patch" | "delete",
  path: string,
  role: Role,
  expectation: Expectation,
  body?: Record<string, unknown>
): Promise<void> {
  // Arrange
  const cookie = await loginAs(app, role);

  // Act
  let req = request(app)[method](path).set("Cookie", cookie);
  if (body) req = req.send(body);
  const res = await req;

  // Assert
  if (expectation === "DENY") {
    expect(
      res.status,
      `${method.toUpperCase()} ${path} with role "${role}" should be 403 but got ${res.status}`
    ).toBe(403);
  } else {
    expect(
      res.status,
      `${method.toUpperCase()} ${path} with role "${role}" should NOT be 403 (got ${res.status})`
    ).not.toBe(403);
  }
}

// ---- tests ------------------------------------------------------------------

describe("[Phase 3] RBAC server-side authorization", () => {
  // --------------------------------------------------------------------------
  // POST /api/teams — requires edit_teams
  // Rôles autorisés : admin, po, chef_projet
  // Rôles refusés   : prod, architecte, viewer
  // --------------------------------------------------------------------------
  describe("POST /api/teams (requires edit_teams)", () => {
    const endpoint = { method: "post" as const, path: "/api/teams" };
    const body = { name: "_RBAC_TEST_post_teams" };

    it("should return 403 for viewer", async () => {
      await assertRbac(endpoint.method, endpoint.path, "viewer", "DENY", body);
    });

    it("should return 403 for prod", async () => {
      await assertRbac(endpoint.method, endpoint.path, "prod", "DENY", body);
    });

    it("should return 403 for architecte", async () => {
      await assertRbac(endpoint.method, endpoint.path, "architecte", "DENY", body);
    });

    it("should allow admin (status != 403)", async () => {
      await assertRbac(endpoint.method, endpoint.path, "admin", "ALLOW", body);
    });

    it("should allow po (status != 403)", async () => {
      await assertRbac(endpoint.method, endpoint.path, "po", "ALLOW", body);
    });

    it("should allow chef_projet (status != 403)", async () => {
      await assertRbac(endpoint.method, endpoint.path, "chef_projet", "ALLOW", body);
    });
  });

  // --------------------------------------------------------------------------
  // PUT /api/teams/:id — requires edit_teams
  // Rôles autorisés : admin, po, chef_projet
  // Rôles refusés   : prod, architecte, viewer
  // ID 9999 inexistant → 404 si ALLOW (aucune écriture DB)
  // --------------------------------------------------------------------------
  describe("PUT /api/teams/:id (requires edit_teams)", () => {
    const endpoint = { method: "put" as const, path: "/api/teams/9999" };
    const body = { name: "_RBAC_TEST_put_teams" };

    it("should return 403 for viewer", async () => {
      await assertRbac(endpoint.method, endpoint.path, "viewer", "DENY", body);
    });

    it("should return 403 for prod", async () => {
      await assertRbac(endpoint.method, endpoint.path, "prod", "DENY", body);
    });

    it("should return 403 for architecte", async () => {
      await assertRbac(endpoint.method, endpoint.path, "architecte", "DENY", body);
    });

    it("should allow admin (status != 403)", async () => {
      await assertRbac(endpoint.method, endpoint.path, "admin", "ALLOW", body);
    });

    it("should allow po (status != 403)", async () => {
      await assertRbac(endpoint.method, endpoint.path, "po", "ALLOW", body);
    });

    it("should allow chef_projet (status != 403)", async () => {
      await assertRbac(endpoint.method, endpoint.path, "chef_projet", "ALLOW", body);
    });
  });

  // --------------------------------------------------------------------------
  // DELETE /api/teams/:id — requires delete_teams
  // Rôles autorisés : admin uniquement
  // Rôles refusés   : prod, architecte, po, chef_projet, viewer
  // --------------------------------------------------------------------------
  describe("DELETE /api/teams/:id (requires delete_teams)", () => {
    const endpoint = { method: "delete" as const, path: "/api/teams/9999" };

    it("should return 403 for viewer", async () => {
      await assertRbac(endpoint.method, endpoint.path, "viewer", "DENY");
    });

    it("should return 403 for prod", async () => {
      await assertRbac(endpoint.method, endpoint.path, "prod", "DENY");
    });

    it("should return 403 for architecte", async () => {
      await assertRbac(endpoint.method, endpoint.path, "architecte", "DENY");
    });

    it("should return 403 for po", async () => {
      await assertRbac(endpoint.method, endpoint.path, "po", "DENY");
    });

    it("should return 403 for chef_projet", async () => {
      await assertRbac(endpoint.method, endpoint.path, "chef_projet", "DENY");
    });

    it("should allow admin only (status != 403, may be 404 for unknown id)", async () => {
      await assertRbac(endpoint.method, endpoint.path, "admin", "ALLOW");
    });
  });

  // --------------------------------------------------------------------------
  // POST /api/projects — requires edit_projects
  // Rôles autorisés : admin, prod, po, chef_projet
  // Rôles refusés   : architecte, viewer
  // --------------------------------------------------------------------------
  describe("POST /api/projects (requires edit_projects)", () => {
    const endpoint = { method: "post" as const, path: "/api/projects" };
    const body = { name: "_RBAC_TEST_post_projects", teamId: 1 };

    it("should return 403 for viewer", async () => {
      await assertRbac(endpoint.method, endpoint.path, "viewer", "DENY", body);
    });

    it("should return 403 for architecte", async () => {
      await assertRbac(endpoint.method, endpoint.path, "architecte", "DENY", body);
    });

    it("should allow admin (status != 403)", async () => {
      await assertRbac(endpoint.method, endpoint.path, "admin", "ALLOW", body);
    });

    it("should allow prod (status != 403)", async () => {
      await assertRbac(endpoint.method, endpoint.path, "prod", "ALLOW", body);
    });

    it("should allow po (status != 403)", async () => {
      await assertRbac(endpoint.method, endpoint.path, "po", "ALLOW", body);
    });

    it("should allow chef_projet (status != 403)", async () => {
      await assertRbac(endpoint.method, endpoint.path, "chef_projet", "ALLOW", body);
    });
  });

  // --------------------------------------------------------------------------
  // DELETE /api/releases/:id — requires delete_releases
  // Rôles autorisés : admin, prod  (d'après la matrice client existante)
  // Rôles refusés   : architecte, po, chef_projet, viewer
  // --------------------------------------------------------------------------
  describe("DELETE /api/releases/:id (requires delete_releases)", () => {
    const endpoint = { method: "delete" as const, path: "/api/releases/9999" };

    it("should return 403 for viewer", async () => {
      await assertRbac(endpoint.method, endpoint.path, "viewer", "DENY");
    });

    it("should return 403 for architecte", async () => {
      await assertRbac(endpoint.method, endpoint.path, "architecte", "DENY");
    });

    it("should return 403 for po", async () => {
      await assertRbac(endpoint.method, endpoint.path, "po", "DENY");
    });

    it("should return 403 for chef_projet", async () => {
      await assertRbac(endpoint.method, endpoint.path, "chef_projet", "DENY");
    });

    it("should allow admin (status != 403, may be 404 for unknown id)", async () => {
      await assertRbac(endpoint.method, endpoint.path, "admin", "ALLOW");
    });

    it("should allow prod (status != 403, may be 404 for unknown id)", async () => {
      await assertRbac(endpoint.method, endpoint.path, "prod", "ALLOW");
    });
  });

  // --------------------------------------------------------------------------
  // PUT /api/arb/:id — requires edit_arb
  // Rôles autorisés : admin, architecte
  // Rôles refusés   : prod, po, chef_projet, viewer
  // --------------------------------------------------------------------------
  describe("PUT /api/arb/:id (requires edit_arb)", () => {
    const endpoint = { method: "put" as const, path: "/api/arb/9999" };
    const body = { title: "_RBAC_TEST_put_arb" };

    it("should return 403 for viewer", async () => {
      await assertRbac(endpoint.method, endpoint.path, "viewer", "DENY", body);
    });

    it("should return 403 for prod", async () => {
      await assertRbac(endpoint.method, endpoint.path, "prod", "DENY", body);
    });

    it("should return 403 for po", async () => {
      await assertRbac(endpoint.method, endpoint.path, "po", "DENY", body);
    });

    it("should return 403 for chef_projet", async () => {
      await assertRbac(endpoint.method, endpoint.path, "chef_projet", "DENY", body);
    });

    it("should allow admin (status != 403)", async () => {
      await assertRbac(endpoint.method, endpoint.path, "admin", "ALLOW", body);
    });

    it("should allow architecte (status != 403)", async () => {
      await assertRbac(endpoint.method, endpoint.path, "architecte", "ALLOW", body);
    });
  });

  // --------------------------------------------------------------------------
  // POST /api/releases — requires edit_releases
  // Rôles autorisés : admin, prod
  // Rôles refusés   : architecte, po, chef_projet, viewer
  // --------------------------------------------------------------------------
  describe("POST /api/releases (requires edit_releases)", () => {
    const endpoint = { method: "post" as const, path: "/api/releases" };
    const body = { name: "_RBAC_TEST_post_releases", status: "planifiee" };

    it("should return 403 for viewer", async () => {
      await assertRbac(endpoint.method, endpoint.path, "viewer", "DENY", body);
    });

    it("should return 403 for architecte", async () => {
      await assertRbac(endpoint.method, endpoint.path, "architecte", "DENY", body);
    });

    it("should return 403 for po", async () => {
      await assertRbac(endpoint.method, endpoint.path, "po", "DENY", body);
    });

    it("should return 403 for chef_projet", async () => {
      await assertRbac(endpoint.method, endpoint.path, "chef_projet", "DENY", body);
    });

    it("should allow admin (status != 403)", async () => {
      await assertRbac(endpoint.method, endpoint.path, "admin", "ALLOW", body);
    });

    it("should allow prod (status != 403)", async () => {
      await assertRbac(endpoint.method, endpoint.path, "prod", "ALLOW", body);
    });
  });
});

// ============================================================================
// [Phase 7] Admin endpoints — rôle admin requis (pas juste être authentifié)
// ============================================================================

describe("[Phase 7] Admin endpoints — require admin role", () => {
  // --------------------------------------------------------------------------
  // GET /api/admin/audit-logs
  // Actuellement : tout utilisateur authentifié peut accéder (bug)
  // Attendu      : seul admin peut accéder
  // --------------------------------------------------------------------------
  describe("GET /api/admin/audit-logs (requires admin role)", () => {
    it("should return 403 for viewer", async () => {
      await assertRbac("get", "/api/admin/audit-logs", "viewer", "DENY");
    });

    it("should return 403 for prod", async () => {
      await assertRbac("get", "/api/admin/audit-logs", "prod", "DENY");
    });

    it("should return 403 for architecte", async () => {
      await assertRbac("get", "/api/admin/audit-logs", "architecte", "DENY");
    });

    it("should return 403 for po", async () => {
      await assertRbac("get", "/api/admin/audit-logs", "po", "DENY");
    });

    it("should return 403 for chef_projet", async () => {
      await assertRbac("get", "/api/admin/audit-logs", "chef_projet", "DENY");
    });

    it("should return 200 for admin", async () => {
      // Arrange
      const cookie = await loginAs(app, "admin");

      // Act
      const res = await request(app)
        .get("/api/admin/audit-logs")
        .set("Cookie", cookie);

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("logs");
      expect(res.body).toHaveProperty("pagination");
    });
  });

  // --------------------------------------------------------------------------
  // DELETE /api/admin/audit-logs
  // Actuellement : tout utilisateur authentifié peut déclencher le cleanup
  // Attendu      : seul admin peut déclencher
  // --------------------------------------------------------------------------
  describe("DELETE /api/admin/audit-logs (requires admin role)", () => {
    it("should return 403 for viewer", async () => {
      await assertRbac("delete", "/api/admin/audit-logs", "viewer", "DENY");
    });

    it("should return 403 for prod", async () => {
      await assertRbac("delete", "/api/admin/audit-logs", "prod", "DENY");
    });

    it("should return 403 for architecte", async () => {
      await assertRbac("delete", "/api/admin/audit-logs", "architecte", "DENY");
    });

    it("should return 403 for po", async () => {
      await assertRbac("delete", "/api/admin/audit-logs", "po", "DENY");
    });

    it("should return 403 for chef_projet", async () => {
      await assertRbac("delete", "/api/admin/audit-logs", "chef_projet", "DENY");
    });

    it("should return 200 for admin", async () => {
      // Arrange
      const cookie = await loginAs(app, "admin");

      // Act
      const res = await request(app)
        .delete("/api/admin/audit-logs")
        .set("Cookie", cookie);

      // Assert — 200 avec message de succès
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message");
    });
  });
});
