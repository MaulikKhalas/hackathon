import type { SentimentLabel, Speaker, TranscriptSegment } from "./types";

type DialogueLine = {
  text: string;
  speaker: Speaker;
  sentiment: SentimentLabel;
};

/**
 * Demo multi-turn dialogue for seeded hackathon samples (not ASR output).
 * Timestamps are spread evenly across the real file duration from `sample-audio-meta`.
 */
const SAMPLE_DIALOGUES: Record<string, DialogueLine[]> = {
  "baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001": [
    {
      text: "Hi Michael, thanks for taking the time today — how are you?",
      speaker: "agent",
      sentiment: "neutral",
    },
    {
      text: "I'm good, thanks. We've been thinking about updating the kitchen before the holidays.",
      speaker: "customer",
      sentiment: "positive",
    },
    {
      text: "That makes sense. Walk me through how you use the space day to day.",
      speaker: "agent",
      sentiment: "neutral",
    },
    {
      text: "It's tight when both of us cook, and the cabinets don't close right anymore.",
      speaker: "customer",
      sentiment: "negative",
    },
    {
      text: "Got it. Have you looked at any other companies or showrooms so far?",
      speaker: "agent",
      sentiment: "neutral",
    },
    {
      text: "We visited one competitor last month — pricing felt unclear.",
      speaker: "customer",
      sentiment: "neutral",
    },
    {
      text: "I'll outline a budget range and next steps on our side. Does Thursday work for a follow-up?",
      speaker: "agent",
      sentiment: "positive",
    },
    {
      text: "Thursday works. Send me the summary and we'll compare options.",
      speaker: "customer",
      sentiment: "positive",
    },
  ],
  "baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0002": [
    {
      text: "Morning Sarah — it's Alex from the design team. How's your week going?",
      speaker: "agent",
      sentiment: "neutral",
    },
    {
      text: "Pretty busy, but we're serious about the remodel. The sink area drives me crazy.",
      speaker: "customer",
      sentiment: "neutral",
    },
    {
      text: "Let's quantify scope: are we talking cabinets only or layout changes too?",
      speaker: "agent",
      sentiment: "neutral",
    },
    {
      text: "We'd love to move the island if the budget allows.",
      speaker: "customer",
      sentiment: "positive",
    },
    {
      text: "Rough ballpark for where you'd like to land on budget?",
      speaker: "agent",
      sentiment: "neutral",
    },
    {
      text: "We're hoping under forty, but I need transparency on where costs spike.",
      speaker: "customer",
      sentiment: "negative",
    },
    {
      text: "I'll break that down line by line. I'll also send door style samples you mentioned.",
      speaker: "agent",
      sentiment: "positive",
    },
  ],
  "baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0003": [
    {
      text: "Thanks for hopping on — I saw you requested info on quartz vs laminate.",
      speaker: "agent",
      sentiment: "neutral",
    },
    {
      text: "Yes. I'm worried quartz will blow the budget.",
      speaker: "customer",
      sentiment: "negative",
    },
    {
      text: "There are tiers. We can mix surfaces — premium on the island, savings on perimeter.",
      speaker: "agent",
      sentiment: "positive",
    },
    {
      text: "Okay, that could work. What about lead times?",
      speaker: "customer",
      sentiment: "neutral",
    },
    {
      text: "Right now we're quoting eight to ten weeks for install after sign-off.",
      speaker: "agent",
      sentiment: "neutral",
    },
    {
      text: "That's longer than I hoped.",
      speaker: "customer",
      sentiment: "negative",
    },
    {
      text: "If we lock scope this week, we can hold a slot. I'll email a timeline graphic.",
      speaker: "agent",
      sentiment: "neutral",
    },
  ],
  "baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0004": [
    {
      text: "Hi James — quick intro: I'm helping you compare cabinet lines. Sound good?",
      speaker: "agent",
      sentiment: "neutral",
    },
    {
      text: "Sure. We're leaning traditional but not too ornate.",
      speaker: "customer",
      sentiment: "neutral",
    },
    {
      text: "Perfect. Any brands you've already ruled out?",
      speaker: "agent",
      sentiment: "neutral",
    },
    {
      text: "One big-box quote felt cheap on the hinges.",
      speaker: "customer",
      sentiment: "negative",
    },
    {
      text: "We use soft-close hardware standard — I'll show you the spec sheet.",
      speaker: "agent",
      sentiment: "positive",
    },
    {
      text: "What about competitors at your price point?",
      speaker: "customer",
      sentiment: "neutral",
    },
    {
      text: "I'll send a side-by-side. Our differentiator is install warranty and project manager.",
      speaker: "agent",
      sentiment: "positive",
    },
  ],
  "baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0005": [
    {
      text: "Hey Priya — thanks for the photos you emailed. The galley is narrow.",
      speaker: "agent",
      sentiment: "neutral",
    },
    {
      text: "Exactly. We need storage without feeling boxed in.",
      speaker: "customer",
      sentiment: "neutral",
    },
    {
      text: "Tall pantry on one end and shallow uppers can help. Want to see a sketch?",
      speaker: "agent",
      sentiment: "positive",
    },
    {
      text: "Yes. Also, how do you handle dust during demo?",
      speaker: "customer",
      sentiment: "neutral",
    },
    {
      text: "Plastic barriers, HEPA, daily cleanup — it's in our project checklist.",
      speaker: "agent",
      sentiment: "neutral",
    },
    {
      text: "Good. Last contractor left a mess.",
      speaker: "customer",
      sentiment: "negative",
    },
    {
      text: "I'll share references from similar condo jobs. Next call we pick finishes?",
      speaker: "agent",
      sentiment: "positive",
    },
  ],
  "baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0006": [
    {
      text: "Hi — I'm calling back about the deposit structure you mentioned.",
      speaker: "customer",
      sentiment: "neutral",
    },
    {
      text: "Absolutely. We split fifty at sign, forty at cabinet order, ten at completion.",
      speaker: "agent",
      sentiment: "neutral",
    },
    {
      text: "Is the cabinet order date firm once we sign?",
      speaker: "customer",
      sentiment: "neutral",
    },
    {
      text: "We only release after your written approval of shop drawings.",
      speaker: "agent",
      sentiment: "positive",
    },
    {
      text: "What if we need to change mid-flight?",
      speaker: "customer",
      sentiment: "negative",
    },
    {
      text: "Changes are documented with cost and schedule impact — no surprises.",
      speaker: "agent",
      sentiment: "neutral",
    },
    {
      text: "Okay. Send the contract and I'll review with my partner tonight.",
      speaker: "customer",
      sentiment: "positive",
    },
  ],
  "baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0007": [
    {
      text: "Hi Linda — how are you doing today?",
      speaker: "agent",
      sentiment: "neutral",
    },
    {
      text: "I'm good, thanks. We finally cleared space to talk about the kitchen.",
      speaker: "customer",
      sentiment: "positive",
    },
    {
      text: "Love to hear that. What prompted the timing?",
      speaker: "agent",
      sentiment: "neutral",
    },
    {
      text: "Kids are older; we're hosting Thanksgiving this year.",
      speaker: "customer",
      sentiment: "positive",
    },
    {
      text: "Nice. Let's capture must-haves vs nice-to-haves so we can prioritize.",
      speaker: "agent",
      sentiment: "neutral",
    },
    {
      text: "Must-have is a bigger fridge wall; nice-to-have is the wine fridge.",
      speaker: "customer",
      sentiment: "neutral",
    },
    {
      text: "I'll fold that into the first design pass. Same time next week to review?",
      speaker: "agent",
      sentiment: "positive",
    },
    {
      text: "Works for us. Looking forward to it.",
      speaker: "customer",
      sentiment: "positive",
    },
  ],
};

function spreadAcrossDuration(
  lines: DialogueLine[],
  durationSec: number,
  sampleId: string,
): TranscriptSegment[] {
  const n = lines.length;
  if (n === 0) return [];
  const dur = Math.max(1, durationSec);
  return lines.map((line, i) => {
    const startSec = Math.round((i / n) * dur * 10) / 10;
    const endSec =
      i === n - 1 ? dur : Math.round(((i + 1) / n) * dur * 10) / 10;
    return {
      id: `${sampleId}-seg-${i + 1}`,
      startSec,
      endSec,
      speaker: line.speaker,
      text: line.text,
      sentiment: line.sentiment,
    };
  });
}

/**
 * Scripted conversation lines for hackathon seed calls — shown in timeline UI.
 * Timestamps align to the sample file length (evenly spaced).
 */
export function sampleDialogueSegments(
  sampleId: string,
  durationSec: number,
): TranscriptSegment[] {
  const lines = SAMPLE_DIALOGUES[sampleId];
  if (!lines?.length) return [];
  return spreadAcrossDuration(lines, durationSec, sampleId);
}
