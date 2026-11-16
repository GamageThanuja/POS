import { dbEnvSchema, parseEnv } from "@pos/config/env";
import { loadRootEnv } from "@pos/config/load-env";
import { createLogger } from "@pos/config/logger";
import { runMigrations } from "../migrate";

const log = createLogger({ name: "db:migrate" });

loadRootEnv();
const env = parseEnv(dbEnvSchema, process.env);
const started = Date.now();
await runMigrations(env.DIRECT_DATABASE_URL);
log.info({ ms: Date.now() - started }, "migrations applied");
