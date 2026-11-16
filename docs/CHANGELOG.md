# Changelog

## M0: Foundation & developer setup (2026-11-16)

### Built

- **Monorepo:** pnpm workspaces + Turborepo with `apps/web`, `apps/worker` and `packages/{core,db,config,ui,notifications}`. Internal packages are consumed as TypeScript source (no per-package build).
- **Tooling:** strict TypeScript 5.9 (`noUncheckedIndexedAccess`), ESLint 9 flat config (shared, 0-warning policy, bans `parseFloat`, blocks importing the admin Supabase client into client code), Prettier, EditorConfig.
- **`@pos/core`** (100% coverage enforced):
  - `money`: `bigint` minor units + ISO currency, exponent table (LKR 2, JPY 0, KWD 3…), exact decimal parse/format, add/subtract/compare, `multiply`/`divide`/`percentage` with an **explicit** rounding mode (7 modes), `allocate` (largest remainder, exact sum, property-tested), `allocateEvenly`, `roundToIncrement` (cash rounding), JSON-safe serialisation. Floats are rejected as factors.
  - `id`: UUIDv7 generate, validate and read the timestamp.
  - `result`: `Result<T,E>`, `AppError` with codes → HTTP status.
- **`@pos/config`:** Zod env schema (client/server split, fails fast and names missing keys without printing values), root `.env.local` loader, pino logger with forced secret redaction.
- **`@pos/db`:** Drizzle + postgres.js client (`prepare: false` for the Supabase pooler), migration `0000_foundation` (`reporting` schema, SQL `uuid_generate_v7()`), `db:migrate`, `db:seed` (transactional runner, no seed modules yet), `db:reset` (`--force`, refuses in production), shared column helpers (UUIDv7 PK, money, quantity numeric(18,3), audit columns).
- **`apps/web`:** Next.js 15 App Router, Tailwind 4, shadcn/ui components in `@pos/ui`, TanStack Query, React Hook Form + Zod. Supabase clients: browser (publishable key), server (cookie session) and admin (secret key, `server-only`). Middleware session refresh + redirect to `/login`. Authenticated layout with sidebar (Dashboard, POS, Inventory, Purchasing, Finance, Reports, Admin), mobile drawer, skip link, light/dark/system theme. Email + password sign-in/sign-out with open-redirect protection. Baseline security headers.
- **`apps/worker`:** pg-boss 12 boot with graceful shutdown. No jobs registered yet.
- **Docker:** `docker-compose.yml` with Gotenberg (port 3001) and an optional `localdb` profile (Postgres 16 on 54329).
- **CI:** GitHub Actions running format check → lint → typecheck → unit + DB integration tests (Postgres service) → migrate → build → Playwright smoke.

### How to test

```bash
pnpm install
pnpm lint && pnpm typecheck && pnpm test           # 128 core + 5 config + 2 web unit tests
docker compose --profile localdb up -d
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:54329/pos_test pnpm --filter @pos/db test
cp .env.example .env.local   # fill in Supabase values
pnpm check:env && pnpm db:migrate && pnpm dev     # sign in at http://localhost:3000/login with a Supabase Auth user
pnpm test:e2e
```

### Verified locally

- lint, typecheck and unit tests all pass, with `@pos/core` at 100% statements/branches/functions/lines.
- Migration integration tests ran against Postgres 16 in Docker: idempotent, `reporting` schema present, valid time-ordered UUIDv7s.
- `db:migrate`, `db:seed` and `db:reset -- --force` ran against the Docker Postgres. Reset refuses without `--force`.
- `next build` succeeds, and the secret key does not appear in `.next/static`.
- All 4 Playwright smoke tests pass (login render, client validation, redirect with `next`, security headers).
- The worker starts against Postgres and shuts down cleanly on SIGTERM.

### Known gaps / not yet verified

- **Not run against the real Supabase project:** `.env.local` was not present, so `db:migrate` against Supabase and a real sign-in are untested. Run the "How to test" steps once `.env.local` is filled in.
- Module pages (Dashboard, POS…) are labelled landing pages that name the milestone that delivers them.
- `@pos/notifications` is an empty package until M2. Seeds are empty until the M1 schema exists.
- Sign-in is basic email + password. MFA, invites, lockout and the 30-minute idle timeout are M1. A full CSP is M10 (baseline headers only for now).
- CI has not run on GitHub yet (see PR).
