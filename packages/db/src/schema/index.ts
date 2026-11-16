/**
 * Drizzle schema root. Business tables arrive milestone by milestone
 * (M1: tenancy & identity). Every business table must include `auditColumns`
 * and a `tenant_id` (CLAUDE.md rule 4).
 */
export * from "./common";
