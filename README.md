# Bacaba

Video-to-transcript SaaS. Paste a link from YouTube, TikTok, Instagram, and
more — Bacaba transcribes it with the Groq Whisper API and gives you clean,
formatted text in seconds.

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Clerk** — authentication
- **Supabase** — Postgres database
- **Inngest** — background jobs (transcription pipeline)
- **Groq Whisper API** — transcription
- **Vercel** — deployment

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env.local
```

| Variable | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | [Clerk dashboard](https://dashboard.clerk.com) |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `GROQ_API_KEY` | [Groq console](https://console.groq.com/keys) |
| `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` | [Inngest dashboard](https://app.inngest.com) |
| `WORKER_URL` / `WORKER_SECRET` | The transcription worker (see [`worker/README.md`](worker/README.md)) |

### 3. Set up the database

Run the schema and migrations in the Supabase SQL editor (or with the Supabase CLI):

```bash
# paste supabase/schema.sql then supabase/migrations/*.sql into the SQL editor, or:
supabase db push
```

`schema.sql` creates the `users`, `transcripts`, and `usage` tables;
`migrations/0001_transcription_engine.sql` adds the transcript result columns
(`language`, `duration_seconds`, `segments`, `error`) and the usage counter.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
app/
  layout.tsx                  # Root layout with ClerkProvider (dark theme)
  page.tsx                    # Landing page (navbar, hero, features, footer)
  globals.css                 # Tailwind + shadcn design tokens
  dashboard/page.tsx          # Protected dashboard — form + transcript list
  dashboard/transcripts/[id]/ # Transcript detail (text + SRT/VTT download)
  sign-in/[[...sign-in]]/     # Clerk sign-in route
  sign-up/[[...sign-up]]/     # Clerk sign-up route
  actions/transcripts.ts      # Server action — create + enqueue a transcript
  api/inngest/route.ts        # Inngest serve endpoint
  api/transcription/callback/ # Worker posts results here
components/
  navbar.tsx, hero.tsx, features.tsx, footer.tsx
  transcript-form.tsx, transcript-list.tsx, transcript-detail.tsx
  ui/                         # shadcn/ui primitives (button, card, input, ...)
lib/
  utils.ts                    # cn() class helper
  supabase.ts                 # Supabase client + admin client
  database.types.ts           # DB types
  users.ts                    # Clerk -> Supabase user sync
  transcripts.ts              # Transcript DB helpers
  platform.ts                 # URL -> platform detection
  subtitles.ts                # Segments -> SRT / VTT
  inngest/                    # Inngest client + transcribe-video function
supabase/
  schema.sql                  # Database schema
  migrations/                 # Incremental SQL migrations
worker/                       # Standalone yt-dlp + Groq worker (deploy to Railway)
middleware.ts                 # Clerk middleware — protects /dashboard
```

## Transcription engine

Because Vercel's serverless runtime can't run `yt-dlp`/`ffmpeg`, audio
extraction + transcription live in a standalone **worker** (`worker/`, deploy to
Railway). The flow:

1. User submits a URL → `createTranscriptAction` inserts a `pending` row and
   sends the Inngest event `transcript/requested`.
2. The `transcribe-video` Inngest function marks the row `processing` and
   dispatches the job to the worker, then waits (up to 1h) for completion.
3. The worker runs `yt-dlp` → `ffmpeg` (mono 16kHz mp3, auto-chunked to fit
   Groq's upload limit) → **Groq Whisper** (`verbose_json`), and POSTs the text
   + timestamped segments back to `/api/transcription/callback`.
4. The callback persists the result and emits `transcript/worker.completed`;
   the function finalizes and bumps the user's usage count.

The dashboard polls while jobs are in flight, and transcripts can be exported as
**plain text, SRT, or VTT**. See [`worker/README.md`](worker/README.md) for
deploy steps.

## Authentication

Clerk protects routes via `middleware.ts`. The `/dashboard` route (and anything
under it) requires a signed-in user; unauthenticated visitors are redirected to
sign in. Sign-in/sign-up are available both as modals (navbar) and as dedicated
pages.

## Database

Three tables (see `supabase/schema.sql`):

- **users** — `id`, `clerk_id`, `email`, `created_at`
- **transcripts** — `id`, `user_id`, `platform`, `video_url`, `status`, `transcript_text`, `format`, `created_at`
- **usage** — `id`, `user_id`, `transcript_count`, `is_subscribed`, `created_at`

Row Level Security is enabled; the server uses the service role key (which
bypasses RLS) for writes.

## Scripts

```bash
npm run dev      # start dev server
npm run build    # production build
npm run start    # run production build
npm run lint     # lint
```

## Deployment

Deploy to [Vercel](https://vercel.com). Add all the variables from
`.env.example` to your Vercel project's environment settings.
