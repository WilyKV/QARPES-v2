# CLAUDE.md — Instructions projet pour les agents IA

> Fichier de référence pour Claude Code et tout agent IA travaillant sur QARPES-v2.
> Lire ce fichier en premier avant toute intervention sur le projet.

---

## Description du projet

**QARPES-v2** est une application web fullstack TypeScript à usage interne pour **Omnes Education**.

Elle gère le cycle de vie complet des releases logicielles :
- Releases avec dates de déploiement (recette/preprod/production)
- Projets, versions de projets, dépôts Git
- Équipes et membres
- Procédures de déploiement (4 types : environment_variables, service_verification, command_execution, data_import)
- ARB (Architecture Review Board) avec workflow d'approbation
- CAB (Change Advisory Board) avec statuts (cree → demande → valide/refuse)
- PV (Procès-Verbaux) avec pièces jointes (4 catégories recette/preprod)
- Audit logs et traçabilité complète

**Monorepo** organisé en trois zones : `client/` (React), `server/` (Express), `shared/` (types et logique partagés).

---

## Stack technique

| Technologie          | Version                            |
| -------------------- | ---------------------------------- |
| TypeScript           | 5.6.3 (`strict: true`)             |
| React                | 18.3.1                             |
| Wouter (routing)     | 3.3.5                              |
| TanStack Query       | 5.60.5                             |
| Radix UI + shadcn/ui | dernière                           |
| Tailwind CSS         | 3.4.17                             |
| React Hook Form      | 7.55                               |
| Zod                  | 3.24.2                             |
| Express              | 4.21.2                             |
| Prisma               | 6.9.0                              |
| PostgreSQL           | 16                                 |
| Vite                 | 5.4.14                             |
| Vitest               | 4.1.6                              |
| ESLint               | 9 (flat config)                    |
| Prettier             | 3.8.3                              |
| esbuild              | 0.25.0                             |
| Docker               | Multi-stage (dev/builder/prod)     |
| **Package manager**  | **npm** (PAS yarn, PAS pnpm)       |

---

## Structure RÉELLE du projet

```
QARPES-v2/
├── client/src/
│   ├── components/
│   │   ├── layout/              # Header (104 lignes), Sidebar (183 lignes)
│   │   ├── modals/              # 12 modals (~3968 lignes total)
│   │   └── ui/                  # 49 composants shadcn/ui
│   ├── hooks/                   # 5 hooks (useAuth, usePermissions, useTheme, etc.)
│   ├── lib/                     # 6 utilitaires (queryClient, sanitize, permissions, etc.)
│   ├── pages/                   # 11 pages
│   ├── App.tsx                  # Routes Wouter + ProtectedRoute
│   └── main.tsx                 # Entry point React
├── server/
│   ├── middleware/              # authenticate, requirePermission, validate
│   ├── lib/                     # sanitize.ts (sanitize-html backend)
│   ├── types/                   # express.d.ts (SessionUser)
│   ├── index.ts                 # Entry point Express (port 8080)
│   ├── app.ts                   # Express app setup (helmet, routes, error handler)
│   ├── db.ts                    # Prisma client
│   ├── routes.ts                # MONOLITHE — 1072 lignes, 63+ endpoints
│   ├── storage.ts               # MONOLITHE — 1015 lignes, 60+ méthodes CRUD
│   ├── replitAuth.ts            # OAuth Microsoft + demo mode
│   ├── auditLogger.ts           # Audit logs helper
│   ├── vite.ts                  # Serveur statique prod
│   ├── viteDev.ts               # Vite dev middleware
│   ├── fixtures-complete.ts     # Seeding (1076 lignes)
│   ├── functional-tests.ts      # Tests fonctionnels ad-hoc (dev uniquement)
│   └── functional-tests-teams.ts
├── shared/
│   ├── schema.ts                # Types Prisma (381 lignes)
│   ├── permissions.ts           # RBAC 6 rôles (227 lignes)
│   ├── progress-utils.ts        # Calcul progression releases
│   └── validation/              # Schemas Zod (4 fichiers)
│       ├── common.ts
│       ├── teams.ts
│       ├── projects.ts
│       └── releases.ts
├── tests/
│   ├── integration/             # 10 fichiers test (auth, RBAC, XSS, OAuth, etc.)
│   ├── unit/                    # 3 fichiers test (sanitize, permissions)
│   ├── helpers/                 # Test utilities
│   └── smoke.test.ts
├── prisma/
│   ├── schema.prisma            # 18 modèles
│   └── migrations/              # 8 migrations
├── scripts/
│   └── build-backend.mjs        # Build esbuild backend
├── docs/
│   └── legacy/specs/            # Spécifications initiales archivées
├── .github/workflows/ci.yml     # GitHub Actions CI
├── .husky/pre-commit            # lint + typecheck
├── Dockerfile                   # Multi-stage (dev/builder/production)
├── docker-compose.yml           # App + PostgreSQL
├── makefile                     # Commandes Docker
├── package.json
├── tsconfig.json                # noEmit: true (tsc = typecheck uniquement)
├── vite.config.ts
├── vitest.config.ts
├── eslint.config.js             # ESLint v9 flat config
├── .prettierrc.json
├── tailwind.config.ts
├── postcss.config.js
├── components.json              # Config shadcn/ui
├── .env.example
├── .dockerignore
├── CLAUDE.md                    # CE FICHIER
└── LICENSE
```

---

## État actuel du projet

### Scores d'audit technique (20 mai 2026)

- **Score global : 25/100** (CRITIQUE)
- Dette technique : 18/100
- Complexité : 15/100
- Architecture : 22/100
- Tests : 22/100
- Maintenabilité : 28/100
- Sécurité : 35/100
- Configuration : 35/100

### Métriques de code

- **51 `as any`** dans le code (storage.ts, routes.ts, replitAuth.ts, middleware)
- **64 `parseInt()` non validés** (routes.ts, pages React)
- **119 `console.log/error/warn`** en production (à remplacer par logging structuré)
- **7 erreurs TypeScript** actives (`npm run check`)
- **14 fichiers de test** (26 passent, ~42 échouent, ~136 skippés)

### Fichiers monolithiques critiques

| Fichier                              | Lignes | Action requise                          |
| ------------------------------------ | ------ | --------------------------------------- |
| `server/routes.ts`                   | 1072   | Découper en 11 routeurs par domaine     |
| `server/storage.ts`                  | 1015   | Découper en 6+ repositories par agrégat |
| `server/fixtures-complete.ts`        | 1076   | OK (seeding massif)                     |
| `client/pages/version-detail.tsx`    | 1079   | Découper en 6+ composants               |
| `client/modals/procedure-modal.tsx`  | 670    | Découper en 3+ composants               |

### Problèmes de sécurité actifs

- ⚠️ **Backdoor demo auth** : `/api/auth/demo` dans `PUBLIC_API_ROUTES` (ligne 19 routes.ts)
- ⚠️ **23 endpoints mutants sans `requirePermission`** côté serveur (client protégé mais pas API)
- ⚠️ **`error.message` exposé au client** dans plusieurs endpoints (routes.ts lignes 384-389, 530)
- ⚠️ **10 `as any` dans `replitAuth.ts`** (session non typée)
- ⚠️ **Bloc debug** dans routes.ts lignes 446-489 (à supprimer)

---

## Modèle de données (18 modèles Prisma)

- **User** : Authentification (Azure AD ou demo), rôle
- **Member** : Membre d'équipe (lié ou non à un User)
- **Team** : Équipe avec leader
- **TeamMember** : Association Team-Member (many-to-many)
- **Project** : Projet avec status (development/testing/preproduction/production)
- **Release** : Release avec releaseId auto-généré (YYYYMM-NN), 3 dates de déploiement
- **ReleaseProject** : Association Release-Project
- **ProjectVersion** : Version d'un projet liée à une release
- **GitRepo** : Dépôt Git
- **ProjectVersionGitRepo** : Association ProjectVersion-GitRepo (many-to-many)
- **Commit** : Commits Git liés à une association ProjectVersionGitRepo
- **Procedure** : Procédures de déploiement (4 types), liées à ProjectVersionGitRepo
- **Cab** : Change Advisory Board (statuts : cree/demande/valide/refuse)
- **Arb** : Architecture Review Board (statuts : pending/in_review/approved/rejected)
- **ProjectPv** : Procès-Verbaux (4 catégories : recette_ok/recette_nok/preprod_ok/preprod_nok)
- **PvFile** : Pièces jointes des PV
- **AuditLog** : Traçabilité (action, resource, userId, timestamp, metadata)
- **Session** : Sessions PostgreSQL (connect-pg-simple, 7j TTL)

---

## Authentification & RBAC

### Auth

- **Production cible** : Microsoft OAuth (Azure AD) → session PostgreSQL
- **Demo mode actuel** : `/api/auth/demo?role=<role>` — **BACKDOOR à fermer en prod**
- **Session** : connect-pg-simple, cookie `qarpes.sid`, 7 jours, httpOnly, secure en prod

### Rôles (6 rôles client dans `shared/permissions.ts`)

| Rôle         | Description                                                 |
| ------------ | ----------------------------------------------------------- |
| admin        | Accès total (toutes permissions)                            |
| prod         | Voir tout, modifier projects/releases/git/procedures        |
| architecte   | Voir tout, modifier ARB uniquement                          |
| po           | Product Owner — Voir tout, modifier teams/projects/git      |
| chef_projet  | Voir tout, modifier teams/projects/git                      |
| invite/viewer| Lecture seule sur tout                                      |

### Permissions

- `view_all` (tous sauf visiteurs anonymes)
- `edit_teams`, `delete_teams`
- `edit_projects`, `delete_projects`
- `edit_releases`, `delete_releases`
- `edit_arb`, `delete_arb`
- `edit_git_repos`, `edit_procedures`
- `admin` (admin uniquement)

### Middlewares serveur

- `requireAuth(req, res, next)` — vérifie `req.session.user`
- `requirePermission(permission)` — vérifie RBAC via `shared/permissions.ts`
- `validate(schema, source)` — validation Zod sur body/params/query

**Routes publiques** (ligne 15-20 routes.ts) :
- `/api/login`
- `/api/callback`
- `/api/logout`
- `/api/auth/demo` (⚠️ **à conditionner à NODE_ENV=development**)

---

## Architecture du build

### Mode développement

```bash
npm run dev
```

- Lance `tsx server/index.ts` directement
- **Pas de compilation** : tsx exécute le TypeScript à la volée via Vite dev server
- Hot reload activé (Vite HMR)
- Port : 8080 (backend + frontend servi par Vite)

### Mode production

```bash
npm run build       # esbuild backend + vite frontend
npm start           # node dist/server/index.js
```

**Pipeline de build** :

1. **Backend** : `scripts/build-backend.mjs` (esbuild)
   - Bundle `server/index.ts` → `dist/server/index.js` (ESM, external packages)
   - Transpile séparément `server/vite.ts` et `server/viteDev.ts` (imports dynamiques)
   - Banner ESM injecté : `createRequire`, `__filename`, `__dirname`
   - ⚠️ **viteDev.ts existe dans dist/ mais n'est jamais chargé en prod**

2. **Frontend** : `vite build`
   - Build React → `dist/public/` (assets statiques)

**Pourquoi esbuild et pas tsc ?**

Le `tsconfig.json` a `"noEmit": true` et `"moduleResolution": "bundler"` :
- `noEmit` empêche l'émission de fichiers JS
- `bundler` n'est pas supporté par `tsc --module Node16`
- **tsc est réservé au typecheck** (`npm run check`)

---

## Commandes principales

### npm (dans le container Docker ou en local)

| Commande                 | Description                                    |
| ------------------------ | ---------------------------------------------- |
| `npm run dev`            | Serveur dev (tsx, port 8080)                   |
| `npm run build`          | Build prod (esbuild + vite → `dist/`)          |
| `npm run build:backend`  | Build backend uniquement (esbuild)             |
| `npm run build:frontend` | Build frontend uniquement (Vite)               |
| `npm start`              | Démarrage prod (`node dist/server/index.js`)   |
| `npm run check`          | TypeCheck (`tsc --noEmit`)                     |
| `npm run lint`           | ESLint                                         |
| `npm run lint:fix`       | ESLint avec correction automatique             |
| `npm run format`         | Prettier (écriture)                            |
| `npm run format:check`   | Prettier (vérification)                        |
| `npm test`               | Vitest (mode run)                              |
| `npm run test:watch`     | Vitest (mode watch — TDD)                      |
| `npm run test:coverage`  | Tests avec rapport de couverture               |

### Prisma

| Commande                     | Description                          |
| ---------------------------- | ------------------------------------ |
| `npx prisma generate`        | Générer le client Prisma             |
| `npx prisma migrate dev`     | Créer et appliquer une migration     |
| `npx prisma migrate deploy`  | Appliquer migrations en production   |
| `npx prisma db seed`         | Seed la base (fixtures-complete.ts)  |
| `npx prisma studio`          | Interface graphique (port 5555)      |

### Docker (via Makefile)

| Commande           | Description                                    |
| ------------------ | ---------------------------------------------- |
| `make up`          | docker compose up -d --build                   |
| `make run-dev`     | npm run dev dans le container                  |
| `make reload-app`  | rebuild + migrate + seed + dev                 |
| `make run-seed`    | Seed la base de données                        |
| `make down`        | Arrêter les services                           |
| `make sh`          | Shell dans le container                        |
| `make check`       | TypeCheck                                      |
| `make studio`      | Prisma Studio                                  |
| `make build`       | Build image Docker production                  |
| `make test-prod`   | Test image prod en local                       |
| `make status`      | État des containers                            |
| `make logs`        | Logs                                           |
| `make clean`       | Supprimer images prod + dist/                  |
| `make clean-all`   | Nettoyage complet (+ volumes)                  |

---

## Variables d'environnement

Voir `.env.example` pour le template complet.

### Obligatoires

- `DATABASE_URL` — URL PostgreSQL (ex: `postgresql://qarpes:changeme@db:5432/qarpes`)
- `SESSION_SECRET` — Secret de session (min 64 chars random, générer avec `crypto.randomBytes(64).toString('hex')`)

### Optionnelles

- `NODE_ENV` — `development` | `production` (défaut : `development`)
- `PORT` — Port du serveur (défaut : `8080`)
- `FORCE_FIXTURES` — `true` pour recharger les fixtures de dev
- `MICROSOFT_CLIENT_ID` — App Registration Azure AD (optionnel en dev)
- `MICROSOFT_TENANT_ID` — Tenant Azure AD
- `MICROSOFT_CLIENT_SECRET` — Secret Azure AD
- `ALLOWED_DOMAIN` — Domaine autorisé (ex: `omneseducation.com`)
- `ALLOWED_ORIGINS` — Origines CORS autorisées

### Variables par défaut en dev (docker-compose.yml)

```env
DATABASE_URL=postgresql://qarpes:qarpes@db:5432/qarpes
SESSION_SECRET=replace-with-crypto-randomBytes-64-hex
NODE_ENV=development
PORT=8080
FORCE_FIXTURES=true
```

---

## Ports

- **3000 → 8080** (Express backend, mappé par docker-compose)
- **5173** (Vite dev server, hot reload)
- **5555** (Prisma Studio)
- **5433 → 5432** (PostgreSQL, mappé par docker-compose)

---

## Conventions de code

### Nommage

- Fichiers React/TSX : `kebab-case` (ex: `version-detail.tsx`)
- Composants React : `PascalCase` (ex: `VersionDetail`)
- Hooks : `camelCase` préfixé `use` (ex: `useVersionPermissions`)
- Variables/fonctions : `camelCase`
- Types/Interfaces : `PascalCase`
- Constantes : `SCREAMING_SNAKE_CASE`
- Routes API : `kebab-case` (ex: `/api/project-versions/:id/pvs`)

### Commits

- **Conventional Commits obligatoires** : `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, etc.
- Messages de commit **en anglais**
- Husky pre-commit : lint + typecheck

### Fichiers

- Max **300 lignes** par fichier (cible)
- Alarme > 500 lignes
- **Interdit** > 1000 lignes (sauf fixtures, tests d'intégration massifs)

---

## Règles de sécurité ABSOLUES

### Interdictions

1. **Ne JAMAIS commiter** `.env`, `cookies.txt`, secrets, credentials
2. **Ne JAMAIS importer** `vite` ou `viteDev.ts` en import statique — utiliser un import dynamique conditionné à `NODE_ENV === 'development'`
3. **Ne JAMAIS utiliser** `dangerouslySetInnerHTML` sans `DOMPurify.sanitize()`
4. **Ne JAMAIS écrire de route `/api/*`** sans `requireAuth` + `requirePermission(...)` — sauf les 3 routes publiques : `/api/login`, `/api/callback`, `/api/logout`
5. **Ne JAMAIS faire** `parseInt(req.params.id)` sans validation NaN — utiliser `parseIntOrFail()` ou Zod `IdParamSchema`
6. **Ne JAMAIS utiliser** `req.body` sans validation Zod — utiliser `validate(schema)`
7. **Ne JAMAIS retourner** `error.message` au client en production
8. **Ne JAMAIS utiliser** `Math.random()` pour des tokens/states de sécurité — utiliser `crypto.randomBytes()`
9. **Ne JAMAIS typer** `req.session` avec `as any` — utiliser le typage `SessionUser` (`server/types/express.d.ts`)

### Obligations

- Toujours sanitiser le HTML utilisateur avant `dangerouslySetInnerHTML` (utiliser `sanitizeRichText` server-side)
- Toujours typer les `catch (error: unknown)` et conserver le message en interne uniquement
- Toujours résoudre les paths runtime via `process.cwd()` ou chemins absolus construits à l'exécution — **`import.meta.dirname` change entre source TypeScript et bundle esbuild**
- Toujours conditionner les imports de `vite` / `viteDev.ts` à `NODE_ENV === 'development'` via un import dynamique
- Toujours appliquer la validation Zod sur les endpoints (actuellement ~10% seulement)

---

## Tests

### État actuel

- **14 fichiers de test** (`tests/**/*.test.ts`)
- **26 tests passent**
- **~42 tests échouent** (dépendances manquantes dans l'env de test : `sanitize-html`, `jsdom`)
- **~136 tests skippés** (tests d'intégration API)

### Stratégie de test

- **TDD obligatoire** pour le code de sécurité (middlewares, validation, RBAC)
- **Tests unitaires** : `tests/unit/` (sanitize, permissions, utils)
- **Tests d'intégration** : `tests/integration/` (auth, RBAC, XSS, OAuth, etc.)
- **Tests E2E** : à créer (Playwright ou Cypress)
- **Couverture cible** : 60%+ (actuellement <20%)

---

## CI/CD

### GitHub Actions (`.github/workflows/ci.yml`)

- Typecheck (`npm run check`)
- Lint (`npm run lint`)
- Tests (`npm test`)
- Audit (`npm audit --audit-level=high`)

**Statut actuel** : CI basique configurée, mais les tests échouent (dépendances manquantes).

### Husky pre-commit

- `npm run lint`
- `npm run check`

---

## Principes SOLID & Clean Code

- Un fichier = une responsabilité (max 300 lignes)
- Pas de fichier > 500 lignes (alarme), > 1000 lignes (interdit sauf cas justifiés)
- Pas de `Promise<any>` — utiliser les types Prisma générés `Prisma.XxxGetPayload<{}>`
- Logique métier dans `services/` (à créer), persistance dans `repositories/` (à créer), HTTP dans `routes/`
- Pas de logique métier dans les routes Express
- Pas d'accès Prisma direct hors des repositories

---

## Problèmes connus à corriger en priorité

### Quick Wins (< 1h)

- [ ] Conditionner `/api/auth/demo` à `NODE_ENV=development` dans routes.ts (5 min)
- [ ] Supprimer le bloc debug "=== ASSOCIATION DEBUG" dans routes.ts lignes ~446-489 (5 min)
- [ ] Installer les dépendances de test manquantes (`sanitize-html`, `jsdom`) (10 min)

### Sécurité critique

- [ ] Fermer la backdoor demo auth en production
- [ ] Ajouter `requirePermission` sur les 23 endpoints mutants sans protection
- [ ] Remplacer `error.message` par des messages génériques dans les réponses 500
- [ ] Régénérer `SESSION_SECRET` avec `crypto.randomBytes(64).toString('hex')`
- [ ] Ajouter `req.session.regenerate()` après login (anti session-fixation)

### Stabilité

- [ ] Corriger les 7 erreurs TypeScript restantes (`npm run check`)
- [ ] Faire passer les 42 tests échoués
- [ ] Investiguer et réactiver les 136 tests skippés

### Dette technique

- [ ] Découper `routes.ts` en 11 routeurs par domaine
- [ ] Découper `storage.ts` en 6+ repositories par agrégat
- [ ] Découper `version-detail.tsx` (1079 lignes → 6 composants)
- [ ] Découper `procedure-modal.tsx` (670 lignes → 3 composants)
- [ ] Remplacer les 51 `as any` par des types Prisma/SessionUser
- [ ] Remplacer les 64 `parseInt()` non validés par `parseIntOrFail()` ou Zod
- [ ] Remplacer les 119 `console.log` par logging structuré (pino/winston)

---

## Workflow de développement

1. **Lire** ce fichier (`CLAUDE.md`) et `TODO.md`
2. **Comprendre** l'état actuel du projet (score 25/100, dette technique élevée)
3. **Suivre** les conventions de code et les règles de sécurité
4. **Tester** en local avec Docker (`make up` puis `make run-dev`)
5. **Commiter** avec Conventional Commits en anglais
6. **Vérifier** que la CI passe avant de merger

---

## Documentation

- **Ce fichier** (`CLAUDE.md`) : instructions projet pour les agents IA
- **`TODO.md`** : plan d'action détaillé par priorité
- **`docs/legacy/specs/`** : spécifications initiales archivées

**Documentation manquante** (à créer) :
- `README.md` racine
- `CHANGELOG.md`
- `CONTRIBUTING.md`
- `docs/architecture/` (overview, stack, data-model, frontend, backend)
- `docs/api/` (README, authentication, endpoints, error-handling)
- `docs/guides/` (installation, dev, testing, deployment, security)
- `docs/adr/` (Architecture Decision Records)

---

## Liens utiles

- Plan d'action complet : `TODO.md`
- Permissions/RBAC : `shared/permissions.ts`
- Schemas Zod : `shared/validation/`
- Session types : `server/types/express.d.ts`
- Middlewares : `server/middleware/`
- Build script : `scripts/build-backend.mjs`

---

**Dernière mise à jour** : 20 mai 2026  
**Score technique actuel** : 25/100 (CRITIQUE)  
**Prochaines actions** : Voir `TODO.md`

# Production build
make build                       # Builds prod Docker image (multi-stage)
make test-prod                   # Test production image locally
```

### Ports

- **3000** → 8080 (Express backend, mapped externally)
- **5173** (Vite dev server, hot reload)
- **5555** (Prisma Studio)
- **5433** → 5432 (PostgreSQL, mapped externally)

### Environment

Database defaults: `postgresql://qarpes:qarpes@db:5432/qarpes`. Set `FORCE_FIXTURES=true` in `.env` to reload seed data on startup. Microsoft OAuth requires `MICROSOFT_CLIENT_ID`, `MICROSOFT_TENANT_ID`, `MICROSOFT_CLIENT_SECRET` (see .env.example if present).

**Dev-mode functional tests:** `server/functional-tests.ts` and `server/functional-tests-teams.ts` run automatically on startup (index.ts:78–83). These are ad-hoc validation routines, not unit tests.

### Docker Architecture

The project uses a **unified multi-stage Dockerfile** at the root:
- **base** → common setup (node:22-alpine)
- **dependencies** → npm ci with all deps (dev + prod)
- **development** → target for docker-compose (hot reload, ports 8080+5173+5555)
- **builder** → compiles TypeScript + builds Vite frontend
- **production** → minimal runtime image (default stage)

Docker Compose targets the `development` stage for local dev. Production deployments build the final `production` stage.

## Architecture

### Stack

- **Backend:** Express + TypeScript (ES Modules) on Node 22
- **Frontend:** React 18 + Vite + Tailwind CSS + shadcn/ui (New York style)
- **Database:** PostgreSQL 16 + Prisma ORM (18 models)
- **Routing:** Wouter (not React Router)
- **State:** TanStack React Query v5
- **Auth:** Microsoft O365 OAuth (Azure AD) with demo mode bypass (currently non-functional in production)

### Key Directories

```
server/
  index.ts          # Express entry point (port 8080, Vite dev middleware)
  routes.ts         # All API route handlers (1045 lines, 63+ endpoints)
  storage.ts        # Prisma data layer (975 lines, 14+ aggregates)
  replitAuth.ts     # Auth: Microsoft OAuth + demo mode
  auditLogger.ts    # Audit logging
  fixtures-complete.ts  # Database seeding (1076 lines)

client/src/
  App.tsx            # Routes (Wouter) + protected route wrapper
  pages/             # Route page components
    version-detail.tsx  # 1078 lines, heavily refactored, core release UI
  components/ui/     # shadcn/ui components (50+)
  components/layout/ # Header, Sidebar
  hooks/             # useAuth, usePermissions, useTheme
  lib/permissions.ts # Role-based permission definitions

shared/
  schema.ts          # TypeScript types (migrated from Drizzle, no Zod validation)

prisma/
  schema.prisma      # 18 models: User, Member, Team, TeamMember, Project, Release, ReleaseProject, Arb, ProjectVersion, Commit, Cab, Procedure, ProjectPv, PvFile, GitRepo, ProjectVersionGitRepo, AuditLog, Session
```

### Data Flow

1. Frontend pages use TanStack Query hooks to call `/api/*` endpoints
2. `server/routes.ts` handles all API routes, delegates to `server/storage.ts`
3. `storage.ts` uses Prisma client for all database operations
4. Shared types in `shared/schema.ts` are used by both client and server

### Authentication & Authorization

**Auth flow:** Microsoft OAuth callback → session stored in PostgreSQL (connect-pg-simple, 7-day TTL).

**Demo mode:** `/api/auth/demo?role=<role>` bypasses OAuth. Accepts `["admin", "manager", "dev", "ops", "viewer"]` (client expects `["admin", "prod", "architecte", "po", "chef_projet", "viewer"]` — role mismatch).

**6 client-side roles:** `admin`, `prod`, `architecte`, `po`, `chef_projet`, `viewer`/`invite`

Permissions are defined in `client/src/lib/permissions.ts` and consumed via `usePermissions` hook. Key permissions: `edit_teams` (admin/po/chef_projet), `edit_releases` (admin/prod), `edit_arb` (admin/architecte), `delete_*` (mostly admin-only). **Authorization is enforced client-side only; server does not validate.**

### Domain Concepts

- **Release** — groups multiple ProjectVersions for coordinated deployment, with recette/preprod/production dates
- **ProjectVersion** — a specific version of a Project, linked to GitRepos via `ProjectVersionGitRepo` junction table
- **Procedure** — deployment steps per repo, categorized by type (environment_variables, service_verification, command_execution, data_import)
- **ARB** — Architecture Review Board requests with approval workflow
- **CAB** — Change Advisory Board entries for preprod/prod deployments (status: cree → demande → valide/refuse)
- **PV (Procès-Verbal)** — validation documents with file attachments, 4 categories across recette/preprod phases

### Path Aliases (tsconfig + Vite)

- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `attached_assets/*`

## File Size & Complexity

- **`version-detail.tsx`**: 1078 lines (not 50K; core release detail UI with 10+ useState, 5 modals)
- **`server/routes.ts`**: 1045 lines (single `registerRoutes()` function, 63+ endpoints)
- **`server/storage.ts`**: 975 lines (single `DatabaseStorage` class, 14+ data methods)
- **`server/fixtures-complete.ts`**: 1076 lines (seed data)

Large files should be refactored cautiously; they handle critical domain logic. Changes require testing.

## Tooling

### Configured (as of May 2026)

- **Vitest** (`npm run test` / `npm run test:watch` / `npm run test:coverage`): framework de test configuré, environment node, aliases `@/`, `@shared/`, `@assets/` actifs. Tests dans `tests/**/*.test.ts`, `server/**/*.test.ts`, `shared/**/*.test.ts`. Smoke test present in `tests/smoke.test.ts`.
- **ESLint** (`npm run lint` / `npm run lint:fix`): flat config ESM (`eslint.config.js`), typescript-eslint recommended (sans type-aware rules), eslint-plugin-react + react-hooks + react-refresh pour `client/src/**`. 18 problemes restants (1 erreur `prefer-const` auto-fixable, 17 warnings pre-existants) — la codebase n'est pas encore conforme, le nettoyage est prevu separement.
- **Prettier** (`npm run format` / `npm run format:check`): config dans `.prettierrc.json`, ignore dans `.prettierignore`. `eslint-config-prettier` integre dans la chaine ESLint pour eviter les conflits. **Ne pas executer `npm run format` sans revue** : cela reformatterait toute la codebase, ce qui doit etre fait en PR dediee.

### Restant a configurer

- **Husky + lint-staged:** pre-commit hooks non configures.
- **CI/CD pipeline:** pas de `.github/workflows/`. Deployments manuels.
- **Validation:** Zod importe mais inutilise cote serveur post-migration Drizzle. Pas de validation des corps de requetes.

## Important Notes

- The project uses ES Modules (`"type": "module"` in package.json).
- Prisma schema was migrated from Drizzle; `shared/schema.ts` contains manual TypeScript types rather than auto-generated Drizzle schemas.
- Fixtures auto-load on empty database during dev startup. Use `FORCE_FIXTURES=true` to force reload.
- The unified Dockerfile uses multi-stage builds. For dev, Docker Compose targets the `development` stage. For prod, build the full image (defaults to `production` stage).
- Prisma migrations are in `prisma/migrations/` (7 active); monitor for untracked migrations (e.g., `20251003163512_add_member_model` is untracked in git).

## Recommended Quick Wins

1. **Remove `.env` from git:** Create `.env.example`, add `.env` to `.gitignore`, rotate `SESSION_SECRET`.
2. **Add server-side auth middleware:** Wrap `/api/*` routes (except `/api/auth/*`) with `isAuthenticated` check.
3. **Restrict demo mode to dev:** Add `if (NODE_ENV !== 'development') return 403` to `/api/auth/demo`.
4. **Fix TypeScript errors:** Install missing deps (`embla-carousel-react`, `input-otp`) or suppress 72 errors.
5. **Clean up lint warnings:** ESLint + Prettier + Vitest are now configured. Next: resolve 17 lint warnings and run `npm run format` in a dedicated PR.
