"use client"

import { Check, X } from "lucide-react"
import type { Approval, Cell, Market } from "@/lib/hunter"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AuctionRail, SerpPack } from "./evidence"

export function GbpPreview({ cell }: { cell: Cell }) {
  const draft = cell.gbpDraft
  if (!draft) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 p-4 text-[13px] text-white/45">
        No GBP post on BUILD. Presence is the work — ads stay blocked until the listing exists.
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#101211]">
      <div className="flex items-center gap-2 border-b border-white/8 px-3 py-2">
        <div className="size-8 rounded-full bg-hunt/20 font-display text-sm leading-8 text-center text-hunt">
          G
        </div>
        <div>
          <p className="text-[13px] font-medium">Google Business Profile</p>
          <p className="font-mono text-[10px] text-white/40">DRAFT · will not post until Approve</p>
        </div>
      </div>
      <div className="aspect-[16/9] bg-gradient-to-br from-white/10 to-black/40 px-3 py-8 text-center">
        <p className="font-mono text-[10px] tracking-[0.2em] text-white/40 uppercase">{draft.photoLabel}</p>
        <p className="mt-2 font-display text-2xl text-white/90">{draft.headline}</p>
      </div>
      <div className="space-y-2 p-3">
        <p className="text-[13px] leading-5 text-white/80">{draft.body}</p>
        <p className="inline-flex rounded-full bg-hunt px-3 py-1 text-[11px] font-semibold text-black">
          {draft.cta}
        </p>
      </div>
    </div>
  )
}

export function ApprovalsDock({
  approvals,
  selectedId,
  cells,
  market,
  onSelect,
  onApprove,
  onReject,
  locked,
}: {
  approvals: Approval[]
  selectedId: string | null
  cells: Cell[]
  market: Market
  onSelect: (id: string) => void
  onApprove: () => void
  onReject: () => void
  locked: boolean
}) {
  const pending = approvals.filter((a) => a.status === "pending")
  const selected = approvals.find((a) => a.id === selectedId) ?? pending[0] ?? null
  const cell = selected ? cells.find((c) => c.id === selected.cellId) : undefined

  return (
    <section className="grid min-h-0 gap-3 border-t border-white/10 bg-black/40 p-3 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)_minmax(0,1.1fr)] lg:p-4">
      <div className="flex min-h-0 flex-col">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold tracking-[0.18em] uppercase">Approvals</h2>
          <span className="font-mono text-[11px] text-hunt">{pending.length} pending</span>
        </div>
        <div className="min-h-0 flex-1 space-y-1 overflow-auto">
          {approvals.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-[12px] text-white/40">
              Queue is empty until a hunt lands.
            </p>
          ) : (
            approvals.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onSelect(a.id)}
                className={cn(
                  "w-full rounded-lg border px-2.5 py-2 text-left",
                  a.id === selected?.id ? "border-hunt/50 bg-hunt/8" : "border-white/8 bg-white/3",
                  a.status !== "pending" && "opacity-50"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "font-mono text-[10px] uppercase",
                      a.lane === "build" && "text-build",
                      a.lane === "steal" && "text-steal",
                      a.lane === "protect" && "text-protect"
                    )}
                  >
                    {a.lane} · {a.kind === "pause_ads" ? "ads" : "gbp"}
                  </span>
                  <span className="font-mono text-[10px] text-white/40">{a.status}</span>
                </div>
                <p className="mt-0.5 truncate text-[12px]">{a.title}</p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="min-h-0 space-y-3 overflow-auto">
        {cell && selected ? (
          <>
            {selected.kind === "gbp_draft" ? (
              <GbpPreview cell={cell} />
            ) : (
              <AuctionRail cell={cell} market={market} />
            )}
            <p className="text-[12px] leading-5 text-white/55">{selected.summary}</p>
            <p className="font-mono text-[11px] text-white/35">
              {locked
                ? "Hunt still running. Approvals unlock when the grid is armed."
                : "Human gate: nothing is posted, paused, or kept without a tap."}
            </p>
          </>
        ) : (
          <p className="text-[13px] text-white/40">Select a queued action.</p>
        )}
      </div>

      <div className="flex min-h-0 flex-col gap-3">
        {cell ? <SerpPack cell={cell} brand={market.brand} /> : null}
        <div className="mt-auto flex gap-2">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            disabled={locked || !selected || selected.status !== "pending"}
            onClick={onReject}
          >
            <X className="size-4" />
            Reject
          </Button>
          <Button
            size="lg"
            className="flex-1 bg-hunt text-black hover:bg-hunt/90"
            disabled={locked || !selected || selected.status !== "pending"}
            onClick={onApprove}
          >
            <Check className="size-4" />
            Approve
          </Button>
        </div>
        <p className="text-center font-mono text-[10px] text-white/35">
          A approve · X reject · J/K next · R hunt
        </p>
      </div>
    </section>
  )
}
