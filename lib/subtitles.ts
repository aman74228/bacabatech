/**
 * A single transcript segment with start/end timestamps in seconds, as returned
 * by Whisper's `verbose_json` response format.
 */
export interface Segment {
  start: number;
  end: number;
  text: string;
}

function pad(n: number, width = 2): string {
  return Math.floor(n).toString().padStart(width, "0");
}

/** Format seconds as `HH:MM:SS,mmm` (SRT) or `HH:MM:SS.mmm` (VTT). */
function formatTimestamp(seconds: number, msSeparator: "," | "."): string {
  const ms = Math.round((seconds - Math.floor(seconds)) * 1000);
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}${msSeparator}${pad(ms, 3)}`;
}

/** Build an SRT subtitle file from segments. */
export function toSrt(segments: Segment[]): string {
  return segments
    .map((seg, i) => {
      const start = formatTimestamp(seg.start, ",");
      const end = formatTimestamp(seg.end, ",");
      return `${i + 1}\n${start} --> ${end}\n${seg.text.trim()}\n`;
    })
    .join("\n");
}

/** Build a WebVTT subtitle file from segments. */
export function toVtt(segments: Segment[]): string {
  const body = segments
    .map((seg) => {
      const start = formatTimestamp(seg.start, ".");
      const end = formatTimestamp(seg.end, ".");
      return `${start} --> ${end}\n${seg.text.trim()}\n`;
    })
    .join("\n");
  return `WEBVTT\n\n${body}`;
}
