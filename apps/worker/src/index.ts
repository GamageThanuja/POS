import { dbEnvSchema, parseEnv } from "@pos/config/env";
import { loadRootEnv } from "@pos/config/load-env";
import { createLogger } from "@pos/config/logger";
import { PgBoss } from "pg-boss";
import { registerJobs } from "./jobs";

/**
 * Background worker (pg-boss on the app's Postgres, `pgboss` schema).
 * Uses DIRECT_DATABASE_URL: pg-boss needs session-level features the
 * transaction pooler does not provide.
 */
const log = createLogger({ name: "worker" });

loadRootEnv();
const env = parseEnv(dbEnvSchema, process.env);

const boss = new PgBoss({
  connectionString: env.DIRECT_DATABASE_URL,
  application_name: "pos-worker",
});
boss.on("error", (error) => log.error({ err: error }, "pg-boss error"));

await boss.start();
const registered = await registerJobs(boss, log);
log.info({ jobs: registered }, "worker started");

let stopping = false;
async function shutdown(signal: string) {
  if (stopping) return;
  stopping = true;
  log.info({ signal }, "worker stopping");
  await boss.stop({ graceful: true, timeout: 30_000 });
  log.info("worker stopped");
  process.exit(0);
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
