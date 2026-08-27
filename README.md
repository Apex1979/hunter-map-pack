# Hunter

A single dark command page for local map-pack operations.

**Run Hunter → three columns (Build / Steal / Protect) → approvals with Approve / Reject.**

This is a complete operator surface, not a mock slide. Hunter scans a 5×5 query × geo grid for your brand, classifies every cell from rank, stages **your** ad pauses and GBP drafts, and will not post or pause until a human taps Approve.

Default brand: **Storm Master Roofing** (Minnetonka / west metro).

## Spec (enforced in code)

| Rank | Lane | Ads | GBP |
| --- | --- | --- | --- |
| `null` (missing) | **BUILD** | blocked | none — presence is the work |
| `4+` | **STEAL** | blocked | climb draft queued |
| `1–3` | **PROTECT** | keep bidding | freshness draft queued |

Hard rules:

- Human tap before anything is posted.
- Hunter does not block other companies’ ads. Pauses are bound to *this* account id and brand; competitor auctions render as `UNTOUCHED`.
- Classification lives in `lib/hunter/classify.ts`. The engine throws if an ad mutation targets a foreign account or a competitor name.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:43127](http://localhost:43127).

## How to use it

1. Market defaults to **Minnetonka · Roofing · Storm Master Roofing**. Other demos: Austin HVAC, Phoenix plumbing, Miami roofing.
2. Hit **Run Hunter** (or `R`). The grid lights up cell by cell.
3. Read the three lanes. Click a cell for pack evidence and the auction rail.
4. Work the approval dock: **Approve** (`A`) or **Reject** (`X`). `J` / `K` moves the queue.

Reject means Hunter does nothing. Approve on a pause only pauses **our** ads. Approve on a GBP draft is the human post tap.

## What is real vs simulated

The classifier, own-ads invariant, approval gate, and UI are real.

The map-pack ranks, spend-at-risk, and GBP copy are a deterministic simulation (`lib/hunter/engine.ts`) so the product is runnable without Google Ads or Business Profile credentials. Swap `runHunt()` for live rank + ads APIs without changing the page.

## Stack

Next.js (App Router), TypeScript, Tailwind, shadcn/ui.

## For Grok Build review

Unzip `hunter-for-grok-build.zip`, paste `GROK_PROMPT.txt`, and tell Grok to read `GROK.md` first.

Then:

- `lib/hunter/classify.ts` — rank → lane, ads policy, GBP policy
- `lib/hunter/engine.ts` — grid, heatmap, `assertOwnAdsOnly`
- `lib/hunter/markets.ts` — Storm Master is first
- `components/hunter/command-center.tsx` — hunt loop, keyboard, human gate
- `components/hunter/approvals.tsx` — Approve / Reject, draft preview

Improvements worth making next: wire live Google Ads pause + GBP post after Approve, persist the audit log, and keep the same gate. Do not auto-post. Do not add competitor-ad suppression.
