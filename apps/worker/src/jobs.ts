import type { Logger } from "@pos/config/logger";
import type { PgBoss } from "pg-boss";

/**
 * Registers queues and handlers. Jobs arrive with their milestones:
 * notification outbox (M2), low-stock/expiry scans (M4), recurring journals (M8),
 * scheduled reports and PDF rendering (M9).
 */
export async function registerJobs(_boss: PgBoss, _log: Logger): Promise<string[]> {
  return [];
}
