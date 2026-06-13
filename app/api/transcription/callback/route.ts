import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase";
import { inngest } from "@/lib/inngest/client";
import type { Segment } from "@/lib/subtitles";

export const dynamic = "force-dynamic";

interface CallbackBody {
  transcriptId: string;
  status: "completed" | "failed";
  text?: string;
  segments?: Segment[];
  language?: string | null;
  durationSeconds?: number | null;
  error?: string;
}

/**
 * The worker POSTs transcription results here. We persist them and emit an
 * Inngest event so the waiting `transcribeVideo` function can finalize.
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.WORKER_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CallbackBody;
  try {
    body = (await req.json()) as CallbackBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.transcriptId || !body.status) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const ok = body.status === "completed";

  if (ok) {
    await supabase
      .from("transcripts")
      .update({
        status: "completed",
        transcript_text: body.text ?? "",
        segments: body.segments ?? null,
        language: body.language ?? null,
        duration_seconds: body.durationSeconds ?? null,
        error: null,
      })
      .eq("id", body.transcriptId);
  } else {
    await supabase
      .from("transcripts")
      .update({
        status: "failed",
        error: body.error ?? "Transcription failed",
      })
      .eq("id", body.transcriptId);
  }

  await inngest.send({
    name: "transcript/worker.completed",
    data: { transcriptId: body.transcriptId, ok },
  });

  return NextResponse.json({ received: true });
}
