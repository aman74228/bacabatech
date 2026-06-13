# Bacaba transcription worker

A small HTTP service that extracts audio from a video URL with **yt-dlp +
ffmpeg** and transcribes it with the **Groq Whisper API**. It runs separately
from the Next.js app (which can't run yt-dlp/ffmpeg on Vercel's serverless
runtime) and reports results back via a callback.

Supports any site yt-dlp handles — YouTube, TikTok, Instagram, X/Twitter, etc.

## How it fits together

```
Next.js (Vercel)                         Worker (Railway)
  └─ Inngest: transcribe-video
       ├─ POST /transcribe  ───────────────▶  yt-dlp → ffmpeg → Groq Whisper
       │   (202 accepted)                          │
       └─ waitForEvent ◀── POST /api/transcription/callback ◀── results
```

The worker acknowledges each job immediately (`202`), processes it in the
background, then POSTs the transcript (text + timestamped segments) to the
app's callback URL. Both directions are authenticated with a shared
`WORKER_SECRET` bearer token.

## Endpoints

- `GET /health` → `{ ok: true }`
- `POST /transcribe` (auth: `Authorization: Bearer $WORKER_SECRET`)
  ```json
  { "transcriptId": "...", "videoUrl": "https://...", "callbackUrl": "https://your-app/api/transcription/callback" }
  ```

## Deploy to Railway

1. Create a new Railway project from this repo and set the **root directory** to
   `worker/` (Railway will use the included `Dockerfile`).
2. Add environment variables (see `.env.example`):
   - `WORKER_SECRET` — a long random string (must match the app's `WORKER_SECRET`)
   - `GROQ_API_KEY` — from https://console.groq.com/keys
3. Deploy. Railway gives you a public URL like `https://bacaba-worker.up.railway.app`.
4. In the **Next.js app** (Vercel) set:
   - `WORKER_URL=https://bacaba-worker.up.railway.app`
   - `WORKER_SECRET=` (same value as above)

## Local development

```bash
cd worker
npm install
cp .env.example .env   # fill in WORKER_SECRET + GROQ_API_KEY
# you also need yt-dlp and ffmpeg installed locally
npm run dev
```

Long/large audio is automatically split into chunks that fit Groq's upload
limit, then stitched back together with correct timestamps.
