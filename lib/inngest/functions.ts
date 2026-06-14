import { createAdminClient } from "@/lib/supabase";
import { inngest } from "@/lib/inngest/client";

/**
 * Orchestrates a transcription:
 *  1. mark the row as processing
 *  2. dispatch the job to the yt-dlp + Groq worker (which replies via callback)
 *  3. wait for the worker's completion event (with a timeout)
 *  4. finalize — record a timeout failure or bump usage on success
 *
 * The worker writes the actual transcript text/segments to the DB through the
 * callback route, so the completion event payload stays small.
 */
export const transcribeVideo = inngest.createFunction(
  { id: "transcribe-video", retries: 2 },
  { event: "transcript/requested" },
  async ({ event, step }) => {
    const { transcriptId, videoUrl } = event.data;

    await step.run("mark-processing", async () => {
      const supabase = createAdminClient();
      await supabase
        .from("transcripts")
        .update({ status: "processing" })
        .eq("id", transcriptId);
    });

    await step.run("dispatch-to-worker", async () => {
      // Read env at call time (not module load) so values set in the host are
      // always picked up at runtime.
      const workerUrl = process.env.WORKER_URL;
      const workerSecret = process.env.WORKER_SECRET;
      // Prefer an explicit app URL; fall back to the Vercel-provided deployment
      // URL so the worker callback never silently points at localhost.
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
        "http://localhost:3000";

      const missing = [
        !workerUrl && "WORKER_URL",
        !workerSecret && "WORKER_SECRET",
      ].filter(Boolean);
      if (missing.length > 0) {
        throw new Error(
          `Missing env var(s): ${missing.join(", ")}. Set them in your host ` +
            `(e.g. Vercel → Settings → Environment Variables) and redeploy.`
        );
      }

      const res = await fetch(`${workerUrl!.replace(/\/$/, "")}/transcribe`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${workerSecret}`,
        },
        body: JSON.stringify({
          transcriptId,
          videoUrl,
          callbackUrl: `${appUrl.replace(/\/$/, "")}/api/transcription/callback`,
        }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`Worker rejected job (${res.status}): ${detail}`);
      }
    });

    // The worker calls our callback route, which emits this event.
    const completion = await step.waitForEvent("await-worker", {
      event: "transcript/worker.completed",
      timeout: "1h",
      match: "data.transcriptId",
    });

    await step.run("finalize", async () => {
      const supabase = createAdminClient();

      if (!completion) {
        // Timed out — only override rows still stuck in processing.
        await supabase
          .from("transcripts")
          .update({ status: "failed", error: "Transcription timed out" })
          .eq("id", transcriptId)
          .eq("status", "processing");
        return;
      }

      if (completion.data.ok) {
        // Bump the user's transcript count.
        const { data: row } = await supabase
          .from("transcripts")
          .select("user_id")
          .eq("id", transcriptId)
          .single();
        if (row) {
          await supabase.rpc("increment_transcript_count", {
            p_user_id: row.user_id,
          });
        }
      }
    });

    return { transcriptId, ok: completion?.data.ok ?? false };
  }
);
