import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export interface DbHandle {
  db: Database;
  sql: postgres.Sql;
  close: () => Promise<void>;
}

/**
 * Creates a Drizzle client over postgres.js.
 * `prepare: false` is required behind the Supabase transaction pooler (port 6543).
 */
export function createDb(url: string, options: { max?: number; prepare?: boolean } = {}): DbHandle {
  const sql = postgres(url, {
    max: options.max ?? 10,
    prepare: options.prepare ?? false,
    onnotice: () => {},
  });
  return { db: drizzle(sql, { schema }), sql, close: () => sql.end({ timeout: 5 }) };
}
