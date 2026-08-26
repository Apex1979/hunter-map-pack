"use client"

import { LANE_COPY } from "@/lib/hunter"

export function RuleStrip() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-white/8 bg-black/25 px-4 py-2 text-[11px] tracking-wide text-muted-foreground uppercase sm:px-6">
      <span>
        <span className="text-build">Rank null</span> → missing → BUILD · ads blocked
      </span>
      <span className="hidden text-white/20 sm:inline">/</span>
      <span>
        <span className="text-steal">Rank 4+</span> → STEAL · ads blocked + GBP draft
      </span>
      <span className="hidden text-white/20 sm:inline">/</span>
      <span>
        <span className="text-protect">Rank 1–3</span> → PROTECT · keep bidding + freshness
      </span>
      <span className="hidden text-white/20 lg:inline">/</span>
      <span className="hidden lg:inline">Human tap before anything is posted</span>
      <span className="hidden text-white/20 lg:inline">/</span>
      <span className="hidden lg:inline">Does not block other companies’ ads</span>
    </div>
  )
}

export function LaneLegend() {
  return (
    <p className="sr-only">
      {LANE_COPY.build.rankRule}. {LANE_COPY.steal.rankRule}. {LANE_COPY.protect.rankRule}.
    </p>
  )
}
