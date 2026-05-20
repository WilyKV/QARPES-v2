# TODO — QARPES-v2

> État au 2026-05-15. Source : audit multi-agent du sprint sécurité (24 commits sur main).
> Tests passent (214 ✅), TypeScript clean (0 erreur), build prod débloqué.

## 🎯 Légende
- 🔴 Critical : bloquant pour la production
- 🟠 High : à traiter rapidement
- 🟡 Medium : à planifier
- 🔵 Low : amélioration continue
- 📝 Info / décision à prendre

## ✅ Récemment fait (rappel)
- Docker unification (multi-stage Dockerfile)
- Drizzle cleanup et migration vers Prisma ORM
- .env cleanup et template setup
- Dépendances fixées (crash npm ci résolu)
- Bugfix gitRepos (orphans supprimés)
- TypeScript : 72 → 0 erreurs
- Tooling : Vitest, ESLint, Prettier configurés
- Sprint sécurité 7 phases : auth middleware global, demo gated (partial), OAuth state crypto, helmet, cookies hardened, rate limit, RBAC partial, Zod sur 4 ressources, sanitisation XSS sur procedures

## 🔴 Critical — À faire AVANT prod

### C1. Bloc "DEMO MODE" non gardé dans `/api/callback`
**Fichier** : `/var/www/html/ProjetsOmnes/QARPES-v2/server/replitAuth.ts:189-238`
**Risque** : en production, tout appel OAuth valide se connecte en `demo.user@omneseducation.com`. Le vrai code OAuth est commenté (lignes 118-187).
**Action** : soit décommenter le vrai flux OAuth Microsoft, soit gater le bloc DEMO MODE derrière `if (process.env.NODE_ENV !== "production")`. Idéalement les deux.
**Effort** : 30 min à 4h (selon si OAuth déjà validé avec Azure AD).

### C2. Usurpation d'identité possible dans `POST /api/arb`
**Fichier** : `/var/www/html/ProjetsOmnes/QARPES-v2/server/routes.ts:676-678`
**Code actuel** : `const userId = req.user?.claims?.sub || req.body.requesterId;`
**Risque** : `req.user.claims.sub` n'existe pas (auth session-based, pas JWT) → fallback systématique sur `req.body.requesterId`. Tout utilisateur authentifié peut créer une ARB en se faisant passer pour un autre.
**Action** : utiliser `req.session.user.id` (ou `req.user.id` post-typage H3). NE JAMAIS lire `requesterId` du body.
**Effort** : 5 min.

### C3. Rotation du SESSION_SECRET
**Fichier** : `.env`
**Risque** : valeur actuelle = exemple template `your-super-secret-session-key-change-this-in-production`. Connue = pas de secret.
**Action manuelle** :
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# copier la valeur dans .env
docker compose restart app
```
**Effort** : 2 min (invalide toutes les sessions existantes).

### C4. Purge git history des anciens commits avec .env
**Fichiers** : historique git contient `.env` avec `SESSION_SECRET` et `DB_PASSWORD`.
**Risque** : si repo partagé (GitHub/GitLab), secrets récupérables via `git show`.
**Action manuelle** (AVANT push public) :
```bash
git filter-repo --path .env --invert-paths
git push --force origin main
# + rotation SESSION_SECRET (cf C3)
# + nouveau DB_PASSWORD côté postgres
```
**Effort** : 30 min + coordination équipe (force push).

## 🟠 High — À traiter rapidement

### H1. 23 endpoints mutants sans `requirePermission`
**Fichier** : `/var/www/html/ProjetsOmnes/QARPES-v2/server/routes.ts`
**Risque** : tout utilisateur authentifié (même `viewer`) peut modifier.
**Liste** : POST/DELETE teams members, releases projects, project versions, users, PVs, CABs, git-repos, procedures, commits.
**Action** : ajouter `requirePermission(...)` adapté à chaque endpoint (cf. permissions.ts).
**Effort** : 1-2h (idéalement après tests RBAC correspondants, TDD).

### H2. Pas de `req.session.regenerate()` après login
**Fichier** : `/var/www/html/ProjetsOmnes/QARPES-v2/server/replitAuth.ts:210-216`
**Risque** : session fixation. Attaquant plante un session ID connu, le fait élever au login.
**Action** : appeler `req.session.regenerate(callback)` avant `req.session.user = {...}` dans `/api/callback`.
**Effort** : 15 min.

### H3. `req.user` typé mais code utilise `(req.session as any)` partout
**Fichiers** : auth.ts, requirePermission.ts, replitAuth.ts, routes.ts
**Risque** : le typage `Express.d.ts` est inopérant ; refactor cosmétique mais crucial pour sécurité.
**Action** : remplacer `(req.session as any)` par `req.session.user`, `(req as any).user` par `req.user`.
**Effort** : 30 min.

### H4. Sanitisation appliquée uniquement à `procedure.content`
**Fichiers** : `/var/www/html/ProjetsOmnes/QARPES-v2/server/storage.ts`, client pages
**Risque** : XSS stocké via autres champs HTML rendus en `dangerouslySetInnerHTML` côté client.
**Action** : 
1. Audit client : identifier tous les `dangerouslySetInnerHTML` (description, note, content)
2. Appliquer `sanitizeRichText` côté serveur avant persistance
3. Migration one-shot pour sanitiser les données existantes
**Effort** : 2h.

### H5. Quill vulnérabilité XSS
**Fichier** : `package.json:81`
**Risque** : `react-quill@^2.0.0` a XSS connu.
**Action** : vérifier si utilisé. Si oui : migrer vers Tiptap ou Quill v2. Si non : `npm uninstall react-quill quill`.
**Effort** : 1h investigation + plusieurs heures si migration.

### H6. Rate limit bypass via X-Forwarded-For
**Fichier** : `/var/www/html/ProjetsOmnes/QARPES-v2/server/replitAuth.ts:37-49`
**Risque** : avec `trust proxy: 1`, attaquant peut spoofer IP via header et bypasser rate limit en prod.
**Action** : restreindre `skip` des IPs loopback à `NODE_ENV !== 'production'`.
**Effort** : 5 min.

### H7. `sanitize-html` autorise `style="*"` trop largement
**Fichier** : `/var/www/html/ProjetsOmnes/QARPES-v2/server/lib/sanitize.ts:23-42`
**Risque** : CSS injection via `background: url(data:...)`, `behavior:`, `-moz-binding:`.
**Action** : soit retirer `style` et `class`, soit whitelister précisément les propriétés CSS (color, background-color, text-align).
**Effort** : 1h.

### H8. Sanitisations client/serveur non alignées
**Fichier** : `/var/www/html/ProjetsOmnes/QARPES-v2/client/src/lib/sanitize.ts:1-9`
**Risque** : serveur force `rel="noopener noreferrer"` sur `<a>`, client non → tabnabbing via `target="_blank"`.
**Action** : aligner les politiques ou supprimer sanitizer client (faire confiance au serveur).
**Effort** : 30 min.

## 🟡 Medium — À planifier

### M1. Validation Zod manquante sur les 23 endpoints (cf. H1)
Couvrir les bodies des endpoints mutants restants après application du RBAC.
**Effort** : 2-3h (parallélisable avec H1).

### M2. Fuites `error.message` interne
**Fichiers** : `/var/www/html/ProjetsOmnes/QARPES-v2/server/routes.ts:383, 529-530`
**Risque** : exposition de la structure DB / contraintes Prisma.
**Action** : en prod, renvoyer message générique ; logger l'erreur complète server-side uniquement.
**Effort** : 15 min + middleware d'erreur centralisé.

### M3. Pas de transaction Prisma sur les multi-writes
**Fichier** : `/var/www/html/ProjetsOmnes/QARPES-v2/server/routes.ts:492-531`
**Risque** : état incohérent en cas d'échec partiel.
**Action** : wrapper dans `prisma.$transaction([...])`.
**Effort** : 30 min.

### M4. `dangerouslySetInnerHTML` dans `chart.tsx` non sanitisé
**Fichier** : `/var/www/html/ProjetsOmnes/QARPES-v2/client/src/components/ui/chart.tsx:81-98`
**Risque** : si config chart accepte inputs utilisateur, CSS injection possible.
**Action** : valider que `ChartConfig.color/theme` provient de constantes statiques ou sanitiser le CSS.
**Effort** : 15 min audit + correction si nécessaire.

### M5. `setupAuth` capture `NODE_ENV` à l'import
**Fichier** : `/var/www/html/ProjetsOmnes/QARPES-v2/server/replitAuth.ts:26-35`
**Risque** : incohérence si `createApp` mute `NODE_ENV` (peut arriver en test).
**Action** : passer `nodeEnv` en paramètre explicite, ne pas relire `process.env` après démarrage.
**Effort** : 30 min.

### M6. Helmet CSP en prod non testée
**Fichier** : `/var/www/html/ProjetsOmnes/QARPES-v2/server/app.ts:23-27`
**Risque** : CSP par défaut de helmet en prod peut casser chargement scripts/fonts Vite.
**Action** : définir explicitement `contentSecurityPolicy` adaptée au build prod, tester en `NODE_ENV=production`.
**Effort** : 1-2h investigation.

### M7. Helpers `canEditTeams/canDeleteX` redondants
**Fichier** : `/var/www/html/ProjetsOmnes/QARPES-v2/shared/permissions.ts:96-163`
**Risque** : dette maintenance (11 helpers wrappant `hasPermission`).
**Action** : préférer `hasPermission(role, perm)` partout, simplifier API publique.
**Effort** : 1h.

### M8. Codes HTTP incohérents (201 vs 200 sur POST)
**Fichier** : `/var/www/html/ProjetsOmnes/QARPES-v2/server/routes.ts`
**Action** : normaliser POST de création à `201 Created`.
**Effort** : 15 min.

### M9. Validation des dates dans `releases.ts`
**Fichier** : `/var/www/html/ProjetsOmnes/QARPES-v2/shared/validation/releases.ts:9-11`
**Risque** : `z.string().optional()` accepte n'importe quelle chaîne → `Invalid Date` côté Prisma.
**Action** : `z.coerce.date()` ou regex ISO stricte.
**Effort** : 15 min.

### M10. `IdParamSchema` réécrit `req.params` mais handlers font encore `parseInt`
**Fichier** : `/var/www/html/ProjetsOmnes/QARPES-v2/server/routes.ts`
**Risque** : double conversion silencieuse, perte de garantie typage.
**Action** : retirer `parseInt` dans handlers avec `validate(IdParamSchema)` upstream.
**Effort** : 1h.

## 🔵 Low — Améliorations continues

### L1. 17 vulnérabilités npm restantes (9 high)
**Action** : `npm audit fix` automatique + audit manuel des HIGH (`path-to-regexp`, `tar`, `lodash`).
**Effort** : 1-2h.

### L2. Logger structuré (pino/winston) à la place de 102 console.*
**Action** : intégrer `pino` avec `pino-http`, formater en JSON, intégrer à log management (Datadog/ELK).
**Effort** : 4h.

### L3. CORS configuration
**Action** : ajouter `cors({ origin: ALLOWED_ORIGINS, credentials: true })` ou documenter la décision (même domaine = pas nécessaire).
**Effort** : 30 min.

### L4. CSRF tokens (defense-in-depth)
**Action** : SameSite=Lax + pas de CORS = protection suffisante. Documenter ou implémenter `csurf` pour PRD.
**Effort** : 1h.

### L5. Tests d'intégration XSS gated sur `TEST_VERSION_GIT_REPO_ID`
**Fichier** : `/var/www/html/ProjetsOmnes/QARPES-v2/tests/integration/xss-procedures.test.ts`
**Action** : créer helper seed-procedure pour activer les 6 tests `it.skip`.
**Effort** : 1h.

### L6. Pattern try/catch dupliqué dans tous les handlers
**Fichier** : `/var/www/html/ProjetsOmnes/QARPES-v2/server/routes.ts`
**Action** : wrapper `asyncHandler` + middleware d'erreur central (déjà présent, juste pas utilisé).
**Effort** : 2h.

### L7. Caractères parasites dans `server/index.ts`
**Fichier** : `/var/www/html/ProjetsOmnes/QARPES-v2/server/index.ts:57,59`
**Action** : nettoyer les `�` (BOM/utf16 → utf8).
**Effort** : 2 min.

### L8. TODO laissé dans `replitAuth.ts:117`
**Action** : soit activer le bloc OAuth Microsoft, soit supprimer le code commenté.
**Effort** : voir C1.

### L9. Logger HTTP émet le JSON de la réponse
**Fichier** : `/var/www/html/ProjetsOmnes/QARPES-v2/server/index.ts:25-37`
**Risque** : fuite RGPD potentielle dans les logs.
**Action** : retirer le body des logs en prod ou whitelister routes "OK à logger".
**Effort** : 15 min.

### L10. `getRoleDescription` et `AVAILABLE_ROLES` dupliquent descriptions
**Fichier** : `/var/www/html/ProjetsOmnes/QARPES-v2/shared/permissions.ts:178-227`
**Action** : extraire `ROLE_METADATA` unique, dériver les deux exports.
**Effort** : 30 min.

## 📝 Architecture / refactorings à long terme

### A1. Découper `routes.ts` (1045 lignes) en bounded contexts
```
server/modules/
  identity/       # User, Member, Team
  project-catalog/# Project, ProjectVersion, GitRepo, Commit
  release/        # Release, CAB, PV, Procedure
  governance/     # ARB, AuditLog
```
**Effort** : 3-5 jours.

### A2. Découper `storage.ts` (975 lignes) en repositories par bounded context
**Effort** : 2-3 jours.

### A3. Découper `version-detail.tsx` (1078 lignes) en sous-composants
**Effort** : 2 jours.

### A4. Aligner `shared/schema.ts` sur types Prisma générés
**Effort** : 1 jour.

### A5. Couche service / use-case
Couche service (orchestration) et couche domaine (règles métier).
**Effort** : à intégrer dans A1/A2.

### A6. CI/CD GitHub Actions
Workflow `.github/workflows/ci.yml` : `npm run check && npm run lint && npm run test` sur chaque PR/push.
**Effort** : 30 min.

### A7. Husky + lint-staged pre-commit
Bloquer commits qui cassent type check ou tests.
**Effort** : 30 min.
