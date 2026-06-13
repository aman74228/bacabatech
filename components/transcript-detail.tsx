"use client";

import { useState } from "react";
import { Copy, Check, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toSrt, toVtt, type Segment } from "@/lib/subtitles";

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function TranscriptDetail({
  text,
  segments,
}: {
  text: string;
  segments: Segment[] | null;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const hasSegments = segments != null && segments.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={copy}>
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copied ? "Copied" : "Copy text"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => download("transcript.txt", text, "text/plain")}
        >
          <Download className="h-4 w-4" /> .txt
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasSegments}
          onClick={() =>
            segments &&
            download("transcript.srt", toSrt(segments), "application/x-subrip")
          }
        >
          <Download className="h-4 w-4" /> .srt
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasSegments}
          onClick={() =>
            segments && download("transcript.vtt", toVtt(segments), "text/vtt")
          }
        >
          <Download className="h-4 w-4" /> .vtt
        </Button>
      </div>

      <Textarea
        readOnly
        value={text}
        className="min-h-[420px] resize-y font-mono text-sm leading-relaxed"
      />
    </div>
  );
}
