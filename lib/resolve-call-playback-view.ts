import { HACKATHON_SAMPLE_FILES, usesSeededScriptedTranscript } from "./hackathon-sample-manifest";
import { enrichCallRecordForDisplay } from "./enrich-call-display-sync";
import { sampleDialogueSegments } from "./hackathon-sample-dialogue";
import { getDurationSecFromPublicAudioUrl } from "./public-audio-duration";
import type { CallRecord } from "./types";

/**
 * Prefer measured file duration when audio exists on disk (covers missing JSON).
 * Hackathon placeholders get segment times regenerated to match the file length.
 */
export async function resolveCallForPlaybackView(
  call: CallRecord,
  resolvedAudioUrl: string,
): Promise<CallRecord> {
  const synced = enrichCallRecordForDisplay(call);
  const disk = resolvedAudioUrl.trim()
    ? await getDurationSecFromPublicAudioUrl(resolvedAudioUrl)
    : null;
  if (disk == null) return { ...synced, audioUrl: resolvedAudioUrl };

  if (usesSeededScriptedTranscript(synced)) {
    const meta = HACKATHON_SAMPLE_FILES.find((m) => m.id === synced.id);
    if (meta) {
      const segments = sampleDialogueSegments(meta.id, disk);
      return {
        ...synced,
        audioUrl: resolvedAudioUrl,
        durationSec: disk,
        segments,
        transcript: segments.map((s) => s.text).join(" "),
      };
    }
  }

  if (disk !== synced.durationSec) {
    return {
      ...synced,
      audioUrl: resolvedAudioUrl,
      durationSec: Math.max(synced.durationSec, disk),
    };
  }

  return { ...synced, audioUrl: resolvedAudioUrl };
}
