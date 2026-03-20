import path from "node:path";

/** Project-relative paths (for UI copy — same targets as the disk helpers below). */
export const DATA_STORE_PATHS = {
  /** User-uploaded call records (JSON). Not used for seeded hackathon demos. */
  userMetadataJson: "data/user-calls.json",
  /** Uploaded / synced audio files; web URL prefix is `CALL_RECORDINGS_PUBLIC_PREFIX`. */
  audioDirectory: "public/call-recordings/",
} as const;

/** All call audio (hackathon copies + user uploads) lives here → served as `/call-recordings/...`. */
export const CALL_RECORDINGS_PUBLIC_PREFIX = "/call-recordings" as const;

export function callRecordingsDiskDir() {
  return path.join(process.cwd(), "public", "call-recordings");
}

/** Persisted metadata for user-uploaded analyses (not the 7 seeded mocks). */
export function userCallsDbPath() {
  return path.join(process.cwd(), "data", "user-calls.json");
}
