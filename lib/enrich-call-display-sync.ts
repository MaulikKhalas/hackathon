import { HACKATHON_SAMPLE_FILES, usesSeededScriptedTranscript } from "./hackathon-sample-manifest";
import { sampleDialogueSegments } from "./hackathon-sample-dialogue";
import { loadDurationOverrides } from "./sample-audio-durations";
import type { CallRecord } from "./types";

function basenameFromAudioUrl(url: string): string | null {
  const t = url.trim();
  if (!t.startsWith("/")) return null;
  const parts = t.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? null;
}

/** Sync: apply durations from `sample-audio-meta.generated.json` when present. */
export function enrichCallRecordForDisplay(call: CallRecord): CallRecord {
  const base = basenameFromAudioUrl(call.audioUrl);
  if (!base) return call;
  const overrides = loadDurationOverrides();
  const d = overrides[base];
  if (d == null) return call;

  if (usesSeededScriptedTranscript(call)) {
    const meta = HACKATHON_SAMPLE_FILES.find((m) => m.id === call.id);
    if (!meta) return { ...call, durationSec: d };
    const segments = sampleDialogueSegments(meta.id, d);
    return {
      ...call,
      durationSec: d,
      segments,
      transcript: segments.map((s) => s.text).join(" "),
    };
  }

  return { ...call, durationSec: Math.max(call.durationSec, d) };
}
