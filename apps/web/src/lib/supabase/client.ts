"use client";

import { createBrowserClient } from "@supabase/ssr";
import { clientEnv } from "@/env.client";

/** Browser Supabase client (publishable key). Auth, Storage and Realtime only, never data access. */
export function createClient() {
  return createBrowserClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
