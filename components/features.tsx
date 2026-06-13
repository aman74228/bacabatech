import { Zap, FileText, Languages, ShieldCheck } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: Zap,
    title: "Lightning fast",
    description:
      "Groq's Whisper API transcribes hours of audio in seconds, so you never wait around.",
  },
  {
    icon: FileText,
    title: "Clean formatting",
    description:
      "Export to plain text, SRT subtitles, or Markdown — ready to publish or repurpose.",
  },
  {
    icon: Languages,
    title: "Any platform",
    description:
      "Drop in links from YouTube, TikTok, Instagram, Vimeo, or upload your own files.",
  },
  {
    icon: ShieldCheck,
    title: "Private & secure",
    description:
      "Your transcripts are tied to your account and never shared. You're always in control.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-border/60 py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to transcribe
          </h2>
          <p className="mt-4 text-muted-foreground">
            Bacaba handles the heavy lifting so you can focus on the content.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="border-border/60 bg-secondary/20 transition-colors hover:border-border"
            >
              <CardHeader>
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </span>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
