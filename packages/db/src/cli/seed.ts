import { dbEnvSchema, parseEnv } from "@pos/config/env";
import { loadRootEnv } from "@pos/config/load-env";
import { createLogger } from "@pos/config/logger";
import { createDb } from "../client";
import { seeds } from "../seeds";

const log = createLogger({ name: "db:seed" });

loadRootEnv();
const env = parseEnv(dbEnvSchema, process.env);
const { db, close } = createDb(env.DIRECT_DATABASE_URL, { max: 1 });
try {
  if (seeds.length === 0) {
    log.info("no seed modules registered yet (demo data arrives with M1+)");
  }
  await db.transaction(async (tx) => {
    for (const seed of seeds) {
      log.info({ seed: seed.name }, "seeding");
      await seed.run(tx);
    }
  });
  log.info({ count: seeds.length }, "seed complete");
} finally {
  await close();
}
