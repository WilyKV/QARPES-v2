# TODO.md — Plan d'action QARPES-v2

> Plan d'amélioration priorisé pour faire passer le projet de 25/100 à 70/100+.
> Dernière mise à jour : 20 mai 2026

---

## État actuel

**Score technique global : 25/100 (CRITIQUE)**

Le projet fonctionne en développement (Docker + Vite + Express sur localhost:3000). Après nettoyage du 20 mai 2026 : **0 erreur TypeScript**, **214 tests passent** (9 skippés, 0 échoués), ESLint 0 erreurs (17 warnings). Le build esbuild backend est réparé. Restent des failles de sécurité critiques (backdoor demo auth, 23 endpoints non protégés), une architecture monolithique (routes.ts 1072 lignes, storage.ts 1015 lignes), 51 `as any`, 64 `parseInt()` non validés, et 119 `console.log` en production.

**Priorités** : Sécurité d'abord, puis stabilité, puis architecture, puis qualité.

---

## ✅ Nettoyage effectué (20 mai 2026)

Actions déjà réalisées :

- [x] **Build backend réparé** — `tsc` (cassé avec noEmit) remplacé par `esbuild` (`scripts/build-backend.mjs`)
- [x] **package.json corrigé** — nom `rest-express` → `qarpes-v2`, scripts build fixés
- [x] **`.gitignore` durci** — ajout `.idea/`, `.vscode/`, `.claude/`, `coverage/`, `attached_assets/`
- [x] **`.idea/` retiré du tracking git** — fichiers IDE supprimés du repo
- [x] **`attached_assets/` archivé** — specs texte → `docs/legacy/specs/`, images supprimées
- [x] **`.docker/` vide supprimé**
- [x] **`tsconfig.json` nettoyé** — exclude inexistant retiré
- [x] **`vitest.config.ts` amélioré** — support tests client (jsdom), alias corrigés
- [x] **GitHub Actions CI créé** — `.github/workflows/ci.yml` (lint + check + test)
- [x] **Husky pre-commit configuré** — `.husky/pre-commit` (lint + check)
- [x] **CLAUDE.md réécrit** — synchronisé avec l'état réel du code
- [x] **TODO.md créé** — plan d'action complet (remplace ancien `todo.md`)
- [x] **Ancien `todo.md` archivé** → `docs/legacy/todo-audit-2026-05-15.md`

---

## Quick Wins (< 1 heure, sans risque)

Actions immédiates à faire en priorité :

- [ ] **Conditionner `/api/auth/demo` à `NODE_ENV=development`** (5 min)
  - Fichier : `server/routes.ts` ligne 19
  - Ajouter condition : `...(process.env.NODE_ENV === 'development' ? ['/api/auth/demo'] : [])`
  - Ou exclure `/api/auth/demo` de `PUBLIC_API_ROUTES` et gérer la condition dans `replitAuth.ts`

- [ ] **Supprimer le bloc debug `=== ASSOCIATION DEBUG START ===`** (5 min)
  - Fichier : `server/routes.ts` lignes ~446-489
  - Code mort qui pollue les logs

- [x] **Installer les dépendances de test manquantes** (10 min) ✅
  - Toutes les dépendances sont installées dans le container Docker
  - Tests désormais fonctionnels : 214 passants, 0 échoués

- [x] **Supprimer l'ancien `todo.md` minuscule** (1 min) ✅
  - Archivé dans `docs/legacy/todo-audit-2026-05-15.md`

---

## Priorité 1 — Sécurité (CRITIQUE)

### 1.1 Fermer les backdoors et accès non autorisés

- [ ] **Fermer la backdoor demo auth en production** (15 min)
  ```typescript
  // Dans server/routes.ts, ligne 19
  const PUBLIC_API_ROUTES = [
    "/api/login",
    "/api/callback",
    "/api/logout",
    ...(process.env.NODE_ENV === 'development' ? ["/api/auth/demo"] : [])
  ];
  ```

- [ ] **Ajouter `requirePermission` sur les 23 endpoints mutants sans protection** (2h)
  - Identifier tous les endpoints POST/PUT/PATCH/DELETE sans middleware RBAC
  - Liste partielle à vérifier :
    - `POST /api/teams/:id/members` (ligne 178)
    - `DELETE /api/teams/:teamId/members/:userId` (ligne 215)
    - `POST /api/projects/:id/versions` (ligne 560)
    - `PATCH /api/project-versions/:id/note` (ligne 585)
    - `POST /api/users` (ligne 608)
    - `PUT /api/users/:id` (ligne 634)
    - `POST /api/project-versions/:id/pvs` (ligne 705)
    - `PATCH /api/project-pvs/:id` (ligne 717)
    - `DELETE /api/project-pvs/:id` (ligne 727)
    - `POST /api/project-versions/:id/cabs` (ligne 740)
    - `PATCH /api/cabs/:id` (ligne 751)
    - `DELETE /api/cabs/:id` (ligne 762)
    - `POST /api/projects/:projectId/versions/:versionId/git-repos` (ligne 813)
    - `PUT /api/git-repos/:id` (ligne 839)
    - `DELETE /api/git-repos/:id` (ligne 850)
    - `POST /api/git-repos/:gitRepoId/procedures` (ligne 875)
    - `PATCH /api/procedures/:id` (ligne 900)
    - `DELETE /api/procedures/:id` (ligne 910)
    - `POST /api/version-git-repos/:versionGitRepoId/commits` (ligne 959)
    - `POST /api/version-git-repos/:versionGitRepoId/procedures` (ligne 981)

### 1.2 Sécuriser les réponses d'erreur

- [ ] **Remplacer `error.message` par des messages génériques dans les réponses 500** (1h)
  - `server/routes.ts` lignes 384-389, 530 (et autres)
  - Pattern à appliquer :
    ```typescript
    catch (error) {
      console.error("Error creating release:", error);
      res.status(500).json({ message: "Failed to create release" });
      // NE PAS exposer error.message au client
    }
    ```
  - Logger l'erreur complète côté serveur uniquement

### 1.3 Sécuriser la session

- [ ] **Régénérer `SESSION_SECRET` avec `crypto.randomBytes(64).toString('hex')`** (5 min)
  - Mettre à jour `.env.example` avec un vrai exemple généré
  - Documenter comment générer un nouveau secret

- [ ] **Ajouter `req.session.regenerate()` après login** (30 min)
  - Fichier : `server/replitAuth.ts` ligne ~130 (callback OAuth)
  - Anti session-fixation attack
  - Pattern :
    ```typescript
    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ message: "Session error" });
      req.session.user = sessionUser;
      req.session.save((err) => {
        if (err) return res.status(500).json({ message: "Session save error" });
        res.redirect('/');
      });
    });
    ```

### 1.4 Purger les secrets de l'historique git

- [ ] **Purger `.env` et `cookies.txt` de l'historique git** (1h, DANGEREUX)
  - Utiliser `git filter-repo` ou BFG Repo-Cleaner
  - **Attention** : réécrire l'historique force tous les devs à re-clone
  - Documenter la procédure dans un ADR

### 1.5 Remplacer les `as any` de sécurité

- [ ] **Remplacer les 10 `as any` dans `replitAuth.ts`** (1h)
  - Typer correctement `req.session` avec `SessionUser`
  - Utiliser `server/types/express.d.ts`

---

## Priorité 2 — Stabilité (URGENT)

### 2.1 Corriger les erreurs TypeScript

- [x] **~~Corriger les 7 erreurs TypeScript~~** → **Résolu** : 0 erreurs TypeScript (`npm run check` passe sans erreur) ✅

### 2.2 Réparer les tests

- [x] **~~Faire passer les 42 tests échoués~~** → **Résolu** : 214 tests passent, 0 échoués ✅

- [ ] **Investiguer et réactiver les 9 tests skippés** (1h)
  - 1 test skip dans startup-guards (SESSION_SECRET vide)
  - 1 test skip dans oauth-state
  - 6 tests skip dans xss-procedures (intégration nécessitant DB)
  - 1 test skip dans auth-middleware
  - Analyser chaque skip et décider : activer ou documenter pourquoi skippé

### 2.3 Tester le build Docker complet

- [ ] **Tester le build Docker avec le nouveau script esbuild** (1h)
  - `make build`
  - `make test-prod`
  - Vérifier que l'image fonctionne correctement
  - Vérifier que viteDev.ts n'est jamais chargé en prod

---

## Priorité 3 — Architecture (IMPORTANT)

### 3.1 Découpage de routes.ts (1072 lignes)

Objectif : 11 routeurs par domaine métier.

- [ ] **Créer `server/routes/teams.ts`** (1h)
  - Extraire toutes les routes `/api/teams/*`
  - Exporter un `Router` Express
  - Importer dans `server/routes.ts` et monter avec `app.use('/api/teams', teamsRouter)`

- [ ] **Créer `server/routes/projects.ts`** (1h)
  - Extraire `/api/projects/*` (sauf versions)

- [ ] **Créer `server/routes/versions.ts`** (1h)
  - Extraire `/api/projects/:id/versions/*` et `/api/project-versions/*`

- [ ] **Créer `server/routes/releases.ts`** (1h)
  - Extraire `/api/releases/*`

- [ ] **Créer `server/routes/git.ts`** (1h)
  - Extraire `/api/git-repos/*` et `/api/version-git-repos/*`

- [ ] **Créer `server/routes/procedures.ts`** (1h)
  - Extraire `/api/procedures/*` et `/api/git-repos/:id/procedures`

- [ ] **Créer `server/routes/arb.ts`** (30 min)
  - Extraire `/api/arb/*`

- [ ] **Créer `server/routes/cab.ts`** (30 min)
  - Extraire `/api/cabs/*` et `/api/project-versions/:id/cabs`

- [ ] **Créer `server/routes/pvs.ts`** (30 min)
  - Extraire `/api/project-pvs/*` et `/api/project-versions/:id/pvs`

- [ ] **Créer `server/routes/users.ts`** (30 min)
  - Extraire `/api/users/*` et `/api/auth/user`

- [ ] **Créer `server/routes/dashboard.ts`** (30 min)
  - Extraire `/api/dashboard/*`

- [ ] **Créer `server/routes/admin.ts`** (30 min)
  - Extraire `/api/admin/*` (audit logs)

- [ ] **Refactoriser `server/routes.ts` comme index des routeurs** (1h)
  - Ne garder que l'import/export des sous-routeurs
  - Conserver la logique de protection globale `/api/*` avec `PUBLIC_API_ROUTES`

### 3.2 Découpage de storage.ts (1015 lignes)

Objectif : 6+ repositories par agrégat métier.

- [ ] **Créer `server/repositories/usersRepository.ts`** (1h)
  - Extraire : `getUser`, `getUserByEmail`, `upsertUser`, `getUsers`, `createUser`

- [ ] **Créer `server/repositories/teamsRepository.ts`** (1h)
  - Extraire : toutes les méthodes Team, TeamMember, Member

- [ ] **Créer `server/repositories/projectsRepository.ts`** (1h)
  - Extraire : toutes les méthodes Project, ProjectVersion

- [ ] **Créer `server/repositories/releasesRepository.ts`** (1h)
  - Extraire : toutes les méthodes Release, ReleaseProject

- [ ] **Créer `server/repositories/gitRepository.ts`** (1h)
  - Extraire : toutes les méthodes GitRepo, ProjectVersionGitRepo, Commit

- [ ] **Créer `server/repositories/proceduresRepository.ts`** (1h)
  - Extraire : toutes les méthodes Procedure

- [ ] **Créer `server/repositories/arbCabPvRepository.ts`** (1h)
  - Extraire : toutes les méthodes Arb, Cab, ProjectPv, PvFile

- [ ] **Créer `server/repositories/auditRepository.ts`** (30 min)
  - Extraire : méthodes d'audit (actuellement dans `auditLogger.ts`)

- [ ] **Refactoriser `server/storage.ts` comme façade** (1h)
  - Importer tous les repositories
  - Exposer une interface unifiée `IStorage`
  - Déléguer aux repositories

### 3.3 Découpage des composants React monolithiques

- [ ] **Découper `client/pages/version-detail.tsx` (1079 lignes)** (4h)
  - Créer 6 composants :
    - `VersionHeader.tsx` (infos générales, release, CAB)
    - `VersionGitRepos.tsx` (liste des repos Git)
    - `VersionCommits.tsx` (commits d'un repo)
    - `VersionProcedures.tsx` (procédures d'un repo)
    - `VersionPVs.tsx` (procès-verbaux)
    - `VersionActions.tsx` (boutons d'action)

- [ ] **Découper `client/components/modals/procedure-modal.tsx` (670 lignes)** (2h)
  - Créer 3 composants :
    - `ProcedureForm.tsx` (formulaire)
    - `ProcedureRichEditor.tsx` (Quill editor)
    - `ProcedureActions.tsx` (boutons)

### 3.4 Créer une couche services (optionnel, si logique métier complexe)

- [ ] **Analyser si une couche services est nécessaire** (1h)
  - Identifier la logique métier actuelle (calcul de progression, génération de releaseId, etc.)
  - Si oui, créer `server/services/` avec :
    - `releaseService.ts` (génération de releaseId, calcul de statut)
    - `projectService.ts` (mise à jour du statut projet depuis versions)
    - `auditService.ts` (logging centralisé)

---

## Priorité 4 — Qualité de code (IMPORTANT)

### 4.1 Remplacer les `as any`

- [ ] **Remplacer les 51 `as any`** (6h)
  - `server/storage.ts` : 6 occurrences → utiliser les types Prisma
  - `server/routes.ts` : 5 occurrences → utiliser `SessionUser` et types Prisma
  - `server/replitAuth.ts` : 10 occurrences → typer correctement `req.session`
  - `server/middleware/` : 5 occurrences → typer correctement les types Express
  - `client/pages/project-detail.tsx` : 9 occurrences → typer les données API
  - Autres fichiers : 16 occurrences

### 4.2 Appliquer la validation Zod partout

- [ ] **Identifier tous les endpoints sans validation Zod** (1h)
  - Actuellement ~10% seulement appliquent `validate(schema)`
  - Lister tous les endpoints POST/PUT/PATCH

- [ ] **Créer les schemas Zod manquants** (3h)
  - `shared/validation/versions.ts` (ProjectVersionCreateSchema, ProjectVersionUpdateSchema)
  - `shared/validation/git.ts` (GitRepoCreateSchema, CommitCreateSchema, etc.)
  - `shared/validation/procedures.ts` (ProcedureCreateSchema, ProcedureUpdateSchema)
  - `shared/validation/arb.ts` (ArbCreateSchema, ArbUpdateSchema)
  - `shared/validation/cab.ts` (CabCreateSchema, CabUpdateSchema)
  - `shared/validation/pvs.ts` (PvCreateSchema, PvUpdateSchema)

- [ ] **Appliquer `validate(schema)` sur tous les endpoints** (4h)
  - Ajouter le middleware `validate` sur chaque route POST/PUT/PATCH
  - Tester chaque endpoint après ajout

### 4.3 Remplacer les `parseInt()` non validés

- [ ] **Remplacer les 64 `parseInt()` non validés** (2h)
  - Pattern actuel : `const id = parseInt(req.params.id)`
  - Pattern cible : `validate(IdParamSchema, "params")` déjà en place sur certaines routes
  - Appliquer systématiquement `IdParamSchema` sur toutes les routes avec `:id`

### 4.4 Standardiser l'error handling

- [ ] **Créer un middleware centralisé d'error handling** (1h)
  - Fichier : `server/middleware/errorHandler.ts`
  - Capturer toutes les erreurs Express
  - Logger en interne, retourner un message générique au client
  - Gérer les erreurs Prisma (P2002 unique constraint, P2025 not found, etc.)

- [ ] **Appliquer le middleware sur toutes les routes** (30 min)
  - Monter `errorHandler` en dernier middleware dans `server/app.ts`

### 4.5 Remplacer les console.log par un logger structuré

- [ ] **Installer et configurer `pino` ou `winston`** (1h)
  - Choix recommandé : `pino` (plus performant)
  - `npm install pino pino-pretty`
  - Créer `server/lib/logger.ts`
  - Exporter un logger configuré

- [ ] **Remplacer les 119 `console.log/error/warn`** (3h)
  - `server/routes.ts` : 60 occurrences
  - `server/fixtures-complete.ts` : 11 occurrences (OK pour du seeding)
  - `server/functional-tests.ts` : 10 occurrences (OK pour des tests)
  - Autres fichiers : 38 occurrences

---

## Priorité 5 — Tests (IMPORTANT)

### 5.1 Réparer les tests existants

- [ ] **Faire passer les 42 tests échoués** (3h, déjà dans Priorité 2)

- [ ] **Réactiver les 136 tests skippés** (4h, déjà dans Priorité 2)

### 5.2 Ajouter des tests unitaires

- [ ] **Tests unitaires `storage.ts`** (6h)
  - Créer `tests/unit/storage/` avec 20+ fichiers
  - Tester chaque méthode CRUD de chaque repository
  - Utiliser des mocks Prisma ou une base de test

- [ ] **Tests unitaires `routes.ts`** (8h)
  - Créer `tests/integration/routes/` avec 30+ fichiers
  - Tester chaque endpoint avec `supertest`
  - Tester les cas d'erreur (404, 400, 500)
  - Tester les middlewares d'authentification et d'autorisation

### 5.3 Ajouter des tests React

- [ ] **Tests composants critiques** (6h)
  - `tests/unit/components/version-detail.test.tsx`
  - `tests/unit/components/project-detail.test.tsx`
  - `tests/unit/components/modals/procedure-modal.test.tsx`
  - Utiliser `@testing-library/react`

### 5.4 Ajouter des tests E2E

- [ ] **Installer Playwright ou Cypress** (1h)
  - Choix recommandé : Playwright (plus moderne)
  - `npm install -D @playwright/test`

- [ ] **Créer des tests E2E critiques** (8h)
  - Login flow (demo mode)
  - Création d'une release
  - Création d'un projet et d'une version
  - Ajout d'un repo Git et de commits
  - Création de procédures
  - Validation CAB

### 5.5 Objectif couverture

- [ ] **Atteindre 60%+ de couverture de code** (20h total)
  - Actuellement <20%
  - Prioriser le code critique (auth, RBAC, CRUD)
  - Ajouter `npm run test:coverage` dans la CI

---

## Priorité 6 — Documentation (IMPORTANT)

### 6.1 Documentation racine

- [ ] **Créer `README.md` racine** (2h)
  - Description du projet
  - Prérequis (Docker, Node 22+, PostgreSQL 16)
  - Installation (make up, make run-dev)
  - Commandes disponibles
  - Structure du projet
  - Contribution (lien vers CONTRIBUTING.md)

- [ ] **Créer `CHANGELOG.md`** (1h)
  - Format Keep a Changelog
  - Documenter les versions passées depuis le début du projet
  - Automatiser avec `conventional-changelog` si possible

- [ ] **Créer `CONTRIBUTING.md`** (1h)
  - Conventions de code
  - Workflow de contribution (fork, branch, PR)
  - Comment lancer les tests
  - Comment documenter

### 6.2 Documentation architecture

- [ ] **Créer `docs/architecture/README.md`** (1h)
  - Vue d'ensemble de l'architecture
  - Diagramme des couches (client/server/shared)

- [ ] **Créer `docs/architecture/stack.md`** (1h)
  - Liste complète de la stack avec versions
  - Justification des choix technologiques

- [ ] **Créer `docs/architecture/data-model.md`** (2h)
  - Diagramme ER des 18 modèles Prisma
  - Description de chaque modèle
  - Relations many-to-many (TeamMember, ProjectVersionGitRepo, ReleaseProject)

- [ ] **Créer `docs/architecture/frontend.md`** (1h)
  - Structure client/
  - Routing (Wouter)
  - State management (TanStack Query)
  - UI components (shadcn/ui)

- [ ] **Créer `docs/architecture/backend.md`** (1h)
  - Structure server/
  - Middlewares (auth, RBAC, validation)
  - Couche repositories
  - Build pipeline (esbuild)

### 6.3 Documentation API

- [ ] **Créer `docs/api/README.md`** (1h)
  - Vue d'ensemble de l'API REST
  - Base URL
  - Format des réponses (JSON)

- [ ] **Créer `docs/api/authentication.md`** (1h)
  - Flow OAuth Microsoft Azure AD
  - Demo mode (dev uniquement)
  - Session management (cookie qarpes.sid)

- [ ] **Créer `docs/api/endpoints.md`** (4h)
  - Documenter tous les endpoints (63+)
  - Format : méthode, URL, params, body, response, permissions requises
  - Exemples de requêtes/réponses avec curl

- [ ] **Créer `docs/api/error-handling.md`** (1h)
  - Format des erreurs (JSON)
  - Codes HTTP utilisés (200, 201, 204, 400, 401, 403, 404, 500)
  - Exemples d'erreurs

### 6.4 Guides

- [ ] **Créer `docs/guides/installation.md`** (1h)
  - Installation avec Docker
  - Installation locale sans Docker
  - Configuration des variables d'environnement

- [ ] **Créer `docs/guides/development.md`** (1h)
  - Workflow de dev (make up, make run-dev)
  - Hot reload
  - Debugging (VSCode launch.json)

- [ ] **Créer `docs/guides/testing.md`** (1h)
  - Lancer les tests (npm test)
  - Écrire un test unitaire
  - Écrire un test d'intégration
  - Écrire un test E2E

- [ ] **Créer `docs/guides/deployment.md`** (2h)
  - Build Docker production
  - Variables d'environnement en production
  - Migrations Prisma en production
  - Health checks

- [ ] **Créer `docs/guides/security.md`** (2h)
  - Bonnes pratiques de sécurité
  - RBAC et permissions
  - Sanitization (HTML, SQL)
  - Audit logs

### 6.5 ADR (Architecture Decision Records)

- [ ] **Créer `docs/adr/001-monorepo.md`** (30 min)
  - Pourquoi un monorepo client/server/shared
  - Alternatives considérées (repos séparés)

- [ ] **Créer `docs/adr/002-esbuild-vs-tsc.md`** (30 min)
  - Pourquoi esbuild pour le build backend
  - Pourquoi tsc uniquement pour le typecheck

- [ ] **Créer `docs/adr/003-prisma-vs-drizzle.md`** (30 min)
  - Pourquoi Prisma (au lieu de Drizzle initial)
  - Migration effectuée

- [ ] **Créer `docs/adr/004-rbac-design.md`** (30 min)
  - Design du RBAC (6 rôles, matrice de permissions)
  - Pourquoi partagé entre client et serveur

- [ ] **Créer `docs/adr/005-session-storage.md`** (30 min)
  - Pourquoi PostgreSQL pour les sessions (connect-pg-simple)
  - Alternatives considérées (Redis, in-memory)

- [ ] **Créer `docs/adr/006-git-history-purge.md`** (30 min)
  - Décision de purger .env de l'historique git
  - Procédure utilisée (git filter-repo)
  - Conséquences (force push, re-clone)

- [ ] **Créer `docs/adr/007-many-to-many-tables.md`** (30 min)
  - Design des tables de liaison (TeamMember, ProjectVersionGitRepo, ReleaseProject)
  - Pourquoi pas de simple array JSON

---

## Priorité 7 — Propositions d'amélioration (FUTUR)

Idées pour améliorer le projet après avoir atteint 70/100.

### 7.1 Observabilité

- [ ] **Logging structuré complet** (4h)
  - Remplacer tous les console.log par pino
  - Ajouter des correlation IDs (request tracing)
  - Centraliser les logs (Loki, ELK, Datadog)

- [ ] **Monitoring applicatif** (6h)
  - Health check endpoint (`/api/health`)
  - Metrics endpoint (`/api/metrics`) avec Prometheus
  - Dashboards Grafana

- [ ] **APM (Application Performance Monitoring)** (8h)
  - Intégrer New Relic, Datadog, ou Sentry
  - Tracer les requêtes lentes
  - Alerting sur erreurs 5xx

### 7.2 Feature flags

- [ ] **Intégrer un système de feature flags** (6h)
  - Utiliser `launchdarkly`, `unleash`, ou implémentation custom
  - Permettre d'activer/désactiver des features sans redéploiement
  - Gestion par environnement et par utilisateur

### 7.3 Rate limiting granulaire

- [ ] **Rate limiting par endpoint** (4h)
  - Actuellement uniquement sur `/api/auth/*`
  - Appliquer sur tous les endpoints critiques (POST/PUT/DELETE)
  - Différencier par rôle (admin = limites plus hautes)

### 7.4 Cache Redis

- [ ] **Installer et configurer Redis** (6h)
  - Cache pour les requêtes fréquentes (dashboard stats, liste des projets)
  - Invalidation intelligente sur mutation
  - Session storage via Redis au lieu de PostgreSQL (optionnel)

### 7.5 Websockets et notifications temps réel

- [ ] **Intégrer Socket.IO** (8h)
  - Notifications en temps réel (nouvelle release, CAB validé, etc.)
  - Mise à jour live des dashboards
  - Collaboration temps réel (qui édite quoi)

### 7.6 Migration React 19 + Server Components

- [ ] **Migrer vers React 19** (16h)
  - Utiliser les Server Components (si pertinent)
  - Migrer vers les nouvelles APIs (useOptimistic, useFormState)
  - Tester la compatibilité shadcn/ui

### 7.7 Tests de performance

- [ ] **Installer k6 ou artillery** (2h)
  - Scripts de load testing
  - Identifier les endpoints lents

- [ ] **Optimiser les requêtes Prisma** (8h)
  - Analyser les N+1 queries
  - Ajouter des index sur les colonnes fréquemment filtrées
  - Utiliser `select` pour limiter les champs retournés

### 7.8 Internationalisation (i18n)

- [ ] **Installer react-i18next** (4h)
  - Support FR/EN
  - Traduire l'interface
  - Détection automatique de la langue

### 7.9 PWA (Progressive Web App)

- [ ] **Configurer Vite PWA plugin** (4h)
  - Service worker pour cache offline
  - Manifest.json pour install sur mobile
  - Push notifications (optionnel)

### 7.10 Dark mode amélioré

- [ ] **Améliorer le dark mode** (2h)
  - Actuellement géré par shadcn/ui
  - Persister la préférence utilisateur en base
  - Détection automatique (prefers-color-scheme)

### 7.11 Export PDF

- [ ] **Export PDF des PV et procédures** (6h)
  - Utiliser `puppeteer` ou `pdfmake`
  - Générer un PDF depuis le HTML
  - Téléchargement direct

### 7.12 Intégration Git

- [ ] **Webhooks GitHub/GitLab** (8h)
  - Auto-commit tracking via webhooks
  - Créer automatiquement un Commit en base quand un push est fait
  - Associer à la ProjectVersion correspondante

### 7.13 Dashboard analytics amélioré

- [ ] **Graphiques de tendance** (6h)
  - Utiliser `recharts` (déjà installé)
  - Graphique d'évolution du nombre de releases par mois
  - Graphique de vélocité (combien de versions déployées par semaine)
  - Taux de réussite CAB

### 7.14 Notifications email

- [ ] **Intégrer SMTP/SendGrid** (6h)
  - Notifications email sur événements importants (CAB validé, release prête)
  - Templates HTML avec Handlebars ou React Email

### 7.15 CI/CD complet

- [ ] **Déploiement automatique** (8h)
  - GitHub Actions : auto-deploy sur staging après merge sur `develop`
  - GitHub Actions : auto-deploy sur production après tag (ex: `v1.2.3`)
  - Deploy preview sur chaque PR (Vercel, Netlify, ou custom)

---

## Métriques de suivi

| Métrique                        | Avant   | Après nettoyage | Cible   | Progression |
| ------------------------------- | ------- | --------------- | ------- | ----------- |
| **Score global**                | 25/100  | ~30/100         | 70/100  | 🟡          |
| Dette technique                 | 18/100  | 25/100          | 60/100  | 🔴          |
| Complexité                      | 15/100  | 15/100          | 60/100  | 🔴          |
| Architecture                    | 22/100  | 22/100          | 70/100  | 🔴          |
| Tests                           | 22/100  | 55/100          | 70/100  | 🟡          |
| Maintenabilité                  | 28/100  | 35/100          | 70/100  | 🟡          |
| Sécurité                        | 35/100  | 35/100          | 80/100  | 🔴          |
| Configuration                   | 35/100  | 60/100          | 70/100  | 🟡          |
| **Erreurs TypeScript**          | 7       | **0** ✅        | 0       | ✅          |
| **Tests passants**              | 26      | **214** ✅      | 200+    | ✅          |
| **Tests échoués**               | 42      | **0** ✅        | 0       | ✅          |
| **Tests skippés**               | 136     | **9**           | 0       | 🟡          |
| **ESLint erreurs**              | N/A     | **0** ✅        | 0       | ✅          |
| **ESLint warnings**             | N/A     | **17**          | 0       | 🟡          |
| **Couverture de code**          | <20%    | <20%            | 60%+    | 🔴          |
| **`as any`**                    | 51      | 51              | 0       | 🔴          |
| **`parseInt()` non validés**    | 64      | 64              | 0       | 🔴          |
| **`console.log` en prod**       | 119     | 119             | 0       | 🔴          |
| **Endpoints sans RBAC**         | 23      | 23              | 0       | 🔴          |
| **Fichiers > 500 lignes**       | 5       | 5               | 0       | 🔴          |
| **Build backend**               | ❌ cassé | ✅ esbuild     | ✅      | ✅          |
| **CI GitHub Actions**           | ❌ absent | ✅ créé        | ✅      | ✅          |
| **Husky pre-commit**            | ❌ vide  | ✅ lint+check  | ✅      | ✅          |

---

## Estimations de temps total

| Priorité   | Effort estimé |
| ---------- | ------------- |
| Quick Wins | 1h            |
| Sécurité   | 10h           |
| Stabilité  | 10h           |
| Architecture | 30h         |
| Qualité    | 20h           |
| Tests      | 40h           |
| Documentation | 30h        |
| **TOTAL**  | **141h**      |

**Répartition recommandée** :
- Sprint 1 (1 semaine) : Quick Wins + Sécurité + Stabilité = 21h
- Sprint 2 (2 semaines) : Architecture routes/storage = 30h
- Sprint 3 (2 semaines) : Qualité de code = 20h
- Sprint 4 (2 semaines) : Tests = 40h
- Sprint 5 (1 semaine) : Documentation = 30h

**Score cible après les 5 sprints** : **70/100** (acceptable pour production).

---

**Dernière mise à jour** : 20 mai 2026 (post-nettoyage)
**Score actuel** : ~30/100 (en progression)
**Score cible** : 70/100 (production-ready)
**Temps total estimé** : ~130 heures restantes
