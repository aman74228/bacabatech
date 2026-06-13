import express from "express";

import { transcribeUrl } from "./transcribe.js";

const PORT = Number(process.env.PORT ?? 8080);
const WORKER_SECRET = process.env.WORKER_SECRET;

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

interface JobBody {
  transcriptId?: string;
  videoUrl?: string;
  callbackUrl?: string;
}

app.post("/transcribe", (req, res) => {
  const auth = req.headers.authorization;
  if (!WORKER_SECRET || auth !== `Bearer ${WORKER_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { transcriptId, videoUrl, callbackUrl } = req.body as JobBody;
  if (!transcriptId || !videoUrl || !callbackUrl) {
    return res
      .status(400)
      .json({ error: "transcriptId, videoUrl and callbackUrl are required" });
  }

  // Acknowledge immediately; process in the background and report via callback.
  res.status(202).json({ accepted: true });
  void processJob(transcriptId, videoUrl, callbackUrl);
});

async function processJob(
  transcriptId: string,
  videoUrl: string,
  callbackUrl: string
) {
  try {
    const result = await transcribeUrl(videoUrl);
    await postCallback(callbackUrl, {
      transcriptId,
      status: "completed",
      text: result.text,
      segments: result.segments,
      language: result.language,
      durationSeconds: result.durationSeconds,
    });
    console.log(`[${transcriptId}] completed (${result.segments.length} segments)`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[${transcriptId}] failed: ${message}`);
    await postCallback(callbackUrl, {
      transcriptId,
      status: "failed",
      error: message,
    });
  }
}

async function postCallback(url: string, payload: unknown) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${WORKER_SECRET}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`Callback to ${url} returned ${res.status}`);
    }
  } catch (err) {
    console.error(`Callback to ${url} failed:`, err);
  }
}

app.listen(PORT, () => {
  console.log(`Bacaba worker listening on :${PORT}`);
});
