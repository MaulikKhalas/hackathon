import type { IngestStatus } from "./types";

/**
 * Sample call library — filenames match your source recordings.
 * Run `npm run sync:samples` (optional `HACKATHON_AUDIO_DIR`) to copy into public/call-recordings/.
 *
 * Sample calls use stable UUIDs so detail URLs match uploads: `/call-detail/<uuid>`.
 * Old `/call-detail/hackathon-call-N` (and `/calls/...`) redirect to the canonical UUID.
 */
export const HACKATHON_SAMPLE_FILES = [
  {
    id: "baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001",
    title: "Call 1",
    sourceName: "Call-1.mp3",
    publicName: "call-1.mp3",
  },
  {
    id: "baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0002",
    title: "Call 2",
    sourceName: "Call-2.wav",
    publicName: "call-2.wav",
  },
  {
    id: "baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0003",
    title: "Call 3",
    sourceName: "Call 3.wav",
    publicName: "call-3.wav",
  },
  {
    id: "baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0004",
    title: "Call 4",
    sourceName: "Call 4.wav",
    publicName: "call-4.wav",
  },
  {
    id: "baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0005",
    title: "Call 5",
    sourceName: "Call 5.wav",
    publicName: "call-5.wav",
  },
  {
    id: "baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0006",
    title: "Call 6",
    sourceName: "Call 6.wav",
    publicName: "call-6.wav",
  },
  {
    id: "baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0007",
    title: "Call 7",
    sourceName: "Call-7.mp3",
    publicName: "call-7.mp3",
  },
] as const;

/** Bookmarked URLs from older builds */
export const LEGACY_SAMPLE_DETAIL_IDS: Record<string, string> = {
  "hackathon-call-1": HACKATHON_SAMPLE_FILES[0].id,
  "hackathon-call-2": HACKATHON_SAMPLE_FILES[1].id,
  "hackathon-call-3": HACKATHON_SAMPLE_FILES[2].id,
  "hackathon-call-4": HACKATHON_SAMPLE_FILES[3].id,
  "hackathon-call-5": HACKATHON_SAMPLE_FILES[4].id,
  "hackathon-call-6": HACKATHON_SAMPLE_FILES[5].id,
  "hackathon-call-7": HACKATHON_SAMPLE_FILES[6].id,
};

export const SEEDED_SAMPLE_ID_SET = new Set<string>(
  HACKATHON_SAMPLE_FILES.map((m) => m.id),
);

export function isSeededSampleCallId(id: string): boolean {
  return SEEDED_SAMPLE_ID_SET.has(id);
}

/** Normalize detail route param (legacy slug → canonical UUID). */
export function resolveCanonicalCallDetailId(paramId: string): string {
  return LEGACY_SAMPLE_DETAIL_IDS[paramId] ?? paramId;
}

/** Seeded library calls use scripted demo dialogue until a real ingest overwrites (future). */
export function usesSeededScriptedTranscript(call: {
  id: string;
  ingestStatus?: IngestStatus;
}): boolean {
  return isSeededSampleCallId(call.id) && call.ingestStatus !== "complete";
}
