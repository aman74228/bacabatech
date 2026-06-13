import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { AudioLines, FileText, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  // Route is protected by middleware; user is guaranteed to be signed in.
  const user = await currentUser();
  const firstName = user?.firstName ?? "there";

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
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-muted-foreground">
            Paste a video link to create a new transcript.
          </p>
        </div>

        <Card className="mb-10 border-border/60 bg-secondary/20">
          <CardHeader>
            <CardTitle className="text-lg">New transcript</CardTitle>
            <CardDescription>
              We&apos;ll fetch the audio and transcribe it with Groq Whisper.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-3 sm:flex-row">
              <Input
                name="url"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                className="h-11 flex-1"
                aria-label="Video URL"
              />
              <Button type="submit" size="lg" className="h-11">
                <Plus className="h-4 w-4" />
                Transcribe
              </Button>
            </form>
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-4 text-lg font-semibold">Your transcripts</h2>
          <Card className="border-dashed border-border/60 bg-transparent">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                <FileText className="h-6 w-6" />
              </span>
              <p className="font-medium">No transcripts yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Your transcribed videos will show up here. Paste a link above to
                get started.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
