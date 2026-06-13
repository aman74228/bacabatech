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

### 3. Set up the database

Run the schema in the Supabase SQL editor (or with the Supabase CLI):

```bash
# paste the contents of supabase/schema.sql into the SQL editor, or:
supabase db push
```

This creates the `users`, `transcripts`, and `usage` tables.

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
  dashboard/page.tsx          # Protected dashboard (requires auth)
  sign-in/[[...sign-in]]/     # Clerk sign-in route
  sign-up/[[...sign-up]]/     # Clerk sign-up route
components/
  navbar.tsx, hero.tsx, features.tsx, footer.tsx
  ui/                         # shadcn/ui primitives (button, card, input)
lib/
  utils.ts                    # cn() class helper
  supabase.ts                 # Supabase client + admin client
  database.types.ts           # Generated DB types
supabase/
  schema.sql                  # Database schema
middleware.ts                 # Clerk middleware — protects /dashboard
```

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
