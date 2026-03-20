import type { CallRecord, PerformanceScores } from "./types";

export function isFailedIngest(call: CallRecord): boolean {
  return call.ingestStatus === "failed";
}

/** Placeholder scores for failed rows (dashboard shows "—" instead). */
export const FAILED_SCORES_PLACEHOLDER: PerformanceScores = {
  clarity: 0,
  politeness: 0,
  knowledge: 0,
  problemHandling: 0,
  listening: 0,
};

export function buildFailedUploadRecord(params: {
  id: string;
  title: string;
  failureReason: string;
  audioUrl?: string;
  durationSec?: number;
}): CallRecord {
  return {
    id: params.id,
    title: params.title,
    createdAt: new Date().toISOString(),
    durationSec: Math.max(0, params.durationSec ?? 0),
    audioUrl: params.audioUrl ?? "",
    transcript: "",
    segments: [],
    sentiment: "neutral",
    talkTime: { agentPct: 50, customerPct: 50 },
    scores: { ...FAILED_SCORES_PLACEHOLDER },
    discovery: [],
    keywords: [],
    actionItems: [],
    ingestStatus: "failed",
    failureReason: params.failureReason,
  };
}
