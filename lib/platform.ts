/**
 * Supported source platforms. The yt-dlp worker can handle far more, but these
 * are the ones we surface in the UI and detect explicitly.
 */
export type Platform =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "twitter"
  | "other";

const PATTERNS: Array<{ platform: Platform; test: RegExp }> = [
  { platform: "youtube", test: /(?:youtube\.com|youtu\.be)/i },
  { platform: "tiktok", test: /tiktok\.com/i },
  { platform: "instagram", test: /instagram\.com/i },
  { platform: "twitter", test: /(?:twitter\.com|x\.com)/i },
];

/** Detect the platform from a URL, or `null` if it isn't a valid URL. */
export function detectPlatform(url: string): Platform | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }
  for (const { platform, test } of PATTERNS) {
    if (test.test(parsed.hostname)) return platform;
  }
  return "other";
}

const LABELS: Record<Platform, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  twitter: "X / Twitter",
  other: "Web",
};

export function platformLabel(platform: string | null): string {
  if (platform && platform in LABELS) {
    return LABELS[platform as Platform];
  }
  return "Web";
}
