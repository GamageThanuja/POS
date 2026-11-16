import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/env.server";

/**
 * Service client using the SECRET key: bypasses RLS. Server-only (guarded by
 * `server-only` and an ESLint import rule). Use for admin Auth operations such
 * as inviting users, never for tenant data reads.
 */
export function createAdminClient() {
  const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY } = env();
  return createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
