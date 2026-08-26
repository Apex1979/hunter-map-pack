"use client"

import { Lock, Pause, Radio } from "lucide-react"
import type { Cell, Market } from "@/lib/hunter"
import { usd } from "@/lib/format"
import { cn } from "@/lib/utils"

export function SerpPack({ cell, brand }: { cell: Cell; brand: string }) {
  const shown = cell.pack.filter((p) => p.rank <= 3)
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d0f0e] p-3">
      <p className="font-mono text-[10px] tracking-[0.18em] text-white/40 uppercase">
        Local pack · {cell.neighborhood}
      </p>
      <p className="mt-1 text-sm text-hunt/90">
        {cell.query} <span className="text-white/35">near {cell.neighborhood}</span>
      </p>
      <ol className="mt-3 space-y-2">
        {shown.map((p) => (
          <li
            key={`${p.rank}-${p.name}`}
            className={cn(
              "flex items-start justify-between rounded-lg border px-2.5 py-2",
              p.isUs ? "border-hunt/40 bg-hunt/8" : "border-white/8 bg-white/3"
            )}
          >
            <div>
              <p className="text-[13px] font-medium">
                {p.rank}. {p.name}
                {p.isUs ? <span className="ml-2 font-mono text-[10px] text-hunt">US</span> : null}
              </p>
              <p className="font-mono text-[11px] text-white/45">
                {p.rating.toFixed(1)} ★ · {p.reviews} reviews
              </p>
            </div>
          </li>
        ))}
      </ol>
      {cell.rank === null || (cell.rank !== null && cell.rank > 3) ? (
        <p className="mt-2 font-mono text-[11px] text-steal/80">
          {brand} is {cell.rank === null ? "missing" : `at #${cell.rank}`} — not in the three.
        </p>
      ) : null}
    </div>
  )
}

export function AuctionRail({ cell, market }: { cell: Cell; market: Market }) {
  const oursPaused = cell.adMutation.action === "pause"
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Lock className="size-3.5 text-hunt" />
        <p className="font-mono text-[10px] tracking-[0.18em] text-white/50 uppercase">
          Auction · {market.accountId}
        </p>
      </div>
      <div
        className={cn(
          "flex items-center justify-between rounded-lg border px-2.5 py-2",
          oursPaused ? "border-white/10 bg-white/4 opacity-60" : "border-protect/30 bg-protect/8"
        )}
      >
        <div>
          <p className="text-[13px] font-medium">{market.brand}</p>
          <p className="font-mono text-[11px] text-white/45">
            {oursPaused ? "OUR AD · BLOCKED" : "OUR AD · LIVE"} · {usd(cell.spendAtRiskUsd)}/day
          </p>
        </div>
        {oursPaused ? <Pause className="size-4 text-white/50" /> : <Radio className="size-4 text-protect" />}
      </div>
      <div className="mt-2 space-y-1.5">
        {cell.competitorAds.map((ad) => (
          <div
            key={ad.advertiserName}
            className="flex items-center justify-between rounded-lg border border-white/8 bg-white/3 px-2.5 py-2"
          >
            <div>
              <p className="text-[13px]">{ad.advertiserName}</p>
              <p className="font-mono text-[11px] text-white/40">THEIR AD · UNTOUCHED</p>
            </div>
            <span className="font-mono text-[10px] tracking-wider text-protect/80">LIVE</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] leading-4 text-white/40">
        Hunter only pauses {market.brand}. Competitor auctions are never touched.
      </p>
    </div>
  )
}
