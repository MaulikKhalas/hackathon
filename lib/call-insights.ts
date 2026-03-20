import type { CallRecord, PerformanceScores } from "./types";

const SCORE_KEYS: { key: keyof PerformanceScores; label: string }[] = [
  { key: "clarity", label: "communication clarity" },
  { key: "politeness", label: "politeness" },
  { key: "knowledge", label: "business knowledge" },
  { key: "problemHandling", label: "problem handling" },
  { key: "listening", label: "listening" },
];

const HIGH = 7.5;
const LOW = 5.5;

function deriveWentWell(call: CallRecord): string[] {
  const out: string[] = [];
  for (const { key, label } of SCORE_KEYS) {
    const v = call.scores[key];
    if (v >= HIGH) {
      out.push(`Strong ${label} (score ${v.toFixed(1)}/10).`);
    }
  }
  if (call.sentiment === "positive") {
    out.push("Overall tone of the call reads constructive and engaged.");
  }
  const asked = call.discovery.filter((d) => d.asked).length;
  if (asked >= 3) {
    out.push(`Discovery coverage: ${asked} of ${call.discovery.length} key themes explored.`);
  } else if (asked >= 1) {
    out.push(`Some discovery themes covered (${asked} checked).`);
  }
  if (call.talkTime.customerPct >= 35 && call.talkTime.customerPct <= 55) {
    out.push("Balanced airtime — customer had room to speak.");
  }
  if (out.length === 0) {
    out.push(
      "Run a full upload analysis to get AI-written strengths tailored to this transcript.",
    );
  }
  return out.slice(0, 8);
}

function deriveWentWrong(call: CallRecord): string[] {
  const out: string[] = [];
  for (const { key, label } of SCORE_KEYS) {
    const v = call.scores[key];
    if (v <= LOW && v > 0) {
      out.push(`Improve ${label} (score ${v.toFixed(1)}/10) — coaching priority.`);
    }
  }
  if (call.sentiment === "negative") {
    out.push("Overall sentiment skewed negative — review friction points in the transcript.");
  }
  const missed = call.discovery.filter((d) => !d.asked);
  for (const d of missed.slice(0, 3)) {
    out.push(`Discovery gap: “${d.topic}” was not clearly covered.`);
  }
  if (call.talkTime.agentPct > 72) {
    out.push("Agent dominated talk time — practice more open questions and pauses.");
  }
  if (out.length === 0) {
    out.push(
      "No major red flags from scores alone. Use follow-ups and transcript review for nuance.",
    );
  }
  return out.slice(0, 8);
}

/** Follow-ups plus “went well / wrong” for the detail UI (model output or heuristics). */
export function resolveCallInsights(call: CallRecord): {
  followUps: string[];
  wentWell: string[];
  wentWrong: string[];
} {
  const followUps = (call.actionItems ?? []).map((s) => s.trim()).filter(Boolean);
  const rawWell = (call.whatWentWell ?? []).map((s) => s.trim()).filter(Boolean);
  const rawWrong = (call.whatWentWrong ?? []).map((s) => s.trim()).filter(Boolean);
  return {
    followUps,
    wentWell: rawWell.length > 0 ? rawWell : deriveWentWell(call),
    wentWrong: rawWrong.length > 0 ? rawWrong : deriveWentWrong(call),
  };
}
