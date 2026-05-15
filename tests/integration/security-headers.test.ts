/**
 * RED PHASE — these tests will fail until Phase 5 (helmet) is implemented.
 *
 * Phase 5 — Durcissement HTTP : Helmet
 *
 * Pour faire passer ces tests, le developer doit :
 *   1. Installer helmet : `npm install helmet`
 *   2. Dans server/app.ts (ou server/routes.ts), monter helmet EN PREMIER middleware :
 *        import helmet from "helmet";
 *        app.use(helmet());
 *      Helmet par défaut supprime X-Powered-By et positionne :
 *        - X-Content-Type-Options: nosniff
 *        - X-Frame-Options: SAMEORIGIN
 *        - Referrer-Policy: no-referrer
 *        - X-DNS-Prefetch-Control: off
 *        - Strict-Transport-Security (en prod uniquement)
 *      Ne pas activer contentSecurityPolicy en dev (incompatible avec Vite HMR).
 *
 * Note : ne pas tester la CSP ici (complexe avec Vite en dev).
 * Tester uniquement les headers simples retournés par défaut par helmet.
 */

import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createTestApp } from "../helpers/test-app";

describe("[Phase 5] Security HTTP headers", () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp({ nodeEnv: "development" });
  });

  // ─────────────────────────────────────────────────────────────
  // X-Content-Type-Options
  // ─────────────────────────────────────────────────────────────
  it("should set X-Content-Type-Options: nosniff on GET /api/auth/user", async () => {
    // Arrange — aucune session (la route retournera 401, mais on veut juste les headers)
    // Act
    const res = await request(app).get("/api/auth/user");

    // Assert — helmet doit ajouter ce header quelle que soit la réponse
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  // ─────────────────────────────────────────────────────────────
  // X-Frame-Options
  // ─────────────────────────────────────────────────────────────
  it("should set X-Frame-Options on GET /api/auth/user (SAMEORIGIN or DENY)", async () => {
    // Arrange
    // Act
    const res = await request(app).get("/api/auth/user");

    // Assert — helmet default est SAMEORIGIN ; DENY est aussi acceptable
    expect(["SAMEORIGIN", "DENY"]).toContain(res.headers["x-frame-options"]);
  });

  // ─────────────────────────────────────────────────────────────
  // X-Powered-By supprimé
  // ─────────────────────────────────────────────────────────────
  it("should hide X-Powered-By: Express header on GET /api/auth/user", async () => {
    // Arrange
    // Act
    const res = await request(app).get("/api/auth/user");

    // Assert — Express expose X-Powered-By par défaut ; helmet le supprime
    // RED: sans helmet, ce header sera présent (valeur "Express")
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  // ─────────────────────────────────────────────────────────────
  // Referrer-Policy
  // ─────────────────────────────────────────────────────────────
  it("should set Referrer-Policy header on GET /api/auth/user", async () => {
    // Arrange
    // Act
    const res = await request(app).get("/api/auth/user");

    // Assert — helmet positionne referrer-policy (valeur exacte dépend de la config)
    // RED: sans helmet, ce header est absent
    expect(res.headers["referrer-policy"]).toBeDefined();
    expect(typeof res.headers["referrer-policy"]).toBe("string");
    expect((res.headers["referrer-policy"] as string).length).toBeGreaterThan(0);
  });

  // ─────────────────────────────────────────────────────────────
  // X-DNS-Prefetch-Control
  // ─────────────────────────────────────────────────────────────
  it("should set X-DNS-Prefetch-Control: off on GET /api/auth/user", async () => {
    // Arrange
    // Act
    const res = await request(app).get("/api/auth/user");

    // Assert — helmet positionne ce header à "off" par défaut
    // RED: sans helmet, ce header est absent
    expect(res.headers["x-dns-prefetch-control"]).toBe("off");
  });

  // ─────────────────────────────────────────────────────────────
  // Headers présents sur toutes les routes (pas seulement /api/auth/user)
  // ─────────────────────────────────────────────────────────────
  it("should set X-Content-Type-Options on a protected route like GET /api/teams (401 case)", async () => {
    // Arrange — route protégée, aucune session
    // Act
    const res = await request(app).get("/api/teams");

    // Assert — même une réponse 401 doit avoir les headers de sécurité
    expect(res.status).toBe(401);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("should NOT set Strict-Transport-Security in development (NODE_ENV !== production)", async () => {
    // Arrange — createTestApp utilise nodeEnv: 'development'
    // Act
    const res = await request(app).get("/api/auth/user");

    // Assert — HSTS ne doit pas être forcé en dev (pas de HTTPS local)
    // En dev, helmet ne positionne pas HSTS par défaut si l'option est désactivée
    // NOTE : si le developer configure helmet() sans options particulières,
    // HSTS sera absent en dev. C'est le comportement attendu.
    // Ce test vérifie la NON-présence en dev.
    expect(res.headers["strict-transport-security"]).toBeUndefined();
  });
});
