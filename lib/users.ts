import "server-only";
import { currentUser } from "@clerk/nextjs/server";

import { createAdminClient } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

/**
 * Look up the Supabase `users` row for the currently signed-in Clerk user,
 * creating it (and an accompanying `usage` row) on first sign-in. Returns
 * `null` if there is no signed-in user.
 */
export async function getOrCreateUser(): Promise<UserRow | null> {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    "";

  const supabase = createAdminClient();

  // Upsert keeps email in sync and is idempotent on the clerk_id unique key.
  const { data: user, error } = await supabase
    .from("users")
    .upsert(
      { clerk_id: clerkUser.id, email },
      { onConflict: "clerk_id" }
    )
    .select()
    .single();

  if (error || !user) {
    throw new Error(`Failed to upsert user: ${error?.message}`);
  }

  // Ensure a usage row exists for this user.
  await supabase
    .from("usage")
    .upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true });

  return user;
}
