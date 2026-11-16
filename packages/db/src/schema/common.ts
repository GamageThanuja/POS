import { sql } from "drizzle-orm";
import { bigint, numeric, timestamp, uuid } from "drizzle-orm/pg-core";

/** UUIDv7 primary key. Clients may supply the id (offline POS); the DB default covers server inserts. */
export const idColumn = () =>
  uuid("id")
    .primaryKey()
    .default(sql`uuid_generate_v7()`);

/** Money in integer minor units (CLAUDE.md rule 1). Pair with a currency column. */
export const moneyColumn = (name: string) => bigint(name, { mode: "bigint" });

/** Quantities are numeric(18,3), read as strings to avoid float conversion (rule 2). */
export const quantityColumn = (name: string) => numeric(name, { precision: 18, scale: 3 });

/** created/updated stamps required on every business table (rule 4). */
export const auditColumns = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid("created_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid("updated_by"),
};
