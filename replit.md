# Dowry.Africa — Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Dowry.Africa Application

### Demo Accounts
- chidinma@demo.com / demo (woman, Lagos, badge tier)
- emeka@demo.com / demo (man, Nairobi, core tier)
- amara@demo.com / demo (woman, London, badge tier)
- kofi@demo.com / demo (man, Johannesburg, badge tier)

### Key Features
- JWT auth (30d expiry), stored as `da_token` in localStorage
- PostgreSQL persistence via Drizzle ORM (tables: users, likes, passes, messages, blocks, reports, notifications)
- Migrations run automatically on startup via `runMigrations()` (CREATE TABLE IF NOT EXISTS — idempotent)
- Demo users seeded on first boot via `seedDatabase()` (INSERT ... ON CONFLICT DO NOTHING)
- 5-dimension matching algorithm (values 30%, lifeStage 25%, cultural 20%, practical 15%, engagement 10%)
- Subscription tiers: free (5 matches), core ($12.99/mo), badge ($19.99/mo)
- Stripe in demo mode (no STRIPE_SECRET_KEY needed)
- Partner Preferences on Profile: gender, age range, heritage, faith, children, timeline, location, relocation

### Safety & Moderation
- **Unlike**: `DELETE /api/matches/like/:userId` — undo a non-mutual like
- **Unmatch**: `POST /api/matches/unmatch/:userId` — delete both likes, all messages, and related notifications
- **Block**: `POST /api/users/:userId/block` — adds to `blocks` table, also unmatches
- **Unblock**: `DELETE /api/users/:userId/block`
- **Blocked list**: `GET /api/users/me/blocked`
- **Match status**: `GET /api/matches/status/:userId` — returns `{ liked, matched }`
- **User report**: `POST /api/reports` — reason + optional details, "also block" option
- Feed, liked-me, and conversations all filter blocked users in both directions

### Frontend UX
- Profile page (`/members/:id`): ⋮ menu (top-left of photo) with Unmatch / Block / Report; heart toggles unlike state
- Report modal: reason dropdown, details textarea, "Also block" checkbox
- Messages page (`/messages/:id`): ⋮ button in chat header with View Profile / Unmatch / Block (both with confirmation dialogs)
- Profile page (`/profile`): Privacy & Safety section shows blocked users with Unblock button

### New Fields (added to User model)
- `preferredFaith` — partner's preferred faith
- `preferredCountry` — preferred partner location
- `preferredHeritage[]` — preferred partner heritage(s)

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

## Production Environment Variables (Railway / Deployment)

### API Server — Required
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Random 64-char secret for signing JWTs |
| `ADMIN_SECRET` | Initial password hashed for the seeded super admin (hello@dowry.africa or ADMIN_EMAIL) |
| `ADMIN_EMAIL` | Email for the seeded super admin (defaults to hello@dowry.africa) |
| `SESSION_SECRET` | Session signing secret |
| `NODE_ENV` | Set to `production` |

### API Server — Stripe (set for real payments; omit for demo mode)
| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_...`) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_CORE_PRICE_ID` | Price ID for the $12.99/mo Core plan |
| `STRIPE_BADGE_PRICE_ID` | Price ID for the $19.99/mo Serious Badge plan |

### API Server — Cloudinary (set for real photo uploads; omit to disable)
| Variable | Description |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

### API Server — CORS (set in production)
| Variable | Description |
|---|---|
| `CORS_ORIGINS` | Comma-separated list of allowed origins, e.g. `https://dowry.africa` |

### Frontend (`artifacts/dowry-africa`) — Build-time
| Variable | Description |
|---|---|
| `VITE_API_URL` | Full URL of the API server, e.g. `https://api.dowry.africa` |

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
