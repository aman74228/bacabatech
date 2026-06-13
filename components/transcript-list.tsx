"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { platformLabel } from "@/lib/platform";
import type { TranscriptRow } from "@/lib/transcripts";

function StatusBadge({ status }: { status: TranscriptRow["status"] }) {
  switch (status) {
    case "completed":
      return (
        <Badge variant="success">
          <CheckCircle2 className="mr-1 h-3 w-3" /> Completed
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive">
          <XCircle className="mr-1 h-3 w-3" /> Failed
        </Badge>
      );
    case "processing":
      return (
        <Badge variant="warning">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Processing
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          <Clock className="mr-1 h-3 w-3" /> Pending
        </Badge>
      );
  }
}

export function TranscriptList({ transcripts }: { transcripts: TranscriptRow[] }) {
  const router = useRouter();

  // Poll for updates while anything is still in flight.
  const hasActive = transcripts.some(
    (t) => t.status === "pending" || t.status === "processing"
  );
  useEffect(() => {
    if (!hasActive) return;
    const id = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(id);
  }, [hasActive, router]);

  if (transcripts.length === 0) {
    return (
      <Card className="border-dashed border-border/60 bg-transparent">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <FileText className="h-6 w-6" />
          </span>
          <p className="font-medium">No transcripts yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Your transcribed videos will show up here. Paste a link above to get
            started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {transcripts.map((t) => (
        <Link key={t.id} href={`/dashboard/transcripts/${t.id}`} className="block">
          <Card className="border-border/60 bg-secondary/20 transition-colors hover:border-border">
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <Badge variant="outline">{platformLabel(t.platform)}</Badge>
                  <StatusBadge status={t.status} />
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {t.video_url}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {new Date(t.created_at).toLocaleDateString()}
              </span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
