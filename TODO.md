# TODO — Version 1: POS + Inventory + Finance (web)

Source of truth: `docs/SRS_POS_Platform_v1.1.pdf`. Rules: `CLAUDE.md`.
Tick `[x]` when an item is done and tested. Each milestone ends with its **Definition of Done (DoD)**. The next milestone starts only after the DoD passes and the owner approves.

**Out of v1:** customer QR portal (CP-*), native mobile app, KDS screen, loyalty, gift cards, vouchers, delivery dispatch, payment gateways and terminal integration.

---

## M0 — Foundation & developer setup

- [x] Inspect the existing repo (`GamageThanuja/POS`); record findings in `docs/plans/M0.md`
- [x] pnpm + Turborepo monorepo: `apps/web`, `apps/worker`, `packages/{db,core,notifications,ui,config}`
- [x] TypeScript strict, ESLint, Prettier, shared tsconfig and lint config
- [x] Next.js 15 App Router + Tailwind + shadcn/ui + TanStack Query + React Hook Form/Zod in `apps/web`
- [x] Drizzle ORM setup, migration scripts, `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:reset`
- [x] Supabase clients: browser (publishable key), server (secret key, server-only module with an `import "server-only"` guard)
- [x] Env validation with Zod (`packages/config/env.ts`); fail fast on missing variables; `.env.example` complete
- [x] `docker-compose.yml` with Gotenberg (and optional local Supabase via the Supabase CLI)
- [x] Vitest + Playwright configured; example tests passing
- [x] GitHub Actions CI: install → lint → typecheck → unit tests → build
- [x] `packages/core/money`: integer minor units, currency, add/subtract/multiply/allocate, rounding modes (with tests)
- [x] UUIDv7 helper, `Result` and error types, structured logger (pino) with secret redaction
- [x] App shell: authenticated layout, sidebar nav (POS, Inventory, Purchasing, Finance, Reports, Admin), light/dark theme
- [x] `README.md` with setup steps
- **DoD:** fresh clone → `pnpm i && pnpm db:migrate && pnpm dev` works; CI green; money tests pass.

## M1 — Tenancy, identity, access control & audit (ADM-01..05, NFR-S)

- [ ] Schema: `tenant`, `outlet`, `location` (outlet/warehouse/central kitchen), `register`, `device`, `floor`, `dining_table`
- [ ] Schema: `app_user` (linked to Supabase Auth user), `role`, `permission`, `role_permission`, `user_role`, `user_outlet_scope`
- [ ] Seed default roles: Owner/Admin, Outlet Manager/Supervisor, Cashier, Waiter, Storekeeper, Purchasing Officer, Accountant
- [ ] Permission catalogue (e.g. `pos.sale.create`, `pos.refund`, `pos.discount.above_limit`, `inv.adjust.approve`, `fin.period.lock`…)
- [ ] Server-side `requirePermission(perm, outletId?)` guard used by every route/action
- [ ] RLS policies on all tables (tenant isolation) + automated test proving cross-tenant access fails
- [ ] Supabase Auth: sign-in, sign-out, invite user, reset password, MFA (TOTP) enforced for Owner/Admin/Accountant
- [ ] Session timeout 30 min idle (back office); login lockout after repeated failures
- [ ] `audit_log` (actor, device, IP, entity, action, before/after JSON, timestamp) with a generic write helper; tamper-evident hash chain
- [ ] Approval framework: `approval_rule`, `approval_request`; inline supervisor-PIN approval + remote approval inbox
- [ ] Admin UI: business profile (logo, tax reg. no., currency, time zone, fiscal year, receipt header/footer), outlets, locations, registers, floors/tables editor, users, roles & permissions matrix, approval rules
- [ ] Audit log viewer with filters
- **DoD:** an Owner can create outlets/users/roles; a Cashier is blocked from admin pages and APIs (tested); audit entries are written for every mutation.

## M2 — Notification service: SMS & Email

- [ ] `packages/notifications`: `SmsProvider`, `EmailProvider` interfaces
- [ ] Email adapters: SMTP (Nodemailer), Resend; SMS adapters: Generic HTTP (configurable URL/auth/body template), Twilio, Console (dev/test)
- [ ] Schema: `notification_provider_config` (encrypted credentials per tenant), `notification_template` (event × channel × language), `notification_outbox`, `notification_log`, `alert_rule` (event → recipients/roles/outlets)
- [ ] Credential encryption at rest (AES-256-GCM using a server key from env)
- [ ] Template engine (Handlebars) with variables, preview, Unicode support (Sinhala/Tamil), SMS segment counter (GSM-7 160 / UCS-2 70)
- [ ] `apps/worker` with pg-boss: outbox processor, retry with exponential backoff (5 attempts), dead-letter, per-tenant rate limit
- [ ] Provider delivery-status webhook endpoint (where supported) updating `notification_log`
- [ ] `notify(event, payload, recipients)` API used by all modules (never call providers directly)
- [ ] Admin UI: provider setup + "send test", template editor with preview, alert rules, delivery log (masked recipients, status, retries)
- [ ] Seed default templates (EN) for every v1 event:
  - [ ] Sale e-receipt (SMS link / email with PDF)
  - [ ] Refund receipt
  - [ ] Customer account statement (monthly)
  - [ ] Purchase order to supplier (email + PDF)
  - [ ] New device paired (security alert)
  - [ ] Low stock / reorder alert
  - [ ] Cash variance above threshold at shift close
  - [ ] Large refund / void / discount alert
  - [ ] Approval request pending
  - [ ] Stock count variance
  - [ ] Sync exceptions detected
  - [ ] Scheduled report delivery (daily sales, weekly stock valuation)
- [ ] Customize Supabase Auth email templates (invite, reset) with tenant branding
- **DoD:** test-send works through the Console driver and one real provider; failed sends retry and then dead-letter; delivery log shows every attempt.

## M3 — Catalogue & pricing engine (INV-01..08, BR-01, BR-02)

- [ ] Schema: `category`, `item` (type: stock/non-stock/composite/raw material/combo), `item_variant` (SKU, barcode), `uom`, `uom_conversion`, `modifier_group`, `modifier` (with optional stock link), `recipe_line` (BOM)
- [ ] Schema: `tax`, `tax_rate` (effective-dated, inclusive/exclusive, compound), `tax_category`, `price_list`, `price_list_item` (per outlet/channel/time window), price history
- [ ] Schema: `service_charge_rule`, `discount_reason`, `rounding_rule`
- [ ] `packages/core/pricing`: line price → modifiers → line discounts → bill discounts → service charge → taxes → rounding (BR-01/BR-02), exhaustive unit tests incl. tax-inclusive back-calculation
- [ ] Item master UI: list with search/filter/bulk edit, item form (variants, modifiers, recipe, UoM, tax category, images to Supabase Storage)
- [ ] Price lists UI; tax setup UI
- [ ] Barcode generation & label printing (A4 sheet + single label)
- [ ] CSV/XLSX import/export for items, prices with validation report
- **DoD:** pricing engine passes all tests; 30 seeded items render correctly; import of a 500-row file succeeds with a row-level error report.

## M4 — Ledger core & inventory core (FIN-01..08, INV-09..19)

**Ledger core**

- [ ] Schema: `account` (CoA tree, type, normal balance), `fiscal_year`, `period` (open/locked), `journal`, `journal_line` (debit, credit, outlet/department dimensions), `posting_rule` (event → account mapping)
- [ ] Default chart of accounts template seeded (assets, liabilities, equity, income, COGS, expenses, clearing accounts per payment method, rounding, cash over/short, inventory, GRNI, tax payable)
- [ ] `packages/core/posting`: build balanced journals from domain events; reject unbalanced; reversal helper
- [ ] Period lock enforcement (BR-09: late items post to next open period with exception flag)
- [ ] CoA UI, posting-rule mapping UI, manual journal UI (with attachments, approval), journal viewer
      **Inventory core**
- [ ] Schema: `stock_level` (item × location), `stock_movement` (immutable ledger), `cost_layer`, `stock_batch` (lot, expiry), `adjustment`, `transfer`, `transfer_line`, `stock_count`, `count_line`, `reorder_setting`
- [ ] `packages/core/valuation`: Weighted Average Cost (FIFO interface stub behind feature flag), recipe deduction incl. modifier ingredients, UoM conversion
- [ ] Opening stock import
- [ ] Adjustments with reason codes + approval over threshold → posts to GL
- [ ] Transfers: request → dispatch (in transit) → receive with discrepancy capture → GL
- [ ] Stock counts: full & cycle, blind option, mobile-friendly count screen, variance review, approve → post
- [ ] Reorder levels per item/location; low-stock scan job → notification
- [ ] Batch/expiry capture and FEFO pick suggestion; expiry alert job
- [ ] Negative stock policy setting (allow with alert / block)
- [ ] Stock on hand / movement ledger screens
- **DoD:** every stock movement creates a balanced journal; stock valuation = GL inventory account (automated test).

## M5 — POS web (online mode) (POS-01..30, BR-03..08, UC-02..04)

- [ ] Device pairing flow (admin generates code → POS binds to outlet/register); new-device notification
- [ ] PIN login screen, user switching, auto-lock on inactivity
- [ ] Shift: open with float; cash in/out with reason; X-report; close with blind denomination count, variance, Z-report; over/short posting; variance alert
- [ ] Sale screen: category grid, search, barcode scanner (keyboard wedge), PLU entry, weighed items (manual weight)
- [ ] Modifiers dialog enforcing min/max; line notes; qty edit; price override (permission)
- [ ] Order types: takeaway, dine-in (table), pickup; customer attach (search/create by phone)
- [ ] Floor plan with live table status (Realtime); open, move, merge, split tables; hold/park & recall from any register
- [ ] Discounts (line/bill, % / fixed) with role limits → supervisor approval; automatic promotions hook (simple rules only)
- [ ] Service charge & tax via pricing engine
- [ ] Send to kitchen: kitchen-ticket print routing by category/station printer; added items print as new tickets
- [ ] Payment recording: cash (change calc), card (type, last 4, approval code), wallet/QR (reference), bank transfer (reference + optional slip upload), customer credit account (limit check), store credit; split by tender, by item, equal split (BR-13..15)
- [ ] Receipt numbering per register (BR rules); receipt print templates 58/80 mm + A4 invoice/tax invoice; reprint marked COPY (audited)
- [ ] E-receipt via SMS/email (M2) with public signed receipt link
- [ ] Voids (reason, approval when sent/paid) and refunds against original receipt (partial/full, refund tender, restock vs wastage) → refund notification
- [ ] Cash drawer "No Sale" (permission, audited)
- [ ] Atomic sale transaction: order + payments + stock movements + journals in one DB transaction
- [ ] POS UX: ≤3 taps to complete after items added, 44 px targets, landscape/portrait, dark mode
- **DoD:** Playwright flow open shift → sell (split tender) → refund → close shift passes; Z-report figures match GL cash/clearing postings.

## M6 — POS offline mode & sync (POS-25..30, NFR-R)

- [ ] PWA manifest + service worker (app shell & assets cached)
- [ ] Dexie schema: catalogue, prices, taxes, modifiers, tables, staff PIN hashes, customers (limited), open orders, outbox, settings
- [ ] Data bootstrap & incremental delta sync (`updated_since`) for reference data
- [ ] Offline sale/payment/receipt/drawer; offline receipt numbering continues sequence
- [ ] Outbox with ordered replay, idempotency keys, exponential retry; `POST /api/sync` batch endpoint with per-item results
- [ ] Conflict policy: server accepts sale as transacted; mismatches → `sync_exception` + notification + review screen
- [ ] Offline restrictions: credit sales & store credit blocked by default (BR-10), configurable cap
- [ ] Online/offline banner with unsynced count; "last synced" indicator
- [ ] Test: 72 h simulated offline, 1,000 sales, zero lost/duplicated after sync (automated)
- **DoD:** offline test passes; killing the browser mid-sync and reopening causes no duplicates.

## M7 — Suppliers, purchasing & payables (PUR-01..06, FIN AP)

- [ ] Schema: `supplier`, `supplier_contact`, `supplier_item` (price list, lead time), `purchase_order`, `po_line`, `goods_receipt`, `grn_line`, `supplier_invoice`, `supplier_invoice_line`, `supplier_return`, `supplier_payment`
- [ ] PO creation (manual / from reorder suggestions), approval by value, PDF + email to supplier (M2)
- [ ] GRN: full/partial receipt, over-receipt tolerance approval, batch/expiry, delivery note photo → stock + cost + GRNI posting
- [ ] Supplier invoice entry with 3-way match (PO/GRN/invoice) and variance flags → AP posting
- [ ] Supplier returns → debit note → stock & GL
- [ ] Supplier payments (full/partial, method, reference) → GL; AP ageing
- **DoD:** PO → GRN → invoice → payment cycle posts correct, balanced journals; AP ageing matches supplier balances.

## M8 — Finance completion (FIN-09..22, BR-13)

- [ ] Payment clearing accounts per method; daily sales reconciliation screen (sales vs tenders vs deposits)
- [ ] Cash deposits to bank; bank accounts; bank statement import (CSV/OFX) with auto-match suggestions; reconciliation UI; unreconciled card/transfer list
- [ ] Accounts receivable: customer credit accounts, limits, invoices, receipts, statements (PDF + monthly email), ageing, write-offs
- [ ] Expenses: category, outlet, tax, receipt photo, payment method, approval threshold
- [ ] Recurring journals (worker job)
- [ ] Tax: output/input/net tax report by period; tax invoice format
- [ ] Financial statements: Trial Balance, P&L, Balance Sheet, Cash Flow, GL detail — by outlet & consolidated, period comparison
- [ ] Period close workflow: checklist (unsynced devices, open shifts, unreconciled items) → lock; authorised re-open (audited)
- [ ] Journal export CSV for external accounting
- **DoD:** seeded month closes; Trial Balance balances; financial integrity acceptance test (SRS §15.1) passes.

## M9 — Reporting & dashboard (RPT-01..15)

- [ ] `reporting` schema with SQL views; read-replica-ready connection setting
- [ ] Report framework: parameter panel (date range, outlet, register, cashier), paging, drill-down, saved views
- [ ] Export: PDF (Gotenberg HTML templates), XLSX (ExcelJS), CSV
- [ ] Dashboard: today vs same day last week, orders, AOV, top items, payment mix, low stock, cash position (Realtime)
- [ ] Sales reports: by period/outlet/register/cashier/order type/category/item/modifier/hour/payment method; discounts, voids, refunds
- [ ] Inventory reports: stock on hand & value, movement ledger, theoretical vs actual usage variance, slow/dead stock, expiry, reorder
- [ ] Purchasing reports: PO status, supplier performance, price variance
- [ ] Staff reports: sales, voids/discounts per staff, shift summaries
- [ ] Payment reconciliation report (RPT-09)
- [ ] Scheduled reports (worker): daily sales summary, weekly stock valuation → email PDF/XLSX via M2
- **DoD:** reports reconcile with transaction data and GL (automated cross-check tests); month report for one outlet renders < 5 s.

## M10 — Hardening, docs & release

- [ ] Security: OWASP ASVS L2 checklist, CSP/secure headers, rate limiting, dependency audit, secrets scan in CI
- [ ] Performance: k6 load test (200 POS devices, 20k orders/day profile); POS item add < 200 ms; API p95 < 500 ms
- [ ] Backups/PITR verified on Supabase; restore runbook
- [ ] Error monitoring (Sentry or equivalent) and uptime checks
- [ ] Accessibility pass (WCAG 2.1 AA on back office)
- [ ] Full Playwright regression suite
- [ ] Docker images (web, worker) + `docker-compose.prod.yml`; deployment guide
- [ ] Docs: admin guide, cashier quick guide, accountant guide, API (OpenAPI), runbooks
- [ ] Data migration tools tested with sample customer data (items, customers, suppliers, opening stock, opening balances)
- [ ] UAT script per role; traceability matrix (requirement ID → code → test) generated into `docs/traceability.md`
- **DoD:** all v1 **Must** requirements traced to passing tests; release tagged `v1.0.0`.

---

## Decisions needed from the owner (keep updated)

- [ ] Business type at launch: restaurant/café, retail, or both
- [ ] Single business or multi-tenant SaaS
- [ ] Stock valuation: WAC (default) or FIFO
- [ ] Current tax rates, inclusive vs exclusive pricing, and tax-invoice format
- [ ] SMS provider and sender ID; email provider and sending domain (SPF/DKIM)
- [ ] Payment methods to enable per outlet
- [ ] Hosting target for Docker services (web, worker, gotenberg)
- [ ] Printer models to certify
