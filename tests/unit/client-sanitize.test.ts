/**
 * RED PHASE — [Phase 6] Sanitisation XSS côté client (DOM)
 *
 * STATUT : tous les tests sont en describe.skip.
 *
 * Les tests complets se trouvent dans :
 *   tests/unit/client-sanitize.test.ts.pending
 *
 * Pour activer ces tests :
 *   1. npm install --save-dev jsdom
 *   2. npm install isomorphic-dompurify
 *   3. Créer client/src/lib/sanitize.ts avec :
 *        export function sanitizeHtml(input: string | null | undefined): string
 *   4. Copier le contenu de client-sanitize.test.ts.pending dans ce fichier
 *      (ajouter la directive vitest-environment jsdom en commentaire première ligne).
 *
 * Pages à mettre à jour (dangerouslySetInnerHTML non sanitisé) :
 *   - client/src/pages/version-detail.tsx  (ligne ~236)
 *   - client/src/pages/project-detail.tsx  (ligne ~118)
 */

import { describe, it } from "vitest";

// Placeholder Red Phase — les vrais tests sont dans client-sanitize.test.ts.pending
// et seront activés une fois jsdom installé.
describe.skip("[Phase 6] sanitizeHtml (client-side wrapper) — pending jsdom install", () => {
  it("placeholder — see client-sanitize.test.ts.pending for full test suite", () => {
    // Ce test ne s'exécute pas (describe.skip).
    // Voir client-sanitize.test.ts.pending pour les 15 tests complets.
  });
});
