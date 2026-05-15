/**
 * RED PHASE — these tests will fail until Phase 5 (session cookie hardening) is implemented.
 *
 * Phase 5 — Durcissement HTTP : Session Cookie
 *
 * Pour faire passer ces tests, le developer doit modifier server/replitAuth.ts
 * dans la fonction getSession() :
 *
 *   return session({
 *     secret: process.env.SESSION_SECRET!,
 *     store: sessionStore,
 *     resave: false,
 *     saveUninitialized: false,   // ← CHANGER true → false
 *     cookie: {
 *       httpOnly: true,           // ← déjà présent, OK
 *       secure: process.env.NODE_ENV === "production",  // ← déjà présent, OK
 *       sameSite: "lax",          // ← AJOUTER (lax recommandé car OAuth Microsoft fait des redirections cross-site)
 *       maxAge: sessionTtl,
 *     },
 *   });
 *
 * Pourquoi `lax` et pas `strict` ?
 *   SameSite=strict bloquerait le retour du callback OAuth Microsoft (cross-site redirect).
 *   SameSite=lax autorise les navigations top-level cross-site (GET) mais bloque les requêtes
 *   cross-site initiées par JS (fetch, XHR, formulaires POST) — bon compromis pour OAuth.
 *
 * Pourquoi saveUninitialized: false ?
 *   Évite de créer des sessions vides pour les requêtes non authentifiées.
 *   Réduit la charge sur le store PostgreSQL et évite les fuites d'informations
 *   (un attaquant ne peut pas savoir si l'app tourne par l'existence d'un cookie).
 */

import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createTestApp } from "../helpers/test-app";

describe("[Phase 5] Session cookie hardening", () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp({ nodeEnv: "development" });
  });

  // ─────────────────────────────────────────────────────────────
  // HttpOnly
  // ─────────────────────────────────────────────────────────────
  it("should set HttpOnly flag on session cookie when GET /api/auth/demo?role=admin", async () => {
    // Arrange — on appelle la route demo sans suivre le redirect
    // Act
    const res = await request(app)
      .get("/api/auth/demo?role=admin")
      .redirects(0);

    // Assert
    const cookies = res.headers["set-cookie"] as unknown as string[];
    expect(cookies, "Set-Cookie header doit être présent après login demo").toBeDefined();
    expect(
      cookies.some((c) => /HttpOnly/i.test(c)),
      `Aucun cookie avec HttpOnly dans : ${JSON.stringify(cookies)}`
    ).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────
  // SameSite=Lax (ou Strict)
  // ─────────────────────────────────────────────────────────────
  it("should set SameSite=Lax (or Strict) on session cookie", async () => {
    // Arrange
    // Act
    const res = await request(app)
      .get("/api/auth/demo?role=admin")
      .redirects(0);

    // Assert
    // RED: sans sameSite configuré dans express-session, l'attribut sera absent
    const cookies = res.headers["set-cookie"] as unknown as string[];
    expect(cookies, "Set-Cookie header doit être présent").toBeDefined();
    expect(
      cookies.some((c) => /SameSite=(Lax|Strict)/i.test(c)),
      `SameSite=Lax ou SameSite=Strict absent dans : ${JSON.stringify(cookies)}`
    ).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────
  // Secure flag absent en dev
  // ─────────────────────────────────────────────────────────────
  it("should NOT set Secure flag in development (NODE_ENV !== production)", async () => {
    // Arrange — createTestApp en dev (NODE_ENV = 'development')
    // Act
    const res = await request(app)
      .get("/api/auth/demo?role=admin")
      .redirects(0);

    // Assert — en dev, le flag Secure doit être absent pour pouvoir tester en HTTP
    // La config actuelle a `secure: process.env.NODE_ENV === 'production'` → OK en dev
    const cookies = res.headers["set-cookie"] as unknown as string[];
    expect(cookies, "Set-Cookie header doit être présent").toBeDefined();
    expect(
      cookies.some((c) => /;\s*Secure/i.test(c)),
      `Le flag Secure ne doit pas être présent en dev. Cookies : ${JSON.stringify(cookies)}`
    ).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────
  // saveUninitialized: false
  // ─────────────────────────────────────────────────────────────
  it("should NOT create a session (no Set-Cookie) on unauthenticated GET /api/teams", async () => {
    // Arrange — aucune authentification, appel d'une route protégée
    // Act
    const res = await request(app).get("/api/teams");

    // Assert
    // RED: avec saveUninitialized: true (config actuelle), express-session crée une session
    // même pour les requêtes non authentifiées → Set-Cookie présent alors qu'il ne devrait pas l'être.
    // Après Phase 5, saveUninitialized: false → pas de session vide → pas de Set-Cookie.
    expect(res.status).toBe(401);
    expect(
      res.headers["set-cookie"],
      "Aucun Set-Cookie ne doit être émis pour une requête non authentifiée (saveUninitialized: false)"
    ).toBeUndefined();
  });

  it("should NOT create a session (no Set-Cookie) on unauthenticated GET /api/releases", async () => {
    // Arrange
    // Act
    const res = await request(app).get("/api/releases");

    // Assert — même vérification sur une autre route protégée
    expect(res.status).toBe(401);
    expect(
      res.headers["set-cookie"],
      "Aucun Set-Cookie ne doit être émis pour une requête non authentifiée (saveUninitialized: false)"
    ).toBeUndefined();
  });

  // ─────────────────────────────────────────────────────────────
  // Cookie correctement émis après authentification
  // ─────────────────────────────────────────────────────────────
  it("should emit a session cookie on successful demo login and allow subsequent authenticated requests", async () => {
    // Arrange — login via demo
    const loginRes = await request(app)
      .get("/api/auth/demo?role=admin")
      .redirects(0);

    const cookieHeader = loginRes.headers["set-cookie"] as unknown as string[];
    expect(cookieHeader, "Set-Cookie doit être présent après login").toBeDefined();

    // Extraire la partie name=value du cookie (avant le premier ;)
    const cookie = cookieHeader
      .map((c: string) => c.split(";")[0])
      .join("; ");

    // Act — utiliser le cookie sur une route protégée
    const protectedRes = await request(app)
      .get("/api/teams")
      .set("Cookie", cookie);

    // Assert — la session doit permettre l'accès
    expect(protectedRes.status).toBe(200);
  });
});
