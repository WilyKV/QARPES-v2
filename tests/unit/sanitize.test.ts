/**
 * RED PHASE — [Phase 6] Sanitisation XSS côté serveur
 *
 * Ces tests échouent jusqu'à ce que server/lib/sanitize.ts soit créé
 * et exporte la fonction sanitizeRichText.
 *
 * Ce que le developer doit créer :
 *   - server/lib/sanitize.ts
 *     export function sanitizeRichText(input: string | null | undefined): string
 *
 * Paquet recommandé : sanitize-html (npm install sanitize-html @types/sanitize-html)
 *
 * Comportement attendu pour les liens externes :
 *   - Conserver href avec protocole https:// ou http://
 *   - Ajouter rel="noopener noreferrer" sur tout <a href="..."> pointant vers une URL externe
 *   - Supprimer href="javascript:..." et href="data:..."
 *
 * Tags HTML légitimes (format Quill) à conserver :
 *   p, br, strong, em, u, s, ul, ol, li, h1-h6, a (href https/http),
 *   table, thead, tbody, tr, td, th, code, pre, blockquote, span, div
 */

import { describe, it, expect } from "vitest";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SANITIZE_MODULE = path.join(__dirname, "..", "..", "server", "lib", "sanitize.ts");

/**
 * Import dynamique depuis le chemin absolu.
 * Si server/lib/sanitize.ts n'existe pas → ERR_MODULE_NOT_FOUND (Red Phase explicite).
 */
async function getSanitize(): Promise<(input: string | null | undefined) => string> {
  const mod = await import(SANITIZE_MODULE);
  if (typeof mod.sanitizeRichText !== "function") {
    throw new Error(
      "server/lib/sanitize.ts doit exporter une fonction nommée `sanitizeRichText`"
    );
  }
  return mod.sanitizeRichText;
}

// =============================================================================
// [Phase 6] sanitizeRichText (server-side)
// =============================================================================

describe("[Phase 6] sanitizeRichText (server-side)", () => {

  // ---------------------------------------------------------------------------
  // Module smoke test
  // ---------------------------------------------------------------------------

  describe("module contract", () => {
    it("should be importable from server/lib/sanitize.ts", async () => {
      // Arrange + Act
      const mod = await import(SANITIZE_MODULE);

      // Assert
      expect(mod.sanitizeRichText).toBeDefined();
      expect(typeof mod.sanitizeRichText).toBe("function");
    });
  });

  // ---------------------------------------------------------------------------
  // Strips dangerous tags
  // ---------------------------------------------------------------------------

  describe("strips dangerous tags", () => {
    it("should strip <script> tags and preserve surrounding content", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = "<p>Hello</p><script>alert(1)</script>";

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("alert(1)");
      expect(result).toContain("<p>Hello</p>");
    });

    it("should strip <script> tags with src attribute", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = '<p>Content</p><script src="https://evil.com/xss.js"></script>';

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).not.toContain("<script");
      expect(result).not.toContain("evil.com");
    });

    it("should strip <iframe> tags", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = '<p>Text</p><iframe src="https://evil.com"></iframe>';

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).not.toContain("<iframe");
      expect(result).not.toContain("</iframe>");
    });

    it("should strip <embed> tags", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = '<embed src="evil.swf" /><p>Content</p>';

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).not.toContain("<embed");
    });

    it("should strip <object> tags", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = '<object data="evil.swf"><param name="movie" value="x"/></object>';

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).not.toContain("<object");
      expect(result).not.toContain("<param");
    });

    it("should strip <style> tags", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = '<style>body { background: url("javascript:alert(1)") }</style><p>ok</p>';

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).not.toContain("<style");
      expect(result).toContain("<p>ok</p>");
    });

    it("should strip <form> and <input> tags", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = '<form action="https://evil.com"><input type="hidden" value="x"/></form>';

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).not.toContain("<form");
      expect(result).not.toContain("<input");
    });

    it("should strip <meta> tags", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = '<meta http-equiv="refresh" content="0;url=https://evil.com"><p>ok</p>';

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).not.toContain("<meta");
    });
  });

  // ---------------------------------------------------------------------------
  // Strips event handler attributes
  // ---------------------------------------------------------------------------

  describe("strips event handler attributes (on*)", () => {
    it("should strip onerror attribute", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = '<img src="x" onerror="alert(1)" />';

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).not.toContain("onerror");
    });

    it("should strip onclick attribute", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = '<p onclick="evil()">Text</p>';

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).not.toContain("onclick");
    });

    it("should strip onload attribute", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = '<body onload="steal()"><p>ok</p></body>';

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).not.toContain("onload");
    });

    it("should strip onmouseover attribute", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = '<span onmouseover="alert(document.cookie)">hover me</span>';

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).not.toContain("onmouseover");
    });

    it("should strip on* attributes regardless of casing (ONCLICK, OnError)", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = '<p ONCLICK="evil()" OnError="bad()">Text</p>';

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).not.toMatch(/onclick/i);
      expect(result).not.toMatch(/onerror/i);
    });

    it("should strip onfocus and onblur attributes", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = '<input onfocus="steal()" onblur="bad()" />';

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).not.toContain("onfocus");
      expect(result).not.toContain("onblur");
    });
  });

  // ---------------------------------------------------------------------------
  // Strips javascript: and data: URLs
  // ---------------------------------------------------------------------------

  describe("strips javascript: and data: URLs", () => {
    it("should strip href=javascript:alert(1)", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = '<a href="javascript:alert(1)">Click me</a>';

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).not.toContain("javascript:");
    });

    it("should strip href=javascript: with mixed casing (JaVaScRiPt:)", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = '<a href="JaVaScRiPt:alert(1)">x</a>';

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).not.toMatch(/javascript:/i);
    });

    it("should strip href=data:text/html payload", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = '<a href="data:text/html,<script>alert(1)</script>">x</a>';

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).not.toContain("data:text/html");
    });

    it("should strip src=javascript: on img tags", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = '<img src="javascript:alert(1)" />';

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).not.toContain("javascript:");
    });
  });

  // ---------------------------------------------------------------------------
  // Preserves legitimate HTML (format Quill)
  // ---------------------------------------------------------------------------

  describe("preserves legitimate HTML (Quill format)", () => {
    it("should preserve <p> and <br> tags", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = "<p>First line</p><br/><p>Second line</p>";

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).toContain("<p>First line</p>");
      expect(result).toContain("<p>Second line</p>");
    });

    it("should preserve <strong> and <em> and <u> tags", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = "<p><strong>bold</strong> <em>italic</em> <u>underline</u></p>";

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).toContain("<strong>bold</strong>");
      expect(result).toContain("<em>italic</em>");
      expect(result).toContain("<u>underline</u>");
    });

    it("should preserve <ul>, <ol> and <li> tags", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = "<ul><li>Item A</li><li>Item B</li></ul><ol><li>One</li></ol>";

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).toContain("<ul>");
      expect(result).toContain("<ol>");
      expect(result).toContain("<li>Item A</li>");
    });

    it("should preserve <h1> through <h6> heading tags", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = "<h1>H1</h1><h2>H2</h2><h3>H3</h3><h4>H4</h4><h5>H5</h5><h6>H6</h6>";

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).toContain("<h1>H1</h1>");
      expect(result).toContain("<h2>H2</h2>");
      expect(result).toContain("<h6>H6</h6>");
    });

    it("should preserve <a href=https://...> with legitimate https URL", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = '<a href="https://example.com">Visit us</a>';

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).toContain('href="https://example.com"');
      expect(result).toContain("Visit us");
    });

    it("should preserve <a href=http://...> with legitimate http URL", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = '<a href="http://intranet.local">Intranet</a>';

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).toContain('href="http://intranet.local"');
    });

    it("should preserve <table>, <thead>, <tbody>, <tr>, <td>, <th> tags", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = [
        "<table>",
        "<thead><tr><th>Header</th></tr></thead>",
        "<tbody><tr><td>Cell</td></tr></tbody>",
        "</table>",
      ].join("");

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).toContain("<table>");
      expect(result).toContain("<thead>");
      expect(result).toContain("<tbody>");
      expect(result).toContain("<th>Header</th>");
      expect(result).toContain("<td>Cell</td>");
    });

    it("should preserve <code> and <pre> tags", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = "<pre><code>const x = 1;</code></pre>";

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).toContain("<pre>");
      expect(result).toContain("<code>");
      expect(result).toContain("const x = 1;");
    });

    it("should preserve <blockquote> tags", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = "<blockquote><p>Quoted text</p></blockquote>";

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).toContain("<blockquote>");
      expect(result).toContain("Quoted text");
    });

    it("should preserve <span> and class attribute used by Quill", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = '<span class="ql-font-monospace">code snippet</span>';

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).toContain("code snippet");
      // Le tag span lui-même doit être conservé (avec ou sans la classe)
      expect(result).toContain("<span");
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  describe("edge cases", () => {
    it("should return empty string when input is null", async () => {
      // Arrange
      const sanitize = await getSanitize();

      // Act
      const result = sanitize(null);

      // Assert
      expect(result).toBe("");
    });

    it("should return empty string when input is undefined", async () => {
      // Arrange
      const sanitize = await getSanitize();

      // Act
      const result = sanitize(undefined);

      // Assert
      expect(result).toBe("");
    });

    it("should return empty string when input is empty string", async () => {
      // Arrange
      const sanitize = await getSanitize();

      // Act
      const result = sanitize("");

      // Assert
      expect(result).toBe("");
    });

    it("should return plain text unchanged when input has no HTML", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = "Simple plain text without any HTML tags";

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).toContain("Simple plain text without any HTML tags");
    });

    it("should add rel='noopener noreferrer' to external links", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = '<a href="https://example.com">x</a>';

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).toMatch(/rel="[^"]*noopener[^"]*"/);
      expect(result).toMatch(/rel="[^"]*noreferrer[^"]*"/);
    });

    it("should handle deeply nested malicious content", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input =
        "<p><strong><em><u>" +
        '<script>alert("nested")</script>' +
        "</u></em></strong></p>";

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("alert");
      expect(result).toContain("<strong>");
    });

    it("should handle HTML entity encoding of angle brackets (no double-encoding)", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = "<p>5 &lt; 10 and 10 &gt; 5</p>";

      // Act
      const result = sanitize(input);

      // Assert
      // Les entités HTML légitimes ne doivent pas être cassées
      expect(result).toContain("<p>");
      expect(result).toContain("5");
      expect(result).toContain("10");
    });

    it("should strip style attribute with expression() or url(javascript:)", async () => {
      // Arrange
      const sanitize = await getSanitize();
      const input = '<p style="background:url(javascript:alert(1))">Text</p>';

      // Act
      const result = sanitize(input);

      // Assert
      expect(result).not.toContain("javascript:");
      expect(result).toContain("<p");
      expect(result).toContain("Text");
    });
  });
});
