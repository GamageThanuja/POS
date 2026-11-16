import type { Transaction } from "../client";

export interface SeedModule {
  name: string;
  run: (tx: Transaction) => Promise<void>;
}

/**
 * Ordered seed modules, all run in one transaction by `pnpm db:seed`.
 * Empty in M0: the demo tenant ("Demo Café & Store") needs the M1 tenancy
 * schema, items come with M3 and the chart of accounts with M4.
 */
export const seeds: SeedModule[] = [];
