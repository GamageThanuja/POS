import { loadRootEnv } from "@pos/config/load-env";
import { defineConfig } from "drizzle-kit";

loadRootEnv();

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./migrations",
  // Migrations run over the direct/session connection, never the transaction pooler.
  dbCredentials: { url: process.env.DIRECT_DATABASE_URL ?? "" },
  schemaFilter: ["public", "reporting"],
  strict: true,
  verbose: true,
});
