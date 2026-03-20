import { HACKATHON_SAMPLE_FILES } from "./hackathon-sample-manifest";
import { HACKATHON_DISCOVERY_TOPICS } from "./discovery-constants";
import { sampleDialogueSegments } from "./hackathon-sample-dialogue";
import { loadDurationOverrides } from "./sample-audio-durations";
import type {
  CallRecord,
  DiscoveryChecklistItem,
  PerformanceScores,
  SentimentLabel,
} from "./types";

/** Used only when JSON + on-disk probe are unavailable (e.g. fresh clone before sync). */
const DURATION_FALLBACK: Record<string, number> = {
  "call-1.mp3": 120,
  "call-2.wav": 120,
  "call-3.wav": 120,
  "call-4.wav": 120,
  "call-5.wav": 120,
  "call-6.wav": 120,
  "call-7.mp3": 120,
};

const SENTIMENT_ROTATION: SentimentLabel[] = [
  "positive",
  "neutral",
  "negative",
  "positive",
  "neutral",
  "positive",
  "negative",
];

function scoreSet(i: number): PerformanceScores {
  const bases = [8.2, 7.1, 6.8, 8.6, 7.4, 8.0, 7.7];
  const jitter = [0, 0.3, -0.2, 0.5, 0.1, -0.1, 0.2];
  const b = bases[i % bases.length] + (jitter[i % jitter.length] ?? 0);
  return {
    clarity: Math.min(10, b + 0.2),
    politeness: Math.min(10, b + 0.6),
    knowledge: Math.min(10, b - 0.3),
    problemHandling: Math.min(10, b + 0.1),
    listening: Math.min(10, b + 0.4),
  };
}

function discoveryForIndex(i: number): DiscoveryChecklistItem[] {
  const [t0, t1, t2, t3] = HACKATHON_DISCOVERY_TOPICS;
  return [
    { topic: t0, asked: i % 2 === 0, evidence: i % 2 === 0 ? "Discussed budget range" : undefined },
    { topic: t1, asked: i % 3 === 0, evidence: i % 3 === 0 ? "Other brands mentioned" : undefined },
    { topic: t2, asked: true, evidence: "Layout / space discussed" },
    { topic: t3, asked: i > 2, evidence: i > 2 ? "Door style / finish" : undefined },
  ];
}

function buildHackathonMocks(): CallRecord[] {
  const overrides = loadDurationOverrides();
  const now = Date.now();

  return HACKATHON_SAMPLE_FILES.map((meta, i) => {
    const durationSec =
      overrides[meta.publicName] ??
      DURATION_FALLBACK[meta.publicName] ??
      120;
    const segments = sampleDialogueSegments(meta.id, durationSec);
    const sentiment = SENTIMENT_ROTATION[i % SENTIMENT_ROTATION.length];
    const agentPct = 48 + (i * 3) % 20;

    return {
      id: meta.id,
      title: `${meta.title} · Hackathon 2026 sample`,
      createdAt: new Date(now - (7 - i) * 60 * 60 * 1000).toISOString(),
      durationSec,
      audioUrl: `/call-recordings/${meta.publicName}`,
      transcript: "",
      segments,
      sentiment,
      talkTime: {
        agentPct,
        customerPct: 100 - agentPct,
      },
      scores: scoreSet(i),
      discovery: discoveryForIndex(i),
      keywords: [
        meta.title.toLowerCase().replace(/\s/g, ""),
        "sales",
        "discovery",
        "pipeline",
      ],
      actionItems: [
        "Demo sample: dialogue is scripted for the timeline; upload your own file for Whisper + full analysis.",
        "Compare talk-time and discovery coverage across Call 1–7 for the judging narrative.",
      ],
    };
  });
}

export const MOCK_CALLS: CallRecord[] = buildHackathonMocks();

MOCK_CALLS.forEach((c) => {
  if (!c.transcript) {
    c.transcript = c.segments.map((s) => s.text).join(" ");
  }
});
