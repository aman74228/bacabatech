# Bacaba transcription worker

A small HTTP service that turns a video URL into a transcript and reports the
result back to the Next.js app via a callback. It runs separately from the app
(which can't run yt-dlp/ffmpeg on Vercel's serverless runtime).

Two strategies depending on the source:

- **YouTube** → fetches the video's built-in captions with
  [`youtube-transcript-api`](https://pypi.org/project/youtube-transcript-api/).
  No download, no Groq call — fast and it avoids yt-dlp's format/bot-detection
  problems. Only works for videos that *have* captions.
- **Everything else** (TikTok, Instagram, X/Twitter, …) → **yt-dlp → ffmpeg →
  Groq Whisper**.

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

## Troubleshooting

### YouTube

YouTube now goes through `youtube-transcript-api` (captions), not yt-dlp. Two
things to know:

- **No captions → it fails.** If a video has captions disabled, the job errors
  with "No captions are available for this YouTube video." (We can add a
  yt-dlp + Whisper fallback for these if you want.)
- **IP blocking.** YouTube sometimes rate-limits/blocks the captions endpoint
  from datacenter IPs (Railway, most clouds). If you see `RequestBlocked` /
  `IpBlocked` errors, route the worker through a proxy — `youtube-transcript-api`
  supports proxy configuration (e.g. Webshare). Open an issue/ping and we can
  wire a `PROXY_URL` env var into `scripts/fetch_transcript.py`.

### Non-YouTube (yt-dlp): "Sign in to confirm you're not a bot"

For non-YouTube sources, yt-dlp may hit datacenter-IP blocks. Supply cookies
from a logged-in browser:

1. Install a "Get cookies.txt" extension and export **cookies.txt** (Netscape
   format) while signed in. (Use a throwaway account.)
2. Base64-encode it: `base64 -w0 cookies.txt` (Linux) / `base64 -i cookies.txt`
   (macOS).
3. Set `YTDLP_COOKIES_B64` to that string in Railway and redeploy.

Cookies expire periodically, so refresh them every so often.

### Callbacks not arriving / results never saved

The callback URL is built by the **Next.js app**, not the worker. Set
`NEXT_PUBLIC_APP_URL` to your production URL in **Vercel** (the app falls back to
`VERCEL_URL` automatically, but an explicit value is safest). If it points at
`localhost`, the worker can't reach your app.
