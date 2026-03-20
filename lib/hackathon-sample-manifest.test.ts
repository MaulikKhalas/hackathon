import { describe, expect, it } from "vitest";
import {
  HACKATHON_SAMPLE_FILES,
  isSeededSampleCallId,
  resolveCanonicalCallDetailId,
} from "./hackathon-sample-manifest";

describe("hackathon-sample-manifest", () => {
  it("resolves legacy slugs to canonical UUIDs", () => {
    expect(resolveCanonicalCallDetailId("hackathon-call-1")).toBe(
      HACKATHON_SAMPLE_FILES[0].id,
    );
  });

  it("passes through unknown ids", () => {
    expect(resolveCanonicalCallDetailId("custom-uuid")).toBe("custom-uuid");
  });

  it("detects seeded sample ids", () => {
    expect(isSeededSampleCallId(HACKATHON_SAMPLE_FILES[0].id)).toBe(true);
    expect(isSeededSampleCallId("not-a-sample-id")).toBe(false);
  });
});
