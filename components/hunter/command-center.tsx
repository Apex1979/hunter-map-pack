"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Crosshair } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  MARKETS,
  marketById,
  runHunt,
  type Approval,
  type HuntLogLine,
  type HuntPhase,
  type HuntResult,
} from "@/lib/hunter"
import { clock, usd } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ApprovalsDock } from "./approvals"
import { HuntLog } from "./hunt-log"
import { LaneBoard } from "./lanes"
import { RuleStrip } from "./rule-strip"
import { ScanGrid } from "./scan-grid"

const DELAY_MS = 62

function stats(result: HuntResult | null, revealed: Set<string>) {
  const cells = result?.cells.filter((c) => revealed.has(c.id)) ?? []
  const spend = cells
    .filter((c) => c.adMutation.action === "pause")
    .reduce((n, c) => n + c.spendAtRiskUsd, 0)
  return {
    scanned: cells.length,
    build: cells.filter((c) => c.lane === "build").length,
    steal: cells.filter((c) => c.lane === "steal").length,
    protect: cells.filter((c) => c.lane === "protect").length,
    spend,
  }
}

export function CommandCenter() {
  const [marketId, setMarketId] = useState(MARKETS[0].id)
  const [phase, setPhase] = useState<HuntPhase>("idle")
  const [result, setResult] = useState<HuntResult | null>(null)
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null)
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null)
  const [log, setLog] = useState<HuntLogLine[]>([])
  const abortRef = useRef(0)

  const market = marketById(marketId)
  const live = stats(result, revealed)
  const visibleCells = useMemo(
    () => result?.cells.filter((c) => revealed.has(c.id)) ?? [],
    [result, revealed]
  )

  const pushLog = useCallback((line: Omit<HuntLogLine, "t">) => {
    setLog((prev) => [...prev.slice(-80), { ...line, t: clock(Date.now()) }])
  }, [])

  const run = useCallback(async () => {
    const token = ++abortRef.current
    const hunt = runHunt(marketId)
    setPhase("hunting")
    setResult(hunt)
    setApprovals(hunt.approvals.map((a) => ({ ...a, status: "pending" })))
    setRevealed(new Set())
    setSelectedCellId(null)
    setSelectedApprovalId(null)
    setLog([])
    pushLog({
      level: "scan",
      text: `${market.brand} · ${market.city} ${market.region} · ${market.vertical} · 25 cells`,
    })

    for (const cell of hunt.cells) {
      if (abortRef.current !== token) return
      await new Promise((r) => setTimeout(r, DELAY_MS))
      if (abortRef.current !== token) return
      setRevealed((prev) => new Set(prev).add(cell.id))
      pushLog({
        level: "scan",
        text: `${cell.neighborhood} · “${cell.query}”`,
      })
      pushLog({
        level: "rank",
        text: cell.rank === null ? "null — missing" : `rank ${cell.rank}`,
      })
      pushLog({
        level: "lane",
        text: `${cell.lane.toUpperCase()} · ${cell.adMutation.action === "pause" ? "ads blocked (ours)" : "keep bidding"}`,
      })
      if (cell.gbpDraft) {
        pushLog({ level: "queue", text: `GBP draft staged · ${cell.neighborhood}` })
      }
    }

    if (abortRef.current !== token) return
    const first = hunt.approvals[0]
    setSelectedApprovalId(first?.id ?? null)
    setSelectedCellId(first?.cellId ?? hunt.cells[0]?.id ?? null)
    setPhase("armed")
    pushLog({
      level: "gate",
      text: `${hunt.approvals.length} actions armed. Nothing posts until you tap Approve.`,
    })
  }, [market.brand, market.city, market.region, market.vertical, marketId, pushLog])

  const decide = useCallback(
    (status: "approved" | "rejected") => {
      if (phase !== "armed") return
      setApprovals((prev) => {
        const current =
          prev.find((a) => a.id === selectedApprovalId && a.status === "pending") ??
          prev.find((a) => a.status === "pending")
        if (!current) return prev
        const next = prev.map((a) => (a.id === current.id ? { ...a, status } : a))
        const upcoming = next.find((a) => a.status === "pending")
        setSelectedApprovalId(upcoming?.id ?? current.id)
        if (upcoming) setSelectedCellId(upcoming.cellId)
        pushLog({
          level: "gate",
          text:
            status === "approved"
              ? `APPROVED · ${current.title} · human tap recorded`
              : `REJECTED · ${current.title} · no post, no pause`,
        })
        return next
      })
    },
    [phase, pushLog, selectedApprovalId]
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return
      const key = e.key.toLowerCase()
      if (key === "r") {
        e.preventDefault()
        void run()
      }
      if (key === "a") {
        e.preventDefault()
        decide("approved")
      }
      if (key === "x") {
        e.preventDefault()
        decide("rejected")
      }
      if (key === "j" || key === "k") {
        e.preventDefault()
        const pending = approvals.filter((a) => a.status === "pending")
        if (pending.length === 0) return
        const idx = Math.max(
          0,
          pending.findIndex((a) => a.id === selectedApprovalId)
        )
        const next = pending[(idx + (key === "j" ? 1 : pending.length - 1)) % pending.length]
        setSelectedApprovalId(next.id)
        setSelectedCellId(next.cellId)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [approvals, decide, run, selectedApprovalId])

  const selectCell = (id: string) => {
    setSelectedCellId(id)
    const related = approvals.find((a) => a.cellId === id && a.status === "pending") ??
      approvals.find((a) => a.cellId === id)
    if (related) setSelectedApprovalId(related.id)
  }

  const selectApproval = (id: string) => {
    setSelectedApprovalId(id)
    const a = approvals.find((x) => x.id === id)
    if (a) setSelectedCellId(a.cellId)
  }

  return (
    <div className="relative flex min-h-dvh flex-col">
      <header className="flex flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-[0.28em] text-hunt uppercase">
            Map pack operator
          </p>
          <h1 className="font-display text-4xl leading-none tracking-tight sm:text-5xl">Hunter</h1>
          <p className="mt-1 max-w-xl text-[13px] text-white/55">
            {market.brand} · {market.city}, {market.region}. Classify the grid. Pause only our ads.
            Draft the GBP. You tap before anything is posted.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] tracking-widest text-white/40 uppercase">
              Market
            </span>
            <select
              value={marketId}
              disabled={phase === "hunting"}
              onChange={(e) => {
                abortRef.current += 1
                setMarketId(e.target.value)
                setPhase("idle")
                setResult(null)
                setApprovals([])
                setRevealed(new Set())
                setLog([])
                setSelectedCellId(null)
                setSelectedApprovalId(null)
              }}
              className="h-10 rounded-lg border border-white/12 bg-black/40 px-3 font-mono text-xs"
            >
              {MARKETS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.city} · {m.vertical} · {m.brand}
                </option>
              ))}
            </select>
          </label>
          <Button
            size="lg"
            onClick={() => void run()}
            disabled={phase === "hunting"}
            className={cn(
              "h-14 min-w-44 bg-hunt px-6 text-base font-semibold tracking-[0.18em] text-black uppercase hover:bg-hunt/90",
              phase !== "hunting" && "animate-hunt-pulse"
            )}
          >
            <Crosshair className="size-4" />
            {phase === "hunting" ? "Hunting" : phase === "armed" ? "Hunt again" : "Run Hunter"}
          </Button>
        </div>
      </header>

      <RuleStrip />

      <div className="grid gap-3 px-4 py-3 sm:px-6 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)_auto]">
        <ScanGrid
          cells={result?.cells ?? []}
          revealed={revealed}
          selectedId={selectedCellId}
          phase={phase}
          onSelect={selectCell}
        />
        <HuntLog lines={log} />
        <dl className="grid grid-cols-2 gap-2 lg:w-44 lg:grid-cols-1">
          <Stat label="Scanned" value={`${live.scanned}/25`} />
          <Stat label="Build" value={String(live.build)} tone="build" />
          <Stat label="Steal" value={String(live.steal)} tone="steal" />
          <Stat label="Protect" value={String(live.protect)} tone="protect" />
          <Stat label="Spend at risk" value={usd(live.spend)} />
        </dl>
      </div>

      <div className="flex min-h-[420px] flex-1 flex-col px-4 pb-3 sm:px-6">
        {phase === "idle" ? (
          <button
            type="button"
            onClick={() => void run()}
            className="flex min-h-[420px] flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-hunt/30 bg-black/25 px-6 text-center"
          >
            <p className="font-mono text-[11px] tracking-[0.28em] text-hunt uppercase">
              Idle · nothing scanned
            </p>
            <p className="mt-3 font-display text-3xl text-white">
              Click Run Hunter to classify the pack.
            </p>
            <p className="mt-2 max-w-md text-sm text-white/50">
              Empty columns are waiting on a hunt. Rank null → BUILD. Rank 4+ → STEAL.
              Rank 1–3 → PROTECT. Nothing posts until you Approve.
            </p>
            <span className="mt-6 inline-flex h-12 items-center rounded-lg bg-hunt px-6 text-sm font-semibold tracking-[0.18em] text-black uppercase">
              Run Hunter
            </span>
          </button>
        ) : (
          <LaneBoard cells={visibleCells} selectedId={selectedCellId} onSelect={selectCell} />
        )}
      </div>

      <ApprovalsDock
        approvals={approvals}
        selectedId={selectedApprovalId}
        cells={result?.cells ?? []}
        market={market}
        onSelect={selectApproval}
        onApprove={() => decide("approved")}
        onReject={() => decide("rejected")}
        locked={phase !== "armed"}
      />
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: "build" | "steal" | "protect"
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
      <dt className="font-mono text-[10px] tracking-widest text-white/40 uppercase">{label}</dt>
      <dd
        className={cn(
          "font-display text-2xl leading-none",
          tone === "build" && "text-build",
          tone === "steal" && "text-steal",
          tone === "protect" && "text-protect"
        )}
      >
        {value}
      </dd>
    </div>
  )
}
