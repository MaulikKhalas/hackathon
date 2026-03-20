import fs from "node:fs";
import path from "node:path";

/**
 * Return a playback URL only when the file exists under `public/`.
 */
export function resolvePublicAudioUrl(audioUrl: string | undefined): string {
  if (!audioUrl?.trim()) return "";
  const url = audioUrl.trim();
  if (!url.startsWith("/")) return "";

  const relative = url.replace(/^\/+/, "");
  const publicRoot = path.join(process.cwd(), "public");
  const diskPath = path.join(publicRoot, relative);
  const normalized = path.normalize(diskPath);

  if (!normalized.startsWith(publicRoot)) return "";

  try {
    if (fs.existsSync(normalized) && fs.statSync(normalized).isFile()) {
      return url;
    }
  } catch {
    return "";
  }
  return "";
}
