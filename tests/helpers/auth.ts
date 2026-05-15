/**
 * Helper: loginAs
 *
 * Appelle GET /api/auth/demo?role=<role> et capture le cookie de session.
 * Retourne le header Cookie utilisable dans supertest (.set("Cookie", cookie)).
 *
 * Dépend de :
 *   - createTestApp() (tests/helpers/test-app.ts)
 *   - La route /api/auth/demo qui doit exister et fonctionner en NODE_ENV=development
 *   - La route doit émettre un Set-Cookie sur la réponse 302
 *
 * TODO (developer) :
 *   - S'assurer que /api/auth/demo retourne bien un Set-Cookie dans l'en-tête
 *     de la réponse 302 (la session doit être persistée avant le redirect).
 *   - S'assurer que le cookie de session est HttpOnly (pas secure en test).
 */

import type { Express } from "express";
import request from "supertest";

/**
 * Simule une connexion en tant que `role` via /api/auth/demo.
 * Retourne le header Cookie complet (ex: "connect.sid=s%3A...") à passer
 * dans les requêtes suivantes avec .set("Cookie", cookie).
 *
 * Lève une erreur si la route ne répond pas 302 ou ne fournit pas de Set-Cookie.
 */
export async function loginAs(app: Express, role: string): Promise<string> {
  const response = await request(app)
    .get(`/api/auth/demo?role=${role}`)
    .redirects(0); // Ne suit pas le redirect, on veut juste capturer le cookie

  if (response.status !== 302) {
    throw new Error(
      `loginAs("${role}"): expected 302 from /api/auth/demo, got ${response.status}. ` +
        "Ensure the demo auth route is implemented and returns a redirect with Set-Cookie."
    );
  }

  const setCookieHeader = response.headers["set-cookie"];
  if (!setCookieHeader || setCookieHeader.length === 0) {
    throw new Error(
      `loginAs("${role}"): /api/auth/demo returned 302 but no Set-Cookie header. ` +
        "The session must be saved before redirect (req.session.save())."
    );
  }

  // Extrait le(s) cookie(s) en format utilisable par supertest
  const cookies = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader];

  // Prend uniquement la partie name=value (avant le premier ;)
  const cookieString = cookies
    .map((c: string) => c.split(";")[0])
    .join("; ");

  return cookieString;
}

/**
 * Vérifie que le cookie retourné par loginAs donne accès à une route protégée.
 * Utilitaire de diagnostic utilisé dans les tests.
 */
export async function assertSessionValid(
  app: Express,
  cookie: string
): Promise<void> {
  const response = await request(app)
    .get("/api/auth/user")
    .set("Cookie", cookie);

  if (response.status !== 200) {
    throw new Error(
      `Session invalide : GET /api/auth/user a retourné ${response.status} avec le cookie "${cookie}"`
    );
  }
}
