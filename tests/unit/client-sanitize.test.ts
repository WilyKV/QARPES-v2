/**
 * RED PHASE — [Phase 6] Sanitisation XSS côté client (DOM)
 *
 * FICHIER EN ATTENTE — renommé en .pending pour éviter le crash Vitest
 * causé par l'absence du package jsdom.
 *
 * Pour activer ces tests :
 *   1. npm install --save-dev jsdom
 *   2. npm install isomorphic-dompurify
 *   3. Créer client/src/lib/sanitize.ts (voir ci-dessous)
 *   4. Renommer ce fichier en client-sanitize.test.ts
 *   5. Ajouter en première ligne : // @vitest-environment jsdom
 *
 * Implémentation attendue dans client/src/lib/sanitize.ts :
 *   import DOMPurify from "isomorphic-dompurify";
 *   export function sanitizeHtml(input: string | null | undefined): string {
 *     if (!input) return "";
 *     return DOMPurify.sanitize(input, { USE_PROFILES: { html: true } });
 *   }
 *
 * Pages à mettre à jour (dangerouslySetInnerHTML) :
 *   - client/src/pages/version-detail.tsx (ligne ~236)
 *   - client/src/pages/project-detail.tsx (ligne ~118)
 */

// @vitest-environment jsdom

import { describe, it, expect } from "vitest";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_SANITIZE_MODULE = path.join(
  __dirname,
  "..",
  "..",
  "client",
  "src",
  "lib",
  "sanitize.ts"
);

async function getClientSanitize(): Promise<(input: string | null | undefined) => string> {
  const mod = await import(CLIENT_SANITIZE_MODULE);
  if (typeof mod.sanitizeHtml !== "function") {
    throw new Error(
      "client/src/lib/sanitize.ts doit exporter une fonction nommée `sanitizeHtml`"
    );
  }
  return mod.sanitizeHtml;
}

describe("[Phase 6] sanitizeHtml (client-side wrapper)", () => {

  describe("module contract", () => {
    it("should be importable from client/src/lib/sanitize.ts", async () => {
      const mod = await import(CLIENT_SANITIZE_MODULE);
      expect(mod.sanitizeHtml).toBeDefined();
      expect(typeof mod.sanitizeHtml).toBe("function");
    });
  });

  describe("strips dangerous tags client-side", () => {
    it("should strip <script> tags", async () => {
      const sanitize = await getClientSanitize();
      const result = sanitize("<p>hi</p><script>alert(1)</script>");
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("alert(1)");
      expect(result).toContain("<p>hi</p>");
    });

    it("should strip <iframe> tags", async () => {
      const sanitize = await getClientSanitize();
      const result = sanitize('<iframe src="https://evil.com"></iframe><p>ok</p>');
      expect(result).not.toContain("<iframe");
    });

    it("should strip on* event handler attributes", async () => {
      const sanitize = await getClientSanitize();
      const result = sanitize('<img src="x" onerror="alert(document.cookie)" />');
      expect(result).not.toContain("onerror");
    });

    it("should strip href=javascript: URLs", async () => {
      const sanitize = await getClientSanitize();
      const result = sanitize('<a href="javascript:alert(1)">click</a>');
      expect(result).not.toContain("javascript:");
    });
  });

  describe("preserves legitimate HTML client-side", () => {
    it("should preserve <p>, <strong>, <em> tags", async () => {
      const sanitize = await getClientSanitize();
      const result = sanitize("<p><strong>bold</strong> and <em>italic</em></p>");
      expect(result).toContain("<strong>bold</strong>");
      expect(result).toContain("<em>italic</em>");
    });

    it("should preserve <ul> and <li> tags", async () => {
      const sanitize = await getClientSanitize();
      const result = sanitize("<ul><li>Step 1</li><li>Step 2</li></ul>");
      expect(result).toContain("<ul>");
      expect(result).toContain("<li>Step 1</li>");
    });

    it("should preserve <a href=https://...> links", async () => {
      const sanitize = await getClientSanitize();
      const result = sanitize('<a href="https://docs.example.com">Documentation</a>');
      expect(result).toContain('href="https://docs.example.com"');
    });

    it("should preserve <pre> and <code> tags", async () => {
      const sanitize = await getClientSanitize();
      const result = sanitize("<pre><code>npm run build</code></pre>");
      expect(result).toContain("<pre>");
      expect(result).toContain("<code>");
    });
  });

  describe("edge cases client-side", () => {
    it("should return empty string on null input", async () => {
      const sanitize = await getClientSanitize();
      expect(sanitize(null)).toBe("");
    });

    it("should return empty string on undefined input", async () => {
      const sanitize = await getClientSanitize();
      expect(sanitize(undefined)).toBe("");
    });

    it("should return empty string on empty string input", async () => {
      const sanitize = await getClientSanitize();
      expect(sanitize("")).toBe("");
    });
  });
});
