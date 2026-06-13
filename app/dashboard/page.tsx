import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { AudioLines } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TranscriptForm } from "@/components/transcript-form";
import { TranscriptList } from "@/components/transcript-list";
import { getOrCreateUser } from "@/lib/users";
import { listTranscripts } from "@/lib/transcripts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Route is protected by middleware; sync the Clerk user into Supabase.
  const user = await getOrCreateUser();
  const transcripts = user ? await listTranscripts(user.id) : [];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <AudioLines className="h-5 w-5" />
            </span>
            <span className="text-lg tracking-tight">Bacaba</span>
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="container flex-1 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Paste a video link to create a new transcript.
          </p>
        </div>

        <Card className="mb-10 border-border/60 bg-secondary/20">
          <CardHeader>
            <CardTitle className="text-lg">New transcript</CardTitle>
            <CardDescription>
              We&apos;ll fetch the audio and transcribe it with Groq Whisper.
              Supports YouTube, TikTok, Instagram, and X.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TranscriptForm />
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-4 text-lg font-semibold">Your transcripts</h2>
          <TranscriptList transcripts={transcripts} />
        </div>
      </main>
    </div>
  );
}
