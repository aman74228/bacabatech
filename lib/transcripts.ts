import "server-only";

import { createAdminClient } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

export type TranscriptRow = Database["public"]["Tables"]["transcripts"]["Row"];

/** Create a new transcript row in the `pending` state. */
export async function createTranscript(input: {
  userId: string;
  videoUrl: string;
  platform: string | null;
}): Promise<TranscriptRow> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("transcripts")
    .insert({
      user_id: input.userId,
      video_url: input.videoUrl,
      platform: input.platform,
      status: "pending",
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create transcript: ${error?.message}`);
  }
  return data;
}

/** List a user's transcripts, newest first. */
export async function listTranscripts(userId: string): Promise<TranscriptRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("transcripts")
    .select()
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list transcripts: ${error.message}`);
  }
  return data ?? [];
}

/** Fetch a single transcript scoped to its owner. */
export async function getTranscript(
  userId: string,
  transcriptId: string
): Promise<TranscriptRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("transcripts")
    .select()
    .eq("user_id", userId)
    .eq("id", transcriptId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch transcript: ${error.message}`);
  }
  return data;
}
