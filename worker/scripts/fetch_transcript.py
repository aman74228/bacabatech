#!/usr/bin/env python3
"""Fetch a YouTube video's captions via youtube-transcript-api.

Usage: fetch_transcript.py <video_id>
Prints JSON {text, segments:[{start,end,text}], language, durationSeconds} to
stdout on success; prints a concise error to stderr and exits non-zero on
failure.
"""
import json
import sys


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: fetch_transcript.py <video_id>", file=sys.stderr)
        return 2
    video_id = sys.argv[1]

    try:
        from youtube_transcript_api import YouTubeTranscriptApi
    except ImportError as exc:  # pragma: no cover
        print(f"youtube-transcript-api not installed: {exc}", file=sys.stderr)
        return 1

    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)

        # Prefer a manually-created transcript; fall back to any (generated).
        chosen = None
        for tr in transcript_list:
            if not tr.is_generated:
                chosen = tr
                break
        if chosen is None:
            for tr in transcript_list:
                chosen = tr
                break
        if chosen is None:
            print("No transcripts available for this video", file=sys.stderr)
            return 1

        items = chosen.fetch()
        segments = []
        for it in items:
            # Support both dict-style (<=0.6.x) and object-style entries.
            start = float(it["start"] if isinstance(it, dict) else it.start)
            dur = float(it["duration"] if isinstance(it, dict) else it.duration)
            raw = it["text"] if isinstance(it, dict) else it.text
            text = (raw or "").replace("\n", " ").strip()
            if not text:
                continue
            segments.append({"start": start, "end": start + dur, "text": text})

        out = {
            "text": " ".join(s["text"] for s in segments),
            "segments": segments,
            "language": getattr(chosen, "language_code", None),
            "durationSeconds": segments[-1]["end"] if segments else None,
        }
        print(json.dumps(out))
        return 0
    except Exception as exc:  # noqa: BLE001 - surface a concise message
        print(f"{type(exc).__name__}: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
