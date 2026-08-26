"use client"

import { cn } from "@/lib/utils"
import { GRID_SIZE, rankLabel, type Cell, type HuntPhase } from "@/lib/hunter"

const laneFill: Record<string, string> = {
  build: "bg-build/20 text-build ring-build/40",
  steal: "bg-steal/20 text-steal ring-steal/40",
  protect: "bg-protect/20 text-protect ring-protect/40",
}

export function ScanGrid({
  cells,
  revealed,
  selectedId,
  phase,
  onSelect,
}: {
  cells: Cell[]
  revealed: Set<string>
  selectedId: string | null
  phase: HuntPhase
  onSelect: (id: string) => void
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/35 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
          Local pack grid
        </p>
        <p className="font-mono text-[10px] text-hunt/80">
          {phase === "hunting" ? "SCANNING" : phase === "armed" ? "ARMED" : "IDLE"}
        </p>
      </div>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
          const cell = cells[i]
          const on = cell ? revealed.has(cell.id) : false
          const selected = cell?.id === selectedId
          return (
            <button
              key={i}
              type="button"
              disabled={!on}
              onClick={() => cell && onSelect(cell.id)}
              className={cn(
                "aspect-square rounded-md border border-white/8 bg-white/3 font-mono text-[10px] leading-none transition-colors",
                on && cell && laneFill[cell.lane],
                on && "animate-grid-glow ring-1",
                selected && "ring-2 ring-hunt",
                !on && phase === "hunting" && "animate-pulse"
              )}
              title={cell ? `${cell.neighborhood} · ${rankLabel(cell.rank)}` : "Unscanned"}
            >
              {on && cell ? (cell.rank === null ? "—" : cell.rank) : ""}
            </button>
          )
        })}
      </div>
      <div className="mt-2 flex gap-3 font-mono text-[10px] text-muted-foreground">
        <span className="text-build">● BUILD</span>
        <span className="text-steal">● STEAL</span>
        <span className="text-protect">● PROTECT</span>
      </div>
    </div>
  )
}
