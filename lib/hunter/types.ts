export type Lane = "build" | "steal" | "protect"

export type Rank = number | null

export type HuntPhase = "idle" | "hunting" | "armed"

export type ApprovalStatus = "pending" | "approved" | "rejected"

export type ApprovalKind = "pause_ads" | "gbp_draft"

export interface Market {
  id: string
  city: string
  region: string
  brand: string
  accountId: string
  vertical: string
  queries: string[]
  neighborhoods: string[]
  competitors: string[]
  rating: number
  reviews: number
}

export interface PackOccupant {
  name: string
  isUs: boolean
  rank: number
  rating: number
  reviews: number
}

export interface GbpDraft {
  id: string
  kind: "post"
  headline: string
  body: string
  cta: string
  photoLabel: string
}

export interface AdMutation {
  id: string
  accountId: string
  advertiserName: string
  action: "pause" | "keep"
  campaign: string
  keyword: string
  geo: string
  dailyBudgetUsd: number
  reason: string
}

export interface CompetitorAd {
  advertiserName: string
  status: "untouched"
  headline: string
}

export interface Cell {
  id: string
  row: number
  col: number
  neighborhood: string
  query: string
  rank: Rank
  lane: Lane
  pack: PackOccupant[]
  spendAtRiskUsd: number
  freshnessHours: number
  gbpDraft: GbpDraft | null
  adMutation: AdMutation
  competitorAds: CompetitorAd[]
  evidence: string[]
}

export interface Approval {
  id: string
  cellId: string
  lane: Lane
  kind: ApprovalKind
  status: ApprovalStatus
  title: string
  summary: string
  neighborhood: string
  query: string
}

export interface HuntLogLine {
  t: string
  level: "scan" | "rank" | "lane" | "queue" | "gate"
  text: string
}

export interface HuntResult {
  id: string
  marketId: string
  startedAt: number
  finishedAt: number
  cells: Cell[]
  approvals: Approval[]
}

export interface LaneMeta {
  id: Lane
  label: string
  rankRule: string
  action: string
  verb: string
}
