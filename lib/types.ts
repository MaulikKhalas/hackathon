export type SentimentLabel = "positive" | "neutral" | "negative";

export type Speaker = "agent" | "customer";

export interface TranscriptSegment {
  id: string;
  startSec: number;
  endSec: number;
  speaker: Speaker;
  text: string;
  sentiment: SentimentLabel;
}

export interface DiscoveryChecklistItem {
  topic: string;
  asked: boolean;
  evidence?: string;
}

export interface PerformanceScores {
  clarity: number;
  politeness: number;
  knowledge: number;
  problemHandling: number;
  listening: number;
}

/** User uploads only: `failed` = persisted for dashboard; no detail page. */
export type IngestStatus = "complete" | "failed";

export interface CallRecord {
  id: string;
  title: string;
  createdAt: string;
  durationSec: number;
  audioUrl: string;
  transcript: string;
  segments: TranscriptSegment[];
  sentiment: SentimentLabel;
  talkTime: {
    agentPct: number;
    customerPct: number;
  };
  scores: PerformanceScores;
  discovery: DiscoveryChecklistItem[];
  keywords: string[];
  actionItems: string[];
  /** AI bullets — strengths (new ingests); older rows fall back to heuristics in UI. */
  whatWentWell?: string[];
  /** AI bullets — coaching / risks (new ingests). */
  whatWentWrong?: string[];
  ingestStatus?: IngestStatus;
  failureReason?: string;
}

export interface DashboardAggregate {
  totalCalls: number;
  sentimentSplit: Record<SentimentLabel, number>;
  avgOverallScore: number;
  topKeywords: { word: string; count: number }[];
  totalActionItems: number;
}
