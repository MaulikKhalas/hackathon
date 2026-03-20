import type { DiscoveryChecklistItem } from "./types";

/** Hackathon-required discovery topics — analysis must use these exact `topic` strings. */
export const HACKATHON_DISCOVERY_TOPICS = [
  "Budget",
  "Competitors",
  "Kitchen size / scope",
  "Cabinet style",
] as const;

export function defaultHackathonDiscovery(): DiscoveryChecklistItem[] {
  return HACKATHON_DISCOVERY_TOPICS.map((topic) => ({
    topic,
    asked: false,
  }));
}
