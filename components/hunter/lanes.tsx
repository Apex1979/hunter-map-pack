"use client"

import { Hammer, Crosshair, Shield, Pause, Megaphone } from "lucide-react"
import { LANE_COPY, rankLabel, type Cell, type Lane } from "@/lib/hunter"
import { hoursLabel, usd } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const ICONS = {
  build: Hammer,
  steal: Crosshair,
  protect: Shield,
}

export function CellCard({
  cell,
  selected,
  onSelect,
}: {
  cell: Cell
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "lane-card animate-rise w-full rounded-xl border bg-black/30 p-3 text-left transition-colors",
        "border-white/10 hover:border-white/20",
        selected && "border-hunt/60 ring-1 ring-hunt/40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium tracking-tight">{cell.neighborhood}</p>
          <p className="font-mono text-[11px] text-muted-foreground">“{cell.query}”</p>
        </div>
        <span
          className={cn(
            "rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold",
            cell.lane === "build" && "bg-build/15 text-build",
            cell.lane === "steal" && "bg-steal/15 text-steal",
            cell.lane === "protect" && "bg-protect/15 text-protect"
          )}
        >
          {rankLabel(cell.rank)}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {cell.adMutation.action === "pause" ? (
          <Badge variant="outline" className="border-white/10 text-[10px] text-muted-foreground">
            <Pause className="size-3" />
            ads blocked
          </Badge>
        ) : (
          <Badge variant="outline" className="border-protect/30 text-[10px] text-protect">
            keep bidding
          </Badge>
        )}
        {cell.gbpDraft ? (
          <Badge variant="outline" className="border-white/10 text-[10px] text-muted-foreground">
            <Megaphone className="size-3" />
            GBP draft
          </Badge>
        ) : null}
      </div>
      <p className="mt-2 font-mono text-[11px] text-white/45">
        {cell.lane === "protect"
          ? hoursLabel(cell.freshnessHours)
          : `${usd(cell.spendAtRiskUsd)}/day at risk`}
      </p>
    </button>
  )
}

export function LaneColumn({
  lane,
  cells,
  selectedId,
  onSelect,
}: {
  lane: Lane
  cells: Cell[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const meta = LANE_COPY[lane]
  const Icon = ICONS[lane]
  return (
    <section className={cn("flex min-h-0 flex-col rounded-2xl border border-white/10 bg-black/25", `lane-${lane}`)}>
      <header className="border-b border-white/8 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon className="size-4" style={{ color: "var(--lane)" }} />
            <h2 className="text-sm font-semibold tracking-wide uppercase">{meta.label}</h2>
          </div>
          <span className="font-mono text-xs" style={{ color: "var(--lane)" }}>
            {cells.length}
          </span>
        </div>
        <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{meta.rankRule}</p>
        <p className="mt-0.5 text-[11px] leading-4 text-white/55">{meta.action}</p>
      </header>
      <div className="flex max-h-[min(520px,70vh)] flex-1 flex-col space-y-2 overflow-auto p-3">
        {cells.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 px-3 py-8 text-center text-[12px] text-white/40">
            {meta.verb}
          </div>
        ) : (
          cells.map((cell) => (
            <CellCard
              key={cell.id}
              cell={cell}
              selected={selectedId === cell.id}
              onSelect={() => onSelect(cell.id)}
            />
          ))
        )}
      </div>
    </section>
  )
}

export function LaneBoard({
  cells,
  selectedId,
  onSelect,
}: {
  cells: Cell[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const build = cells.filter((c) => c.lane === "build")
  const steal = cells.filter((c) => c.lane === "steal")
  const protect = cells.filter((c) => c.lane === "protect")

  return (
    <>
      <div className="hidden min-h-0 flex-1 gap-3 lg:grid lg:grid-cols-3">
        <LaneColumn lane="build" cells={build} selectedId={selectedId} onSelect={onSelect} />
        <LaneColumn lane="steal" cells={steal} selectedId={selectedId} onSelect={onSelect} />
        <LaneColumn lane="protect" cells={protect} selectedId={selectedId} onSelect={onSelect} />
      </div>
      <div className="lg:hidden">
        <Tabs defaultValue="steal">
          <TabsList className="w-full">
            <TabsTrigger value="build">Build {build.length}</TabsTrigger>
            <TabsTrigger value="steal">Steal {steal.length}</TabsTrigger>
            <TabsTrigger value="protect">Protect {protect.length}</TabsTrigger>
          </TabsList>
          <TabsContent value="build">
            <LaneColumn lane="build" cells={build} selectedId={selectedId} onSelect={onSelect} />
          </TabsContent>
          <TabsContent value="steal">
            <LaneColumn lane="steal" cells={steal} selectedId={selectedId} onSelect={onSelect} />
          </TabsContent>
          <TabsContent value="protect">
            <LaneColumn lane="protect" cells={protect} selectedId={selectedId} onSelect={onSelect} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
