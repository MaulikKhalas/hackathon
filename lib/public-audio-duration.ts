import fs from "node:fs";
import path from "node:path";
import { parseBuffer } from "music-metadata";

/**
 * Reads duration from a file under `public/` when the URL is served from disk.
 * Used when `sample-audio-meta.generated.json` is missing but audio is present.
 */
export async function getDurationSecFromPublicAudioUrl(
  urlPath: string,
): Promise<number | null> {
  const u = urlPath.trim();
  if (!u.startsWith("/")) return null;
  const relative = u.replace(/^\/+/, "");
  const publicRoot = path.join(process.cwd(), "public");
  const diskPath = path.join(publicRoot, relative);
  const normalized = path.normalize(diskPath);
  if (!normalized.startsWith(publicRoot)) return null;
  if (!fs.existsSync(normalized) || !fs.statSync(normalized).isFile()) {
    return null;
  }
  try {
    const buf = fs.readFileSync(normalized);
    const meta = await parseBuffer(buf);
    const d = meta.format.duration;
    if (d != null && Number.isFinite(d)) return Math.max(1, Math.round(d));
  } catch {
    /* ignore */
  }
  return null;
}
