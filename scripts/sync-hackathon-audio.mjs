/**
 * Copies hackathon recordings into public/call-recordings/ (single library folder).
 * Writes lib/sample-audio-meta.generated.json using music-metadata (no ffprobe required).
 *
 * Usage:
 *   npm run sync:samples
 *   HACKATHON_AUDIO_DIR="C:\path\to\folder" npm run sync:samples
 */

import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseFile } from "music-metadata";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const MAPPINGS = [
  ["Call-1.mp3", "call-1.mp3"],
  ["Call-2.wav", "call-2.wav"],
  ["Call 3.wav", "call-3.wav"],
  ["Call 4.wav", "call-4.wav"],
  ["Call 5.wav", "call-5.wav"],
  ["Call 6.wav", "call-6.wav"],
  ["Call-7.mp3", "call-7.mp3"],
];

const srcDir =
  process.env.HACKATHON_AUDIO_DIR ||
  String.raw`D:\Maulik\Projects\hackathon-2026\hackathon-2026`;
const destDir = path.join(root, "public", "call-recordings");

async function probeDurationSec(filePath) {
  try {
    const meta = await parseFile(filePath);
    const d = meta.format.duration;
    if (d != null && Number.isFinite(d)) return Math.max(1, Math.round(d));
  } catch {
    /* ignore */
  }
  return null;
}

mkdirSync(destDir, { recursive: true });

const durations = {};
let copied = 0;
const missing = [];

for (const [sourceName, publicName] of MAPPINGS) {
  const from = path.join(srcDir, sourceName);
  const to = path.join(destDir, publicName);
  if (!existsSync(from)) {
    missing.push(from);
    continue;
  }
  copyFileSync(from, to);
  copied += 1;
  const d = await probeDurationSec(to);
  if (d != null) durations[publicName] = d;
}

const metaPath = path.join(root, "lib", "sample-audio-meta.generated.json");
if (Object.keys(durations).length > 0) {
  writeFileSync(metaPath, JSON.stringify(durations, null, 2), "utf8");
  console.log(`Wrote ${metaPath}`);
} else {
  console.log("No durations written (no files copied or metadata read failed).");
}

console.log(`Copied ${copied}/${MAPPINGS.length} files → public/call-recordings/`);
if (missing.length) {
  console.warn("Missing sources (check HACKATHON_AUDIO_DIR):");
  for (const m of missing) console.warn("  -", m);
  process.exitCode = missing.length === MAPPINGS.length ? 1 : 0;
}
