# POS Platform

A multi-outlet web system for **Point of Sale**, **Inventory & Purchasing** and **Finance & Accounting**, plus Admin, Reporting and SMS/email notifications.

- Specification: `docs/SRS_POS_Platform_v1.1.pdf` (requirement IDs such as `POS-12` and `FIN-03` are the source of truth)
- Project rules: [`CLAUDE.md`](CLAUDE.md) · Work plan: [`TODO.md`](TODO.md) · History: [`docs/CHANGELOG.md`](docs/CHANGELOG.md)

## Stack

pnpm workspaces + Turborepo · Next.js 15 (App Router) · Tailwind 4 + shadcn/ui · TanStack Query · React Hook Form + Zod · Drizzle ORM on Supabase Postgres · Supabase Auth/Storage/Realtime · pg-boss worker · Gotenberg (PDF) · ExcelJS · Vitest · Playwright.

```
apps/web                Next.js back office (+ POS PWA from M5)
apps/worker             pg-boss background worker
packages/core           pure domain logic (money, ids, Result); 100% unit-tested
packages/db             Drizzle schema, SQL migrations, migrate/seed/reset scripts
packages/config         tsconfig bases, ESLint config, Zod env schema, logger
packages/ui             shared shadcn/ui components
packages/notifications  SMS/email adapters (M2)
```

## Prerequisites

- Node.js ≥ 22.12 (`.nvmrc` pins 24)
- pnpm 9: `corepack enable` (the version comes from `packageManager` in `package.json`)
- Docker (for Gotenberg and the test database)
- A Supabase project, or a local stack via the Supabase CLI

## Setup

```bash
git clone https://github.com/GamageThanuja/POS.git && cd POS
pnpm install
cp .env.example .env.local        # fill in the Supabase values; generate APP_ENCRYPTION_KEY with: openssl rand -base64 32
pnpm check:env                    # validates .env.local and prints which keys are missing
docker compose up -d              # Gotenberg on http://localhost:3001
pnpm db:migrate                   # applies migrations via DIRECT_DATABASE_URL
pnpm db:seed                      # demo data (populated from M1 onwards)
pnpm dev                          # web on http://localhost:3000 + worker
```

`.env.local` lives at the **repo root** and is shared by the web app, the worker and the db scripts. Never commit it.

### Supabase connection strings

- `DATABASE_URL`: the **transaction pooler** (port 6543), used by the app at runtime. The client sets `prepare: false` because the pooler requires it.
- `DIRECT_DATABASE_URL`: the **session pooler / direct** connection (port 5432), used for migrations and pg-boss.

### Local Supabase (optional)

```bash
pnpm dlx supabase init && pnpm dlx supabase start   # prints local URL and keys for .env.local
```

## Scripts

| Command                                      | What it does                                            |
| -------------------------------------------- | ------------------------------------------------------- |
| `pnpm dev`                                   | Next.js dev server + worker (watch)                     |
| `pnpm build`                                 | Production build of all apps                            |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | ESLint (0 warnings), `tsc --noEmit`, Vitest             |
| `pnpm test:e2e`                              | Playwright (starts the dev server automatically)        |
| `pnpm format`                                | Prettier                                                |
| `pnpm db:generate`                           | Generate a migration from schema changes (drizzle-kit)  |
| `pnpm db:migrate`                            | Apply migrations                                        |
| `pnpm db:seed`                               | Load demo data in one transaction                       |
| `pnpm db:reset -- --force`                   | Drop app schemas and re-migrate (refuses in production) |
| `pnpm check:env`                             | Validate environment variables                          |

### Integration tests

The database integration tests run only when `TEST_DATABASE_URL` is set. Point it at a **disposable** database:

```bash
docker compose --profile localdb up -d     # Postgres 16 on localhost:54329
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:54329/pos_test pnpm test
```

## Conventions

- Money is `bigint` minor units + currency, and all arithmetic goes through `@pos/core/money`. Rounding modes are always explicit.
- IDs are UUIDv7 (`@pos/core/id` in TypeScript, `uuid_generate_v7()` in SQL).
- Commits follow Conventional Commits and reference requirement IDs, e.g. `feat(pos): split payments [POS-16]`.
- Run `pnpm lint && pnpm typecheck && pnpm test` before every commit.
