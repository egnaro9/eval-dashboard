# eval-dashboard

[![ci](https://github.com/egnaro9/eval-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/egnaro9/eval-dashboard/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)](https://www.typescriptlang.org/)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**A Next.js + TypeScript dashboard that visualizes RAG evaluation runs and surfaces hallucinations at a glance.**

The companion [rag-eval-lab](https://github.com/egnaro9/rag-eval-lab) produces an `eval_run.json`; numbers in a JSON file are hard to read. This dashboard turns one into metric cards, a per-case table, and a banner that calls out any **flagged (hallucinated) case** in red. It's a fully client-side **static export** — no server, no database — so it builds to plain files you can drop on GitHub Pages or S3.

- **Strict TypeScript, end to end.** A typed `EvalRun` schema with a runtime `parseEvalRun` validator that rejects malformed uploads (`strict` mode, no `any`).
- **Interactive.** Ships with a sample run; drop in your own `eval_run.json` and it re-renders client-side.
- **Tested.** **15 tests** (Vitest + Testing Library) across the pure metric logic, the schema validator, and the React components. **Green CI**, **0 npm-audit vulnerabilities**, and a real `next build`.

---

## What it shows

```
┌─ RAG Eval Dashboard ──────────────────────  run: rag-eval-lab · 6 cases ─┐
│  🚩 1 hallucination detected — "Which planet is the hottest…"            │
│                                                                          │
│  Faithfulness  Precision@k  Recall@k  Citation rate  Pass rate  Flagged  │
│     91.7%         25.0%      100.0%      100.0%         83.3%     1 / 6   │
│                                                                          │
│  Question              Answer                        Faithful  P@k  ⚑    │
│  Which planet is …     Venus is the second planet…     100%    25%  ✓ ok │
│  …                                                                       │
│  Which planet is …     Neptune erupts with volcanic…   50%     25%  🚩   │  ← red row
└──────────────────────────────────────────────────────────────────────────┘
```

Faithful/precision badges are color-toned (green ≥ 90%, amber ≥ 60%, red below), and the flagged row — the planted hallucination from rag-eval-lab — is highlighted with its note.

## Run it

```bash
git clone https://github.com/egnaro9/eval-dashboard && cd eval-dashboard
npm ci
npm run dev        # http://localhost:3000
```

```bash
npm test           # 15 tests (Vitest + Testing Library)
npm run typecheck  # tsc --noEmit, strict
npm run build      # static export -> ./out  (deploy anywhere)
```

Load your own run: click **Load eval_run.json** and pick a file produced by `python -m ragevallab.cli eval`.

## How it's built

| Layer | File | Notes |
| --- | --- | --- |
| Typed schema + validator | [`lib/schema.ts`](lib/schema.ts) | `EvalRun` types + `parseEvalRun(unknown): EvalRun`, throws `ParseError` on bad shape |
| Pure display logic | [`lib/metrics.ts`](lib/metrics.ts) | `summaryCards`, `passRate`, `toneForScore`, `formatPct` — no React, unit-tested |
| Components | [`components/`](components) | `MetricCard`, `ScoreBadge`, `CaseTable`, `FlaggedBanner`, `Dashboard` (client) |
| App | [`app/`](app) | App Router, static export |

Keeping the data-shaping logic in pure, React-free modules is deliberate: those functions carry the correctness-critical bits (thresholds, aggregation) and are trivially unit-testable, while the components stay thin.

## Design notes

- **Why static export?** The dashboard only *reads* a JSON run — there's no server-side work to do. `output: "export"` yields a zero-runtime site that's cheap to host and impossible to break in production. It's also why the CI job runs `next build` (which type-checks) before the standalone `typecheck` — the build generates the App Router route types.
- **Why a runtime validator in a typed app?** TypeScript types vanish at runtime; an *uploaded* file is untrusted. `parseEvalRun` is the boundary that turns `unknown` JSON into a typed `EvalRun` or a clear error — the same discipline you'd use on any external input.
- **0 vulnerabilities.** Dependencies are pinned and a `postcss` override pulls the patched transitive version; the CI audit step is informational so a future upstream advisory never silently reddens the badge.

```
app/            layout, page (validates the bundled sample at build), globals.css
components/     MetricCard · ScoreBadge · CaseTable · FlaggedBanner · Dashboard
lib/            schema.ts (types + validator) · metrics.ts (pure logic) · sample.json
tests/          schema.test.ts · metrics.test.ts · components.test.tsx  (15 tests)
```

---

Built by [Erik Hill](https://egnaro9.github.io) · MIT licensed. Pairs with [rag-eval-lab](https://github.com/egnaro9/rag-eval-lab).
