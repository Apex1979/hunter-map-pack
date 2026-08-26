# Hand this to Grok Build

You are reviewing **Hunter**, a shipping Next.js app. Do not scaffold a new project. Read this file, then the files listed under Start here. Improve in place. Keep the page dark, single-screen, and operator-grade.

## Product

One dark page:

1. **Run Hunter**
2. Three columns: **Build / Steal / Protect**
3. Approvals with **Approve / Reject**

Hunter scans a 5×5 local-pack grid (query × geo) for *our* brand. It classifies each cell from map-pack rank, stages **our** ad pauses and GBP drafts, and will not post or pause until a human taps Approve.

Demo markets: Austin HVAC (Northstar Mechanical), Phoenix plumbing (Redline Rooter), Miami roofing (Harborline Roofing).

Ranks and GBP copy are a **deterministic simulation** so the app runs without Google credentials. The classifier, own-ads invariant, and human gate are real. If you wire live APIs, swap `runHunt()` — do not change the page contract.

## Spec — do not weaken

| Rank | Lane | Ads | GBP |
| --- | --- | --- | --- |
| `null` (missing) | BUILD | blocked | none |
| `4+` | STEAL | blocked | climb draft queued |
| `1–3` | PROTECT | keep bidding | freshness draft queued |

Hard rules:

- Human tap before anything is posted. No batch-approve of posts. No auto-post.
- Hunter does **not** block other companies’ ads. Pauses bind to this account id and brand. Competitor auctions render as `UNTOUCHED`. The engine must throw if a mutation targets a foreign account or a competitor name.
- BUILD does not get a GBP post. Presence is the work.

## Start here

```
lib/hunter/classify.ts              rank → lane, ads policy, GBP policy
lib/hunter/engine.ts                grid, heatmap, assertOwnAdsOnly
lib/hunter/markets.ts               brands, queries, neighborhoods
components/hunter/command-center.tsx  hunt loop, keyboard, gate
components/hunter/approvals.tsx     Approve / Reject, draft preview
components/hunter/lanes.tsx         three columns + mobile tabs
components/hunter/evidence.tsx      local pack + auction rail
```

Run: `npm install && npm run dev` (port **43127**).

Keyboard: `R` hunt · `A` approve · `X` reject · `J`/`K` next pending.

## Allowed upgrades

Make it dominate, but keep the contract:

- Live Google Ads pause + GBP post **after** Approve (mock fallback if no keys)
- Persist the audit log
- Stronger GBP drafts, better pack evidence, tighter hunt
- Visual polish that still reads as a weapons console, not a SaaS marketing page

## Forbidden

- Auto-posting GBP
- Pausing or suppressing competitor ads
- Adding auth, a database, or extra services unless required for a live API
- Replacing the single-page Hunt → lanes → approvals flow
- Generic purple dashboard restyle

## Stack

Next.js 16 App Router, React 19, TypeScript, Tailwind v4, shadcn/ui (base-nova). Forced `class="dark"`.
