# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Critical Issues & Tech Debt

**BEFORE working on production features, review these high-priority items:**

1. **No server-side authentication:** Routes in `server/routes.ts` do not enforce `isAuthenticated` or session checks. All API endpoints are publicly accessible server-side. Authorization is **client-side only**.
2. **Demo auth route active in production:** `/api/auth/demo?role=<role>` allows login as any role without credentials. Controlled by `NODE_ENV` check in replitAuth.ts but currently NOT restricted to development.
3. **`.env` tracked in git:** Database credentials, SESSION_SECRET (value: `secret`), and Azure AD config are committed. Must be removed and rotated.
4. **72 TypeScript errors:** `npm run check` fails. Production build will fail without fixes or missing deps.
5. **2 missing dependencies:** `embla-carousel-react`, `input-otp` imported by shadcn/ui components but not in package.json.
6. **18 npm vulnerabilities:** 9 high-severity. Run `npm audit` for details.
7. **XSS vectors:** `procedure.content` rendered via `dangerouslySetInnerHTML` without sanitization (version-detail.tsx:236, project-detail.tsx:118).
8. **Stale debug code:** `=== ASSOCIATION DEBUG START ===` block (server/routes.ts:446–489) should be removed.

## Project Overview

QARPES-v2 is a release and project management system for Omnes Education. It tracks releases, project versions, team assignments, Git repositories, deployment procedures, ARB (Architecture Review Board) requests, and CAB (Change Advisory Board) validations.

## Development Environment

The project runs inside Docker. All commands must be executed via `docker compose exec app`.

### Essential Commands

```bash
# Start the environment
make up                          # docker compose up -d --build

# Development server
make run-dev                     # npm run dev inside container

# Full reload (rebuild + migrate + seed + dev)
make reload-app

# Database operations
docker compose exec app npx prisma generate     # Regenerate Prisma client
docker compose exec app npx prisma migrate dev   # Create/apply migrations in dev
docker compose exec app npx prisma migrate deploy # Apply migrations
docker compose exec app npx prisma db seed       # Seed with fixtures
make studio                                      # Launch Prisma Studio

# Type checking (tsc only; no linting/unit tests configured)
make check                       # npm run check (tsc --noEmit)

# Shell access
make sh                          # Shell into the app container

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
