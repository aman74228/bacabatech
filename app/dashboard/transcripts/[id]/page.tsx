import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, AudioLines, Loader2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TranscriptDetail } from "@/components/transcript-detail";
import { AutoRefresh } from "@/components/auto-refresh";
import { getOrCreateUser } from "@/lib/users";
import { getTranscript } from "@/lib/transcripts";
import { platformLabel } from "@/lib/platform";
import type { Segment } from "@/lib/subtitles";

export const dynamic = "force-dynamic";

export default async function TranscriptPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getOrCreateUser();
  if (!user) notFound();

  const transcript = await getTranscript(user.id, params.id);
  if (!transcript) notFound();

  const segments = (transcript.segments as Segment[] | null) ?? null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <AudioLines className="h-5 w-5" />
            </span>
            <span className="text-lg tracking-tight">Bacaba</span>
          </Link>
        </div>
      </header>

      <main className="container max-w-3xl flex-1 py-10">
        <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
        </Button>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Badge variant="outline">{platformLabel(transcript.platform)}</Badge>
          {transcript.language && (
            <Badge variant="secondary">{transcript.language.toUpperCase()}</Badge>
          )}
        </div>

        <a
          href={transcript.video_url}
          target="_blank"
          rel="noreferrer"
          className="mb-8 block break-all text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          {transcript.video_url}
        </a>

        {transcript.status === "completed" ? (
          <TranscriptDetail
            text={transcript.transcript_text ?? ""}
            segments={segments}
          />
        ) : transcript.status === "failed" ? (
          <Card className="border-destructive/40 bg-destructive/10">
            <CardContent className="flex items-start gap-3 py-6">
              <XCircle className="mt-0.5 h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium">Transcription failed</p>
                <p className="text-sm text-muted-foreground">
                  {transcript.error ?? "Something went wrong. Please try again."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/60 bg-secondary/20">
            <AutoRefresh />
            <CardContent className="flex items-center gap-3 py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <div>
                <p className="font-medium capitalize">{transcript.status}…</p>
                <p className="text-sm text-muted-foreground">
                  We&apos;re fetching the audio and transcribing it. This page
                  will update when it&apos;s ready.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
