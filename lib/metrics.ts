import type { EvalCase, EvalRun } from "./schema";

export type Tone = "good" | "warn" | "bad";

/** Faithfulness threshold used by rag-eval-lab to flag a case. */
export const FAITHFULNESS_THRESHOLD = 0.6;

export function formatPct(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`;
}

/** Fraction of cases that were NOT flagged. */
export function passRate(run: EvalRun): number {
  const n = run.metrics.n_cases;
  if (n <= 0) return 1;
  return (n - run.metrics.flagged_cases) / n;
}

/** Color tone for a 0..1 quality score (higher is better). */
export function toneForScore(value: number): Tone {
  if (value >= 0.9) return "good";
  if (value >= FAITHFULNESS_THRESHOLD) return "warn";
  return "bad";
}

export function flaggedCases(run: EvalRun): EvalCase[] {
  return run.cases.filter((c) => c.flagged);
}

export interface Card {
  label: string;
  display: string;
  tone: Tone;
}

/** The metric cards shown at the top of the dashboard. */
export function summaryCards(run: EvalRun): Card[] {
  const m = run.metrics;
  const flagged = m.flagged_cases;
  return [
    { label: "Faithfulness", display: formatPct(m.faithfulness), tone: toneForScore(m.faithfulness) },
    { label: "Precision@k", display: formatPct(m["precision@k"]), tone: toneForScore(m["precision@k"]) },
    { label: "Recall@k", display: formatPct(m["recall@k"]), tone: toneForScore(m["recall@k"]) },
    { label: "Citation rate", display: formatPct(m.citation_rate), tone: toneForScore(m.citation_rate) },
    { label: "Pass rate", display: formatPct(passRate(run)), tone: toneForScore(passRate(run)) },
    {
      label: "Flagged",
      display: `${flagged} / ${m.n_cases}`,
      tone: flagged === 0 ? "good" : "bad",
    },
  ];
}
