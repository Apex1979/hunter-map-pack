import { adsPolicy, classifyLane, needsGbpDraft } from "./classify"
import { marketById } from "./markets"
import type {
  AdMutation,
  Approval,
  Cell,
  CompetitorAd,
  GbpDraft,
  HuntResult,
  Market,
  PackOccupant,
  Rank,
} from "./types"

const GRID = 5

function fnv(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function pick<T>(seed: string, items: T[]): T {
  return items[fnv(seed) % items.length]
}

function range(seed: string, min: number, max: number): number {
  return min + (fnv(seed) % (max - min + 1))
}

function ratingFromSeed(seed: string, floor: number): number {
  return Math.round((floor + (fnv(seed) % 9) / 10) * 10) / 10
}

/**
 * Local-pack heatmap: we own the core, we are chasing the ring,
 * we are invisible in the outer suburbs.
 */
export function rankForCell(
  marketId: string,
  row: number,
  col: number
): Rank {
  const center = (GRID - 1) / 2
  const dist = Math.max(Math.abs(row - center), Math.abs(col - center))
  const n = fnv(`${marketId}:${row}:${col}:rank`)

  if (dist === 0) return (n % 2) + 1
  if (dist === 1) {
    if (n % 10 === 0) return 4
    return (n % 3) + 1
  }
  if (dist === 2) {
    if (n % 5 === 0) return null
    if (n % 3 === 0) return (n % 3) + 1
    return 4 + (n % 5)
  }
  if (n % 2 === 0) return null
  return 5 + (n % 6)
}

function buildPack(
  market: Market,
  rank: Rank,
  cellId: string
): PackOccupant[] {
  const others = market.competitors.map((name, i) => ({
    name,
    isUs: false,
    rank: 0,
    rating: ratingFromSeed(`${cellId}:${name}`, 4.1),
    reviews: 40 + ((fnv(`${cellId}:${name}:rev`) % 380) | 0),
    order: fnv(`${cellId}:ord:${i}`),
  }))
  others.sort((a, b) => a.order - b.order)

  if (rank === null) {
    return others.slice(0, 3).map((c, i) => ({
      name: c.name,
      isUs: false,
      rank: i + 1,
      rating: c.rating,
      reviews: c.reviews,
    }))
  }

  const pack: PackOccupant[] = []
  let cursor = 0
  for (let r = 1; r <= Math.max(3, rank); r++) {
    if (r === rank) {
      pack.push({
        name: market.brand,
        isUs: true,
        rank: r,
        rating: market.rating,
        reviews: market.reviews,
      })
    } else {
      const c = others[cursor % others.length]
      cursor++
      pack.push({
        name: c.name,
        isUs: false,
        rank: r,
        rating: c.rating,
        reviews: c.reviews,
      })
    }
  }
  return pack.filter((p) => p.rank <= 3 || p.isUs)
}

function stealDraft(market: Market, neighborhood: string, query: string): GbpDraft {
  const bodies = [
    `${market.brand} crew is in ${neighborhood} today for ${query}. Same-day arrival, price before we touch a thing. If you called two shops and got voicemail, we are the third call you should have made first.`,
    `Taking the ${neighborhood} ${query} jobs the pack is too slow for. Licensed, insured, on-site photos before we leave. Reply to this post or call — we do not farm this out.`,
    `${neighborhood} is ours to earn. ${query} done the same day, no bait-and-switch. This post is how we climb — Google does not move for quiet listings.`,
  ]
  return {
    id: `gbp_steal_${neighborhood}_${query}`.replace(/\s+/g, "_").toLowerCase(),
    kind: "post",
    headline: `${neighborhood}: same-day ${query}`,
    body: pick(`${neighborhood}:${query}:steal`, bodies),
    cta: "Call now",
    photoLabel: `Job site · ${neighborhood} · ${market.vertical}`,
  }
}

function protectDraft(market: Market, neighborhood: string, query: string): GbpDraft {
  const bodies = [
    `Still holding ${neighborhood} for ${query}. Two trucks on that side of ${market.city} this afternoon — if you are already a customer, we are 20 minutes out, not next week.`,
    `Freshness check: ${neighborhood} ${query}. The pack forgets quiet profiles. We do not. Photos from this morning’s run, reviews answered, hours accurate.`,
    `${market.brand} in ${neighborhood} — same crew as last time. ${query} before the heat (or the rain) makes it worse. We post because stale listings fall.`,
  ]
  return {
    id: `gbp_protect_${neighborhood}_${query}`.replace(/\s+/g, "_").toLowerCase(),
    kind: "post",
    headline: `${neighborhood} is covered`,
    body: pick(`${neighborhood}:${query}:protect`, bodies),
    cta: "Book today",
    photoLabel: `Crew · ${neighborhood} · this week`,
  }
}

function competitorAdsFor(
  pack: PackOccupant[],
  query: string
): CompetitorAd[] {
  return pack
    .filter((p) => !p.isUs)
    .slice(0, 2)
    .map((p) => ({
      advertiserName: p.name,
      status: "untouched" as const,
      headline: `${p.name} · ${query}`,
    }))
}

function assertOwnAdsOnly(mutation: AdMutation, market: Market, competitors: string[]) {
  if (mutation.accountId !== market.accountId) {
    throw new Error("Hunter refused an ad mutation on a foreign account.")
  }
  if (mutation.advertiserName !== market.brand) {
    throw new Error("Hunter refused an ad mutation for another advertiser.")
  }
  if (competitors.includes(mutation.advertiserName)) {
    throw new Error("Hunter does not block other companies’ ads.")
  }
}

export function runHunt(marketId: string, now = Date.now()): HuntResult {
  const market = marketById(marketId)
  const cells: Cell[] = []
  const approvals: Approval[] = []

  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const i = row * GRID + col
      const neighborhood = market.neighborhoods[i]
      const query = market.queries[i % market.queries.length]
      const rank = rankForCell(market.id, row, col)
      const lane = classifyLane(rank)
      const policy = adsPolicy(lane)
      const cellId = `${market.id}:${row}:${col}`
      const pack = buildPack(market, rank, cellId)
      const spendAtRiskUsd = range(`${cellId}:spend`, 18, 164)
      const freshnessHours = range(`${cellId}:fresh`, 4, 96)
      const gbpDraft = needsGbpDraft(lane)
        ? lane === "steal"
          ? stealDraft(market, neighborhood, query)
          : protectDraft(market, neighborhood, query)
        : null

      const adMutation: AdMutation = {
        id: `ad_${cellId}`,
        accountId: market.accountId,
        advertiserName: market.brand,
        action: policy === "blocked" ? "pause" : "keep",
        campaign: `${market.city} ${market.vertical} · ${neighborhood}`,
        keyword: query,
        geo: `${neighborhood}, ${market.city} ${market.region}`,
        dailyBudgetUsd: spendAtRiskUsd,
        reason:
          policy === "blocked"
            ? lane === "build"
              ? "Listing is missing. Paid clicks on a ghost listing are leakage — pause our ads only."
              : "Outside the pack (rank 4+). Pause our ads and climb with GBP — do not keep buying the click."
            : "Inside the pack (rank 1–3). Keep bidding. Freshness is the defense.",
      }

      assertOwnAdsOnly(adMutation, market, market.competitors)

      const evidence: string[] = [
        rank === null
          ? `No ${market.brand} result for “${query}” in ${neighborhood}.`
          : `${market.brand} sits at map-pack rank ${rank} for “${query}” in ${neighborhood}.`,
        `Lane ${lane.toUpperCase()} from spec: null → BUILD, 4+ → STEAL, 1–3 → PROTECT.`,
        policy === "blocked"
          ? `Own-ads pause queued on ${market.accountId}. Competitor auctions left untouched.`
          : `Own-ads stay live. Competitor auctions left untouched.`,
        gbpDraft
          ? `GBP ${lane === "steal" ? "climb" : "freshness"} draft staged — will not post until you tap Approve.`
          : "No GBP post. Build is presence, not a caption.",
      ]

      const cell: Cell = {
        id: cellId,
        row,
        col,
        neighborhood,
        query,
        rank,
        lane,
        pack,
        spendAtRiskUsd,
        freshnessHours,
        gbpDraft,
        adMutation,
        competitorAds: competitorAdsFor(pack, query),
        evidence,
      }
      cells.push(cell)

      if (adMutation.action === "pause") {
        approvals.push({
          id: `ap_pause_${cellId}`,
          cellId,
          lane,
          kind: "pause_ads",
          status: "pending",
          title: `Pause our ads · ${neighborhood}`,
          summary: `${adMutation.campaign} · “${query}” · $${spendAtRiskUsd}/day at risk`,
          neighborhood,
          query,
        })
      }
      if (gbpDraft) {
        approvals.push({
          id: `ap_gbp_${cellId}`,
          cellId,
          lane,
          kind: "gbp_draft",
          status: "pending",
          title: `${lane === "steal" ? "GBP climb post" : "GBP freshness post"} · ${neighborhood}`,
          summary: gbpDraft.headline,
          neighborhood,
          query,
        })
      }
    }
  }

  const laneRank = { steal: 0, build: 1, protect: 2 } as const
  approvals.sort((a, b) => {
    const laneDelta = laneRank[a.lane] - laneRank[b.lane]
    if (laneDelta !== 0) return laneDelta
    if (a.kind !== b.kind) return a.kind === "pause_ads" ? -1 : 1
    return a.neighborhood.localeCompare(b.neighborhood)
  })

  return {
    id: `hunt_${market.id}_${now}`,
    marketId: market.id,
    startedAt: now,
    finishedAt: now,
    cells,
    approvals,
  }
}

export const GRID_SIZE = GRID
