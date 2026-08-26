import type { Lane, Rank } from "./types"

/**
 * Spec — rank is map-pack position for OUR listing on this query × geo.
 * null means the listing is missing from local results entirely.
 */
export function classifyLane(rank: Rank): Lane {
  if (rank === null) return "build"
  if (!Number.isInteger(rank) || rank < 1) {
    throw new Error(`Hunter received an invalid rank: ${String(rank)}`)
  }
  if (rank >= 4) return "steal"
  return "protect"
}

export function adsPolicy(lane: Lane): "blocked" | "bidding" {
  return lane === "protect" ? "bidding" : "blocked"
}

export function needsGbpDraft(lane: Lane): boolean {
  return lane === "steal" || lane === "protect"
}

export function rankLabel(rank: Rank): string {
  return rank === null ? "MISSING" : `#${rank}`
}

export const LANE_COPY: Record<
  Lane,
  { label: string; rankRule: string; action: string; verb: string }
> = {
  build: {
    label: "Build",
    rankRule: "Rank null — missing",
    action: "Ads blocked. No spend on a listing that is not in the pack.",
    verb: "Do not bid on a ghost.",
  },
  steal: {
    label: "Steal",
    rankRule: "Rank 4+",
    action: "Ads blocked. GBP draft queued to climb into the pack.",
    verb: "Stop paying. Take the pack.",
  },
  protect: {
    label: "Protect",
    rankRule: "Rank 1–3",
    action: "Keep bidding. Freshness draft queued — pack is ours until it isn’t.",
    verb: "Hold the pack. Stay fresh.",
  },
}
