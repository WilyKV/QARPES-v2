/**
 * RED PHASE — these tests will fail until Phase 5 (express-rate-limit) is implemented.
 *
 * Phase 5 — Durcissement HTTP : Rate Limiting
 *
 * Pour faire passer ces tests, le developer doit :
 *   1. Installer : `npm install express-rate-limit`
 *   2. Dans server/app.ts (ou server/routes.ts), créer un limiter et l'appliquer
 *      UNIQUEMENT aux routes d'authentification :
 *
 *        import rateLimit from "express-rate-limit";
 *
 *        const authLimiter = rateLimit({
 *          windowMs: 15 * 60 * 1000,  // 15 minutes
 *          max: 10,                    // 10 requêtes max par IP par fenêtre
 *          standardHeaders: true,      // Retourne les headers RateLimit-*
 *          legacyHeaders: false,
 *          message: { message: "Too many requests, please try again later." },
 *        });
 *
 *        app.use("/api/login", authLimiter);
 *        app.use("/api/callback", authLimiter);
 *        app.use("/api/auth/demo", authLimiter);
 *
 *   3. IMPORTANT — trust proxy :
 *      express-rate-limit lit l'IP via `req.ip`. Derrière supertest, req.ip vaut
 *      "::ffff:127.0.0.1" (IPv4-mapped IPv6). Pour que X-Forwarded-For soit pris
 *      en compte (permettant des IPs distinctes dans les tests), l'app doit avoir :
 *
 *        app.set("trust proxy", 1);   // ou true
 *
 *      Ceci est déjà configuré dans setupAuth() (server/replitAuth.ts).
 *      Le limiter utilisera alors req.ip = X-Forwarded-For s'il est présent.
 *
 * Stratégie des tests :
 *   - Chaque test utilise une IP distincte via X-Forwarded-For pour isoler
 *     les compteurs en mémoire entre tests (pas de reset manuel nécessaire).
 *   - Le store par défaut de express-rate-limit est en mémoire (MemoryStore),
 *     ce qui est correct pour les tests.
 *   - 11 appels sur 10 max → le 11e doit recevoir 429.
 */

import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createTestApp } from "../helpers/test-app";

describe("[Phase 5] Rate limiting on auth endpoints", () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp({ nodeEnv: "development" });
  });

  // ─────────────────────────────────────────────────────────────
  // /api/auth/demo — 10 req/15min par IP
  // ─────────────────────────────────────────────────────────────
  it("should return 429 after 10 requests to /api/auth/demo within the rate limit window", async () => {
    // Arrange — IP unique pour ce test (isolée des autres tests)
    const ip = "10.0.1.10";
    let lastStatus = 0;

    // Act — 11 appels successifs depuis la même IP
    for (let i = 0; i < 11; i++) {
      const res = await request(app)
        .get("/api/auth/demo?role=viewer")
        .set("X-Forwarded-For", ip)
        .redirects(0);
      lastStatus = res.status;
    }

    // Assert — le 11e appel doit retourner 429 Too Many Requests
    // RED: sans rate-limit, tous les appels retournent 302
    expect(lastStatus).toBe(429);
  });

  it("should return 429 after 10 requests to /api/login within the rate limit window", async () => {
    // Arrange — IP unique différente de celle utilisée ci-dessus
    const ip = "10.0.1.11";
    let lastStatus = 0;

    // Act — 11 appels successifs
    for (let i = 0; i < 11; i++) {
      const res = await request(app)
        .get("/api/login")
        .set("X-Forwarded-For", ip)
        .redirects(0);
      lastStatus = res.status;
    }

    // Assert
    // RED: sans rate-limit, /api/login retourne 500 (config Azure manquante) ou 302
    // Après Phase 5, le 11e appel doit retourner 429
    expect(lastStatus).toBe(429);
  });

  it("should return 429 after 10 requests to /api/callback within the rate limit window", async () => {
    // Arrange — IP unique
    const ip = "10.0.1.12";
    let lastStatus = 0;

    // Act
    for (let i = 0; i < 11; i++) {
      const res = await request(app)
        .get("/api/callback?state=any&code=any")
        .set("X-Forwarded-For", ip)
        .redirects(0);
      lastStatus = res.status;
    }

    // Assert — 429 au 11e appel
    // RED: sans rate-limit, /api/callback retourne 400 (invalid state) à chaque fois
    expect(lastStatus).toBe(429);
  });

  // ─────────────────────────────────────────────────────────────
  // Le rate-limit ne s'applique PAS aux routes non-auth
  // ─────────────────────────────────────────────────────────────
  it("should NOT rate-limit /api/teams (rate limit only applies to auth endpoints)", async () => {
    // Arrange — obtenir un cookie de session via une IP différente (hors compteur auth)
    const loginIp = "10.0.1.99";
    const loginRes = await request(app)
      .get("/api/auth/demo?role=admin")
      .set("X-Forwarded-For", loginIp)
      .redirects(0);

    const cookieHeader = loginRes.headers["set-cookie"] as unknown as string[];
    expect(cookieHeader, "Set-Cookie doit être présent après login demo").toBeDefined();
    const cookie = cookieHeader.map((c: string) => c.split(";")[0]).join("; ");

    // IP unique pour ce test (15+ appels sur /api/teams sans rate-limit)
    const ip = "10.0.1.13";

    // Act — 15 appels sur /api/teams avec session valide
    const statuses: number[] = [];
    for (let i = 0; i < 15; i++) {
      const res = await request(app)
        .get("/api/teams")
        .set("Cookie", cookie)
        .set("X-Forwarded-For", ip);
      statuses.push(res.status);
    }

    // Assert — aucun 429 ; tous les appels doivent retourner 200
    expect(statuses.every((s) => s !== 429)).toBe(true);
    expect(statuses.every((s) => s === 200)).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────
  // Les 10 premiers appels sont autorisés (pas de faux positif)
  // ─────────────────────────────────────────────────────────────
  it("should allow the first 10 requests to /api/auth/demo before rate-limiting", async () => {
    // Arrange — IP unique
    const ip = "10.0.1.14";
    const statuses: number[] = [];

    // Act — exactement 10 appels (juste à la limite)
    for (let i = 0; i < 10; i++) {
      const res = await request(app)
        .get("/api/auth/demo?role=viewer")
        .set("X-Forwarded-For", ip)
        .redirects(0);
      statuses.push(res.status);
    }

    // Assert — aucun des 10 premiers appels ne doit retourner 429
    // Les statuses attendus sont 302 (redirect après login demo)
    expect(statuses.every((s) => s !== 429)).toBe(true);
    expect(statuses.every((s) => s === 302)).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────
  // Headers RateLimit-* retournés (standardHeaders: true)
  // ─────────────────────────────────────────────────────────────
  it("should return RateLimit headers on /api/auth/demo requests", async () => {
    // Arrange — IP unique
    const ip = "10.0.1.15";

    // Act — premier appel
    const res = await request(app)
      .get("/api/auth/demo?role=viewer")
      .set("X-Forwarded-For", ip)
      .redirects(0);

    // Assert — express-rate-limit avec standardHeaders: true retourne ces headers
    // RED: sans rate-limit, ces headers sont absents
    // Les headers peuvent être "ratelimit-limit" (v7) ou "x-ratelimit-limit" (legacy)
    const hasRateLimitHeader =
      res.headers["ratelimit-limit"] !== undefined ||
      res.headers["x-ratelimit-limit"] !== undefined ||
      res.headers["ratelimit-remaining"] !== undefined;

    expect(
      hasRateLimitHeader,
      "Au moins un header RateLimit-* doit être présent (configurer standardHeaders: true)"
    ).toBe(true);
  });
});
