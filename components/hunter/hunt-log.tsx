"use client"

import { useEffect, useRef } from "react"
import type { HuntLogLine } from "@/lib/hunter"
import { cn } from "@/lib/utils"

export function HuntLog({ lines }: { lines: HuntLogLine[] }) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [lines])

  return (
    <div className="flex h-full min-h-44 flex-col rounded-xl border border-white/10 bg-black/50">
      <div className="flex items-center justify-between border-b border-white/8 px-3 py-2">
        <p className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
          Hunter / log
        </p>
        <p className="font-mono text-[10px] text-hunt/70">own-ads only</p>
      </div>
      <div className="flex-1 space-y-1 overflow-auto p-3 font-mono text-[11px] leading-5">
        {lines.length === 0 ? (
          <p className="text-white/35">
            Awaiting hunt. Run Hunter to classify every query × geo cell.
          </p>
        ) : (
          lines.map((line, i) => (
            <p
              key={`${line.t}-${i}`}
              className={cn(
                "animate-rise",
                line.level === "lane" && "text-foreground",
                line.level === "queue" && "text-hunt/90",
                line.level === "gate" && "text-protect",
                line.level === "rank" && "text-muted-foreground",
                line.level === "scan" && "text-white/45"
              )}
            >
              <span className="mr-2 text-white/30">{line.t}</span>
              <span className="mr-2 uppercase">{line.level}</span>
              {line.text}
            </p>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  )
}
