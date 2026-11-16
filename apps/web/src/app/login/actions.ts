"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-redirect";
import { signInSchema } from "@/lib/validation/auth";

export type SignInState = { error?: string };

export async function signIn(input: unknown, next: unknown): Promise<SignInState> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  // Same message for unknown user and wrong password, to avoid account enumeration.
  if (error) return { error: "Email or password is incorrect." };

  redirect(safeNextPath(next));
}
