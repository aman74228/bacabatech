import { spawn } from "node:child_process";
import { createReadStream, writeFileSync } from "node:fs";
import { mkdtemp, rm, readdir, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Groq from "groq-sdk";

const GROQ_MODEL = process.env.GROQ_MODEL ?? "whisper-large-v3-turbo";
// Groq's audio upload limit. We keep a margin under 25MB.
const MAX_UPLOAD_BYTES = 24 * 1024 * 1024;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface Segment {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionResult {
  text: string;
  segments: Segment[];
  language: string | null;
  durationSeconds: number | null;
}

/** Run a command, rejecting on a non-zero exit code. */
function run(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`${cmd} exited ${code}: ${stderr.slice(-500)}`));
    });
  });
}

/**
 * Resolve a Netscape-format cookies file from env (memoized).
 * Sites like YouTube block requests from datacenter IPs ("Sign in to confirm
 * you're not a bot"); supplying cookies from a logged-in browser bypasses this.
 * Set YTDLP_COOKIES_B64 (base64 of cookies.txt) or YTDLP_COOKIES (raw text).
 */
let cookiesPath: string | null | undefined;
function getCookiesFile(): string | null {
  if (cookiesPath !== undefined) return cookiesPath;
  const b64 = process.env.YTDLP_COOKIES_B64;
  const raw = process.env.YTDLP_COOKIES;
  const content = b64 ? Buffer.from(b64, "base64").toString("utf8") : raw;
  if (!content) {
    cookiesPath = null;
    return null;
  }
  const path = join(tmpdir(), "yt-cookies.txt");
  writeFileSync(path, content, { mode: 0o600 });
  cookiesPath = path;
  return path;
}

/** Download the best audio for a URL and transcode to mono 16kHz mp3. */
async function extractAudio(url: string, dir: string): Promise<string> {
  const out = join(dir, "audio.%(ext)s");
  const args = [
    "--no-playlist",
    "--no-warnings",
    "-f",
    "bestaudio/best",
    "-x",
    "--audio-format",
    "mp3",
    "--audio-quality",
    "64K",
    "--postprocessor-args",
    "ffmpeg:-ac 1 -ar 16000",
  ];

  const cookies = getCookiesFile();
  if (cookies) args.push("--cookies", cookies);

  // Optional levers for evading bot detection without cookies, e.g.
  // YTDLP_EXTRACTOR_ARGS="youtube:player_client=android".
  if (process.env.YTDLP_EXTRACTOR_ARGS) {
    args.push("--extractor-args", process.env.YTDLP_EXTRACTOR_ARGS);
  }
  if (process.env.YTDLP_USER_AGENT) {
    args.push("--user-agent", process.env.YTDLP_USER_AGENT);
  }

  args.push("-o", out, url);

  await run("yt-dlp", args);
  const files = await readdir(dir);
  const mp3 = files.find((f) => f.endsWith(".mp3"));
  if (!mp3) throw new Error("yt-dlp produced no audio file");
  return join(dir, mp3);
}

/** Get media duration in seconds via ffprobe. */
async function probeDuration(path: string): Promise<number> {
  const out = await run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    path,
  ]);
  const seconds = parseFloat(out.trim());
  return Number.isFinite(seconds) ? seconds : 0;
}

/** Split an audio file into time-based chunks, returning their paths in order. */
async function splitAudio(
  path: string,
  dir: string,
  chunkSeconds: number
): Promise<string[]> {
  const pattern = join(dir, "chunk_%03d.mp3");
  await run("ffmpeg", [
    "-i",
    path,
    "-f",
    "segment",
    "-segment_time",
    String(chunkSeconds),
    "-c",
    "copy",
    pattern,
  ]);
  const files = (await readdir(dir))
    .filter((f) => f.startsWith("chunk_") && f.endsWith(".mp3"))
    .sort();
  return files.map((f) => join(dir, f));
}

/** Transcribe a single audio file, offsetting timestamps by `offset` seconds. */
async function transcribeFile(
  path: string,
  offset: number
): Promise<TranscriptionResult> {
  const res = (await groq.audio.transcriptions.create({
    file: createReadStream(path),
    model: GROQ_MODEL,
    response_format: "verbose_json",
  })) as unknown as {
    text: string;
    language?: string;
    duration?: number;
    segments?: Array<{ start: number; end: number; text: string }>;
  };

  const segments: Segment[] = (res.segments ?? []).map((s) => ({
    start: s.start + offset,
    end: s.end + offset,
    text: s.text.trim(),
  }));

  return {
    text: res.text.trim(),
    segments,
    language: res.language ?? null,
    durationSeconds: res.duration ?? null,
  };
}

/** Full pipeline: download audio, chunk if needed, transcribe, and merge. */
export async function transcribeUrl(url: string): Promise<TranscriptionResult> {
  const dir = await mkdtemp(join(tmpdir(), "bacaba-"));
  try {
    const audioPath = await extractAudio(url, dir);
    const { size } = await stat(audioPath);

    if (size <= MAX_UPLOAD_BYTES) {
      return await transcribeFile(audioPath, 0);
    }

    // Too large for one upload — split into time chunks sized to fit.
    const duration = await probeDuration(audioPath);
    const ratio = MAX_UPLOAD_BYTES / size;
    const chunkSeconds = Math.max(
      60,
      Math.floor((duration > 0 ? duration : 3600) * ratio * 0.9)
    );
    const chunks = await splitAudio(audioPath, dir, chunkSeconds);

    const merged: TranscriptionResult = {
      text: "",
      segments: [],
      language: null,
      durationSeconds: 0,
    };
    for (let i = 0; i < chunks.length; i++) {
      const part = await transcribeFile(chunks[i], i * chunkSeconds);
      merged.text += (merged.text ? " " : "") + part.text;
      merged.segments.push(...part.segments);
      merged.language = merged.language ?? part.language;
    }
    merged.durationSeconds = duration || null;
    return merged;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
