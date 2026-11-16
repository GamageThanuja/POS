import { dbEnvSchema, parseEnv } from "@pos/config/env";
import { loadRootEnv } from "@pos/config/load-env";
import { createLogger } from "@pos/config/logger";
import postgres from "postgres";
import { runMigrations } from "../migrate";

const log = createLogger({ name: "db:reset" });

loadRootEnv();
const env = parseEnv(dbEnvSchema, process.env);

if (env.NODE_ENV === "production") {
  log.error("refusing to reset a database when NODE_ENV=production");
  process.exit(1);
}
if (!process.argv.includes("--force")) {
  log.error("db:reset drops ALL app data. Re-run with: pnpm db:reset -- --force");
  process.exit(1);
}

const sql = postgres(env.DIRECT_DATABASE_URL, { max: 1, onnotice: () => {} });
try {
  // Drop only app-owned objects. Supabase-managed schemas (auth, storage, realtime…) are untouched.
  await sql.unsafe(`
    drop schema if exists drizzle cascade;
    drop schema if exists reporting cascade;
    do $$
    declare r record;
    begin
      for r in select tablename from pg_tables where schemaname = 'public' loop
        execute format('drop table if exists public.%I cascade', r.tablename);
      end loop;
      for r in select t.typname from pg_type t join pg_namespace n on n.oid = t.typnamespace
               where n.nspname = 'public' and t.typtype = 'e' loop
        execute format('drop type if exists public.%I cascade', r.typname);
      end loop;
    end $$;
    drop function if exists public.uuid_generate_v7() cascade;
  `);
  log.info("app schemas dropped");
} finally {
  await sql.end({ timeout: 5 });
}
await runMigrations(env.DIRECT_DATABASE_URL);
log.info("database reset and migrated");
