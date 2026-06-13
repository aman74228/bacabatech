"use server";

import { revalidatePath } from "next/cache";

import { getOrCreateUser } from "@/lib/users";
import { createTranscript } from "@/lib/transcripts";
import { createAdminClient } from "@/lib/supabase";
import { detectPlatform } from "@/lib/platform";
import { inngest } from "@/lib/inngest/client";

const FREE_TRANSCRIPT_LIMIT = 5;

export type CreateTranscriptResult =
  | { ok: true; transcriptId: string }
  | { ok: false; error: string };

export async function createTranscriptAction(
  _prev: CreateTranscriptResult | null,
  formData: FormData
): Promise<CreateTranscriptResult> {
  const url = String(formData.get("url") ?? "").trim();

  const platform = detectPlatform(url);
  if (!platform) {
    return { ok: false, error: "Please enter a valid http(s) video URL." };
  }

  const user = await getOrCreateUser();
  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  // Enforce the free-tier limit unless the user is subscribed.
  const supabase = createAdminClient();
  const { data: usage } = await supabase
    .from("usage")
    .select("transcript_count, is_subscribed")
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    usage &&
    !usage.is_subscribed &&
    usage.transcript_count >= FREE_TRANSCRIPT_LIMIT
  ) {
    return {
      ok: false,
      error: `Free plan limit reached (${FREE_TRANSCRIPT_LIMIT} transcripts). Upgrade to continue.`,
    };
  }

  const transcript = await createTranscript({
    userId: user.id,
    videoUrl: url,
    platform,
  });

  await inngest.send({
    name: "transcript/requested",
    data: {
      transcriptId: transcript.id,
      userId: user.id,
      videoUrl: url,
      platform,
    },
  });

  revalidatePath("/dashboard");
  return { ok: true, transcriptId: transcript.id };
}
