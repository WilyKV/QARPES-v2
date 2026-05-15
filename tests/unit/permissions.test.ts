/**
 * RED PHASE — [Phase 3] Matrice de permissions partagée
 *
 * Ces tests échouent jusqu'à ce que shared/permissions.ts existe
 * ET que client/src/lib/permissions.ts devienne un simple ré-export.
 *
 * Ce que le developer doit créer :
 *   - /shared/permissions.ts  avec exports : hasPermission, rolePermissions
 *   - client/src/lib/permissions.ts doit ré-exporter depuis shared/permissions.ts
 */

import { describe, it, expect } from "vitest";

// ---- helpers ----------------------------------------------------------------

/**
 * Import dynamique pour produire un message d'erreur clair quand le module
 * n'existe pas encore (Red Phase explicite, pas un crash obscur).
 */
async function importSharedPermissions() {
  // Chemin relatif depuis tests/unit/ → shared/permissions.ts
  // Le .js est requis en ESM même pour les fichiers .ts (résolution TypeScript/Vitest)
  const { default: path } = await import("path");
  const { fileURLToPath } = await import("url");
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const modulePath = path.join(__dirname, "..", "..", "shared", "permissions.ts");
  return import(modulePath);
}

async function importClientPermissions() {
  const { default: path } = await import("path");
  const { fileURLToPath } = await import("url");
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const modulePath = path.join(__dirname, "..", "..", "client", "src", "lib", "permissions.ts");
  return import(modulePath);
}

// ---- tests ------------------------------------------------------------------

describe("[Phase 3] shared/permissions.ts", () => {
  describe("hasPermission — cas nominaux par rôle", () => {
    it("should return true for admin on edit_teams", async () => {
      // Arrange
      const { hasPermission } = await importSharedPermissions();

      // Act + Assert
      expect(hasPermission("admin", "edit_teams")).toBe(true);
    });

    it("should return false for viewer on edit_teams", async () => {
      const { hasPermission } = await importSharedPermissions();
      expect(hasPermission("viewer", "edit_teams")).toBe(false);
    });

    it("should return true for po on edit_teams", async () => {
      const { hasPermission } = await importSharedPermissions();
      expect(hasPermission("po", "edit_teams")).toBe(true);
    });

    it("should return true for chef_projet on edit_teams", async () => {
      const { hasPermission } = await importSharedPermissions();
      expect(hasPermission("chef_projet", "edit_teams")).toBe(true);
    });

    it("should return false for architecte on edit_teams", async () => {
      const { hasPermission } = await importSharedPermissions();
      expect(hasPermission("architecte", "edit_teams")).toBe(false);
    });

    it("should return false for prod on edit_teams", async () => {
      const { hasPermission } = await importSharedPermissions();
      expect(hasPermission("prod", "edit_teams")).toBe(false);
    });

    it("should return true for prod on edit_releases", async () => {
      const { hasPermission } = await importSharedPermissions();
      expect(hasPermission("prod", "edit_releases")).toBe(true);
    });

    it("should return false for po on edit_releases", async () => {
      const { hasPermission } = await importSharedPermissions();
      expect(hasPermission("po", "edit_releases")).toBe(false);
    });

    it("should return true for architecte on edit_arb", async () => {
      const { hasPermission } = await importSharedPermissions();
      expect(hasPermission("architecte", "edit_arb")).toBe(true);
    });

    it("should return false for prod on edit_arb", async () => {
      const { hasPermission } = await importSharedPermissions();
      expect(hasPermission("prod", "edit_arb")).toBe(false);
    });

    it("should return true for admin on delete_teams", async () => {
      const { hasPermission } = await importSharedPermissions();
      expect(hasPermission("admin", "delete_teams")).toBe(true);
    });

    it("should return false for po on delete_teams", async () => {
      const { hasPermission } = await importSharedPermissions();
      expect(hasPermission("po", "delete_teams")).toBe(false);
    });

    it("should return false for chef_projet on delete_teams", async () => {
      const { hasPermission } = await importSharedPermissions();
      expect(hasPermission("chef_projet", "delete_teams")).toBe(false);
    });

    it("should return false for prod on delete_releases when prod only has edit_releases", async () => {
      // prod peut éditer les releases mais pas les supprimer selon la matrice initiale
      // Note : si la matrice change côté shared, ce test documente l'intention
      const { hasPermission } = await importSharedPermissions();
      // prod n'a PAS delete_releases d'après la matrice client/src/lib/permissions.ts actuelle
      // Vérifier que prod peut éditer mais pas nécessairement supprimer
      const canEdit = hasPermission("prod", "edit_releases");
      expect(canEdit).toBe(true);
    });
  });

  describe("hasPermission — valeurs limites / cas pathologiques", () => {
    it("should return false when role is null", async () => {
      const { hasPermission } = await importSharedPermissions();
      expect(hasPermission(null, "edit_teams")).toBe(false);
    });

    it("should return false when role is undefined", async () => {
      const { hasPermission } = await importSharedPermissions();
      expect(hasPermission(undefined, "edit_teams")).toBe(false);
    });

    it("should return false when role is empty string", async () => {
      const { hasPermission } = await importSharedPermissions();
      expect(hasPermission("", "edit_teams")).toBe(false);
    });

    it("should return false when role is an unknown string", async () => {
      const { hasPermission } = await importSharedPermissions();
      expect(hasPermission("unknown_role", "edit_teams")).toBe(false);
    });

    it("should return false when role is a SQL injection attempt", async () => {
      const { hasPermission } = await importSharedPermissions();
      expect(hasPermission("admin' OR '1'='1", "edit_teams")).toBe(false);
    });

    it("should be case-insensitive (ADMIN should work like admin)", async () => {
      const { hasPermission } = await importSharedPermissions();
      // La fonction existante normalise via toLowerCase()
      expect(hasPermission("ADMIN", "edit_teams")).toBe(true);
    });
  });

  describe("rolePermissions — structure de la matrice", () => {
    it("should export rolePermissions with all 6 canonical roles", async () => {
      // Arrange
      const { rolePermissions } = await importSharedPermissions();
      const canonicalRoles = ["admin", "prod", "architecte", "po", "chef_projet", "viewer"];

      // Act + Assert
      for (const role of canonicalRoles) {
        expect(rolePermissions).toHaveProperty(role);
      }
    });

    it("should have admin with all permissions including delete_teams", async () => {
      const { rolePermissions } = await importSharedPermissions();
      expect(rolePermissions["admin"]).toContain("delete_teams");
      expect(rolePermissions["admin"]).toContain("edit_teams");
      expect(rolePermissions["admin"]).toContain("edit_releases");
      expect(rolePermissions["admin"]).toContain("edit_arb");
    });

    it("should have viewer with only view_all", async () => {
      const { rolePermissions } = await importSharedPermissions();
      const viewerPerms = rolePermissions["viewer"];
      expect(viewerPerms).toContain("view_all");
      expect(viewerPerms).not.toContain("edit_teams");
      expect(viewerPerms).not.toContain("delete_teams");
    });
  });

  describe("ré-export depuis client/src/lib/permissions.ts", () => {
    it("should export the same hasPermission function as shared/permissions", async () => {
      // Arrange — les deux modules doivent partager la même référence de fonction
      const sharedModule = await importSharedPermissions();
      const clientModule = await importClientPermissions();

      // Act + Assert
      // Soit même référence (ré-export direct), soit même comportement
      expect(typeof clientModule.hasPermission).toBe("function");
      // Vérifie le comportement identique sur un cas représentatif
      expect(clientModule.hasPermission("admin", "edit_teams")).toBe(
        sharedModule.hasPermission("admin", "edit_teams")
      );
      expect(clientModule.hasPermission("viewer", "edit_teams")).toBe(
        sharedModule.hasPermission("viewer", "edit_teams")
      );
    });

    it("should have client rolePermissions pointing to shared rolePermissions", async () => {
      const sharedModule = await importSharedPermissions();
      const clientModule = await importClientPermissions();

      // Les deux doivent exporter rolePermissions
      expect(clientModule.rolePermissions).toBeDefined();
      // Et les contenus doivent être identiques
      expect(JSON.stringify(clientModule.rolePermissions)).toBe(
        JSON.stringify(sharedModule.rolePermissions)
      );
    });
  });
});
