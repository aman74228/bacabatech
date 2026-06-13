import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu blur-3xl"
      >
        <div className="mx-auto aspect-[1155/678] w-[72rem] bg-gradient-to-tr from-primary/20 to-purple-500/20 opacity-30" />
      </div>

      <div className="container flex flex-col items-center gap-8 py-24 text-center md:py-32">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-4 py-1.5 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          Powered by Groq Whisper — transcribe in seconds
        </div>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Turn any video into an{" "}
          <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            accurate transcript
          </span>
        </h1>

        <p className="max-w-xl text-lg text-muted-foreground">
          Paste a link from YouTube, TikTok, Instagram, or anywhere else. Bacaba
          transcribes it and gives you clean, formatted text in seconds.
        </p>

        {/* URL input + CTA */}
        <form
          action="/dashboard"
          className="flex w-full max-w-xl flex-col gap-3 sm:flex-row"
        >
          <Input
            name="url"
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            className="h-12 flex-1 text-base"
            aria-label="Video URL"
          />
          <Button type="submit" size="lg" className="h-12 px-6">
            Transcribe
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <p className="text-sm text-muted-foreground">
          No credit card required.{" "}
          <Link href="/dashboard" className="underline underline-offset-4">
            Start for free
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
