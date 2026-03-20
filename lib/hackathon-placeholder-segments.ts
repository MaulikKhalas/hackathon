import { isSeededSampleCallId } from "./hackathon-sample-manifest";
import type { CallRecord } from "./types";

/**
 * True for legacy persisted rows that still contain the old bracketed placeholder copy.
 * New seeded calls use `sampleDialogueSegments` instead.
 */
export function isHackathonPlaceholderCall(call: CallRecord): boolean {
  return (
    isSeededSampleCallId(call.id) &&
    call.segments.some((s) => s.text.includes("(Placeholder"))
  );
}
