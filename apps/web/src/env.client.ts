import { clientEnvSchema, parseEnv } from "@pos/config/env";

/**
 * Public env, safe for the browser. Each key is referenced literally so Next
 * can inline it at build time.
 */
export const clientEnv = parseEnv(clientEnvSchema, {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});
