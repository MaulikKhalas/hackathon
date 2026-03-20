import OpenAI from "openai";
import type { Uploadable } from "openai/uploads";
import {
  defaultHackathonDiscovery,
  HACKATHON_DISCOVERY_TOPICS,
} from "./discovery-constants";
import type {
  CallRecord,
  DiscoveryChecklistItem,
  PerformanceScores,
  SentimentLabel,
  Speaker,
  TranscriptSegment,
} from "./types";

export type WhisperVerbose = {
  text: string;
  segments?: { start: number; end: number; text: string }[];
};

/** Chat model for transcript analysis — default avoids orgs without `gpt-4o` access. */
function analysisChatModel(): string {
  const m = process.env.OPENAI_ANALYSIS_MODEL?.trim();
  if (m) return m;
  return "gpt-4o-mini";
}

function resolveDiscoveryTopic(input: string): string | undefined {
  const s = input.trim().toLowerCase();
  for (const topic of HACKATHON_DISCOVERY_TOPICS) {
    if (topic.toLowerCase() === s) return topic;
  }
  if (s.includes("budget") || s.includes("price") || s.includes("cost")) {
    return "Budget";
  }
  if (s.includes("competitor") || s.includes("alternative vendor")) {
    return "Competitors";
  }
  if (
    s.includes("kitchen") ||
    s.includes("scope") ||
    s.includes("layout") ||
    s.includes("square feet") ||
    s.includes("sq ft")
  ) {
    return "Kitchen size / scope";
  }
  if (s.includes("cabinet") || s.includes("door style") || s.includes("finish")) {
    return "Cabinet style";
  }
  return undefined;
}

function normalizeDiscovery(raw: unknown): DiscoveryChecklistItem[] {
  const merged = new Map(
    defaultHackathonDiscovery().map((d) => [d.topic, { ...d }]),
  );
  if (!Array.isArray(raw)) return Array.from(merged.values());
  for (const item of raw as DiscoveryChecklistItem[]) {
    if (!item?.topic) continue;
    const key = resolveDiscoveryTopic(item.topic);
    if (key && merged.has(key)) {
      merged.set(key, {
        topic: key,
        asked: Boolean(item.asked),
        evidence: item.evidence?.trim() || undefined,
      });
    }
  }
  return Array.from(merged.values());
}

/** Scores are integers 1–10 per hackathon spec. */
function clampScore1to10(n: number): number {
  if (Number.isNaN(n)) return 5;
  return Math.min(10, Math.max(1, Math.round(n * 10) / 10));
}

export async function transcribeVerbose(
  client: OpenAI,
  file: Uploadable,
): Promise<WhisperVerbose> {
  const transcription = await client.audio.transcriptions.create({
    file,
    model: "whisper-1",
    response_format: "verbose_json",
  });

  const t = transcription as unknown as {
    text: string;
    segments?: { start: number; end: number; text: string }[];
  };
  return { text: t.text ?? "", segments: t.segments ?? [] };
}

export async function analyzeTranscript(
  client: OpenAI,
  transcript: string,
  whisperSegments: WhisperVerbose["segments"],
): Promise<Omit<CallRecord, "id" | "title" | "createdAt" | "durationSec" | "audioUrl">> {
  const segmentHint =
    whisperSegments?.length ?
      JSON.stringify(
        whisperSegments.map((s) => ({
          start: s.start,
          end: s.end,
          text: s.text,
        })),
        null,
        2,
      )
    : "none";

  const systemPrompt = `You are a kitchen / home remodeling sales QA analyst. Output ONLY valid JSON (no markdown). 
Scores must be numbers from 1 to 10 (decimals allowed). 
Discovery checklist must use EXACT topic strings: "Budget", "Competitors", "Kitchen size / scope", "Cabinet style".
Estimate talk-time split as approximate % of words spoken by the sales agent vs the customer (must sum to ~100).`;

  const userPrompt = `Analyze this sales call transcript.

Transcript:
"""
${transcript}
"""

Transcription segment timings (seconds), if helpful for speaker splits:
${segmentHint}

Return a single JSON object:
{
  "overallSentiment": "positive" | "neutral" | "negative",
  "talkTimeAgentPct": number,
  "talkTimeCustomerPct": number,
  "scores": {
    "clarity": number,
    "politeness": number,
    "knowledge": number,
    "problemHandling": number,
    "listening": number
  },
  "discovery": [
    { "topic": "Budget", "asked": boolean, "evidence"?: string },
    { "topic": "Competitors", "asked": boolean, "evidence"?: string },
    { "topic": "Kitchen size / scope", "asked": boolean, "evidence"?: string },
    { "topic": "Cabinet style", "asked": boolean, "evidence"?: string }
  ],
  "keywords": string[],
  "actionItems": string[],
  "whatWentWell": string[],
  "whatWentWrong": string[],
  "segments": [{
    "startSec": number,
    "endSec": number,
    "speaker": "agent" | "customer",
    "text": string,
    "sentiment": "positive" | "neutral" | "negative"
  }]
}

Rules:
- Map performance to score keys: clarity = communication clarity; knowledge = business / product knowledge.
- Label each transcript segment with speaker (agent = sales/design rep) and sentiment.
- Discovery: asked=true only if the topic was clearly explored; add brief evidence when true.
- Keywords: 5–12 short tokens relevant to the call.
- Action items: specific follow-ups mentioned or implied (owner, deadline if stated).
- whatWentWell: 2–5 short bullets the rep did well (specific behaviors, not generic praise).
- whatWentWrong: 2–5 short bullets to improve (missed steps, weak areas, risks) — constructive tone.`;

  const completion = await client.chat.completions.create({
    model: analysisChatModel(),
    temperature: 0.2,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No analysis content from model");
  }

  const parsed = JSON.parse(content) as Partial<{
    overallSentiment: SentimentLabel;
    talkTimeAgentPct: number;
    talkTimeCustomerPct: number;
    scores: Record<string, number> & Partial<PerformanceScores>;
    keywords: string[];
    actionItems: string[];
    whatWentWell: string[];
    whatWentWrong: string[];
    discovery: DiscoveryChecklistItem[];
    segments: {
      startSec: number;
      endSec: number;
      speaker: string;
      text: string;
      sentiment: string;
    }[];
  }>;

  const sentiments: SentimentLabel[] = ["positive", "neutral", "negative"];
  const normSentiment = (s: string | undefined): SentimentLabel =>
    sentiments.includes(s as SentimentLabel) ? (s as SentimentLabel) : "neutral";

  const normSpeaker = (s: string | undefined): Speaker =>
    s === "customer" ? "customer" : "agent";

  const rawScores = (parsed.scores ?? {}) as Record<string, number>;
  const pick = (k: keyof PerformanceScores, ...aliases: string[]) => {
    if (typeof rawScores[k] === "number") return rawScores[k];
    for (const a of aliases) {
      if (typeof rawScores[a] === "number") return rawScores[a];
    }
    return NaN;
  };

  const scores: PerformanceScores = {
    clarity: clampScore1to10(
      pick("clarity", "communicationClarity", "communication_clarity"),
    ),
    politeness: clampScore1to10(pick("politeness")),
    knowledge: clampScore1to10(
      pick("knowledge", "businessKnowledge", "business_knowledge"),
    ),
    problemHandling: clampScore1to10(
      pick("problemHandling", "problem_handling"),
    ),
    listening: clampScore1to10(
      pick("listening", "listeningAbility", "listening_ability"),
    ),
  };

  let segments: TranscriptSegment[] = (parsed.segments ?? []).map((s, i) => ({
    id: `seg-${i + 1}`,
    startSec: Number(s.startSec) || 0,
    endSec: Number(s.endSec) || 0,
    speaker: normSpeaker(s.speaker),
    text: String(s.text ?? ""),
    sentiment: normSentiment(s.sentiment),
  }));

  if (segments.length === 0) {
    segments = [
      {
        id: "seg-1",
        startSec: 0,
        endSec: 0.1,
        speaker: "agent",
        text: transcript,
        sentiment: normSentiment(parsed.overallSentiment),
      },
    ];
  }

  const agentPct = Math.round(Number(parsed.talkTimeAgentPct) || 50);
  const customerPct = Math.round(Number(parsed.talkTimeCustomerPct) || 50);

  return {
    transcript,
    segments,
    sentiment: normSentiment(parsed.overallSentiment),
    talkTime: {
      agentPct: Math.min(100, Math.max(0, agentPct)),
      customerPct: Math.min(100, Math.max(0, customerPct)),
    },
    scores,
    discovery: normalizeDiscovery(parsed.discovery),
    keywords: (parsed.keywords ?? []).map((k) => String(k).trim()).filter(Boolean),
    actionItems: (parsed.actionItems ?? [])
      .map((a) => String(a).trim())
      .filter(Boolean),
    whatWentWell: (parsed.whatWentWell ?? [])
      .map((a) => String(a).trim())
      .filter(Boolean),
    whatWentWrong: (parsed.whatWentWrong ?? [])
      .map((a) => String(a).trim())
      .filter(Boolean),
  };
}
