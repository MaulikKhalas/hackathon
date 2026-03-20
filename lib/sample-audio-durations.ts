import fs from "node:fs";
import path from "node:path";

/** Durations keyed by `public/call-recordings/<filename>` basename — from `npm run sync:samples`. */
export function loadDurationOverrides(): Record<string, number> {
  try {
    const p = path.join(
      process.cwd(),
      "lib",
      "sample-audio-meta.generated.json",
    );
    if (fs.existsSync(p)) {
      const raw = JSON.parse(fs.readFileSync(p, "utf8")) as Record<
        string,
        number
      >;
      return raw;
    }
  } catch {
    /* ignore */
  }
  return {};
}
