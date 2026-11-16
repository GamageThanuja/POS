import { isUuidV7 } from "@pos/core/id";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runMigrations } from "./migrate";

/**
 * Integration test against a disposable Postgres (CI service container or
 * `docker compose --profile localdb up`). Skipped when TEST_DATABASE_URL is unset;
 * never point it at a database you care about.
 */
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("migrations (integration)", () => {
  let sql: postgres.Sql;

  beforeAll(async () => {
    await runMigrations(url!);
    sql = postgres(url!, { max: 1, onnotice: () => {} });
  });

  afterAll(async () => {
    await sql?.end({ timeout: 5 });
  });

  it("are idempotent", async () => {
    await expect(runMigrations(url!)).resolves.toBeUndefined();
  });

  it("create the reporting schema", async () => {
    const rows =
      await sql`select 1 from information_schema.schemata where schema_name = 'reporting'`;
    expect(rows).toHaveLength(1);
  });

  it("provide a UUIDv7 generator that orders by time", async () => {
    const rows = await sql<
      { id: string }[]
    >`select uuid_generate_v7()::text as id from generate_series(1, 50)`;
    const ids = rows.map((r) => r.id);
    expect(ids.every(isUuidV7)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    const [now] = await sql<{ ms: string }[]>`
      select (extract(epoch from now()) * 1000)::bigint::text as ms`;
    const embedded = Number.parseInt(ids[0]!.replace(/-/g, "").slice(0, 12), 16);
    expect(Math.abs(embedded - Number(now!.ms))).toBeLessThan(60_000);
  });
});
