import { isFailedIngest } from "./call-record-helpers";
import type { CallRecord, DashboardAggregate, SentimentLabel } from "./types";

function average(nums: number[]) {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function overallScore(scores: CallRecord["scores"]) {
  const vals = [
    scores.clarity,
    scores.politeness,
    scores.knowledge,
    scores.problemHandling,
    scores.listening,
  ];
  return average(vals);
}

export function buildDashboardAggregate(calls: CallRecord[]): DashboardAggregate {
  const sentimentSplit: Record<SentimentLabel, number> = {
    positive: 0,
    neutral: 0,
    negative: 0,
  };
  const keywordCounts = new Map<string, number>();
  let actionTotal = 0;

  const completed = calls.filter((c) => !isFailedIngest(c));

  for (const c of completed) {
    sentimentSplit[c.sentiment] += 1;
    actionTotal += c.actionItems.length;
    for (const w of c.keywords) {
      const key = w.toLowerCase();
      keywordCounts.set(key, (keywordCounts.get(key) ?? 0) + 1);
    }
  }

  const avgOverallScore =
    completed.length === 0
      ? 0
      : average(completed.map((c) => overallScore(c.scores)));

  const topKeywords = Array.from(keywordCounts.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    totalCalls: calls.length,
    sentimentSplit,
    avgOverallScore,
    topKeywords,
    totalActionItems: actionTotal,
  };
}
