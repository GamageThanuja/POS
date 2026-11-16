# CLAUDE.md — Project rules for the POS / Inventory / Finance web app

Claude CLI reads this file at the start of every session. These rules apply to all work in this repo.

## What this project is

A multi-outlet **web** business system with three core modules: **POS**, **Inventory and Purchasing**, and **Finance and Accounting**, plus Admin, Reporting and Notifications (SMS and email).
The full specification is in `docs/SRS_POS_Platform_v1.1.pdf`. Requirement IDs in that document (e.g. `POS-12`, `FIN-03`) are the source of truth. Reference them in code comments, tests and commit messages.

**Version 1 scope:** web app only. These are NOT in v1: the customer QR portal (`CP-*`), the native mobile app, the kitchen display screen (`KDS-*`, kitchen _printer tickets_ are still in), loyalty points, gift cards, vouchers, delivery dispatch, payment gateways and integrated card terminals.

## Tech stack (do not change without asking)

- **Monorepo:** pnpm workspaces + Turborepo
  - `apps/web` – Next.js 15 (App Router, TypeScript strict), Tailwind CSS, shadcn/ui, TanStack Query, React Hook Form + Zod
  - `apps/worker` – Node.js background worker (pg-boss) for notifications, scheduled reports and PDF jobs
  - `packages/db` – Drizzle ORM schema, SQL migrations, seed scripts
  - `packages/core` – pure domain logic (pricing engine, tax, stock valuation, posting rules, money). No I/O. 100% unit-tested.
  - `packages/notifications` – SMS and email provider adapters + template rendering
  - `packages/ui` – shared UI components
- **Supabase:** Postgres database, Auth (for back-office users), Storage (logos, attachments, slips), Realtime (live POS and dashboard updates).
- **Database access:** server-side only, through Drizzle over `DATABASE_URL`, using **transactions** for every business operation. Use the Supabase JS client only for Auth, Storage and Realtime.
- **Row Level Security** is enabled on every table as defence in depth (tenant isolation). The service-role/secret key is never used in browser code.
- **POS offline:** a PWA with a service worker, an IndexedDB (Dexie) local store, and an outbox that syncs to `/api/sync` with idempotency keys.
- **PDF:** HTML templates rendered to PDF by Gotenberg (Docker). **XLSX:** ExcelJS.
- **Tests:** Vitest (unit/integration) and Playwright (end-to-end).
- **Deployment target:** Docker (web + worker + gotenberg) against Supabase cloud.

## Non-negotiable domain rules

1. **Money** is stored as integer minor units (`bigint` cents) plus a currency code. Never use floating point for money. All maths goes through `packages/core/money`.
2. **Quantities** are `numeric(18,3)`.
3. **IDs** are UUIDv7, so records can be created offline on the POS.
4. Every business table has `tenant_id`, `created_at`, `created_by`, `updated_at`, `updated_by`. Master data is archived, never hard-deleted.
5. **Double-entry accounting:** every journal must balance (debits = credits) or the transaction fails. Posted journals and stock movements are **immutable**. Corrections are made only by reversing entries.
6. **Payments are recorded, not processed.** There is no gateway and no card capture. Card tenders store only the card type, the last 4 digits and the approval code. Never add fields for a full card number, expiry date or CVV.
7. A sale, its stock movements and its journal entries are written in **one database transaction**. If any part fails, all of it rolls back.
8. Every write endpoint that a POS can call must be **idempotent**, using an `Idempotency-Key` header or a client UUID.
9. **Receipt numbers** are sequential per register (`<OUTLET>-<REG>-000123`) and are never reused, including numbers issued offline.
10. **Tax rates** are data, not code. They are effective-dated, can be inclusive or exclusive, and are configured per tenant.
11. **Audit log:** every create, update or delete, every approval, login, drawer opening and settings change is written to `audit_log` with before/after JSON.
12. **Permissions** are checked on the server for every request (RBAC + outlet scope). Never trust the client.
13. SMS and email are sent **only through the notification outbox** (`notification_outbox` table → worker). Never call a provider directly from a request handler.

## Working rules for Claude

- Work milestone by milestone from `TODO.md`. Tick `[x]` items as they are completed. Do not start the next milestone until the current milestone's **Definition of Done** passes.
- Before each milestone, write a short plan in `docs/plans/M<n>.md` (schema changes, endpoints, screens, tests). Then implement it.
- Run `pnpm lint && pnpm typecheck && pnpm test` before every commit. Never commit failing code.
- Commit small, logical units using Conventional Commits, referencing requirement IDs, e.g. `feat(pos): split payments [POS-16]`.
- Write tests first for anything in `packages/core` and for posting rules.
- Don't leave stubs or TODO comments that hide missing behaviour. If something is out of scope, say so in the milestone summary.
- **Secrets:** never print, log, commit or hard-code them. Read secrets only from `.env.local`. Keep `.env.example` up to date with placeholder values.
- If the SRS is ambiguous or conflicts with these rules, stop and ask. Don't guess on accounting or tax behaviour.
- At the end of each milestone, write a summary to `docs/CHANGELOG.md` covering what was built, how to test it, and any known gaps.
