import { describe, expect, it } from "vitest";
import {
  formatPct,
  flaggedCases,
  passRate,
  summaryCards,
  toneForScore,
} from "@/lib/metrics";
import { parseEvalRun, type EvalRun } from "@/lib/schema";
import sample from "@/lib/sample.json";

const run: EvalRun = parseEvalRun(sample);

describe("formatPct", () => {
  it("formats fractions as percentages", () => {
    expect(formatPct(0.917)).toBe("91.7%");
    expect(formatPct(1)).toBe("100.0%");
    expect(formatPct(0.25, 0)).toBe("25%");
  });
});

describe("toneForScore", () => {
  it("buckets by threshold", () => {
    expect(toneForScore(0.95)).toBe("good");
    expect(toneForScore(0.7)).toBe("warn");
    expect(toneForScore(0.4)).toBe("bad");
  });
});

describe("passRate", () => {
  it("is (n - flagged) / n", () => {
    // sample: 6 cases, 1 flagged -> 5/6
    expect(passRate(run)).toBeCloseTo(5 / 6, 5);
  });
  it("is 1 for an empty run", () => {
    const empty = { ...run, metrics: { ...run.metrics, n_cases: 0, flagged_cases: 0 } };
    expect(passRate(empty)).toBe(1);
  });
});

describe("flaggedCases", () => {
  it("returns only flagged cases", () => {
    expect(flaggedCases(run)).toHaveLength(1);
  });
});

describe("summaryCards", () => {
  it("builds a card per metric with a Flagged tone driven by count", () => {
    const cards = summaryCards(run);
    const labels = cards.map((c) => c.label);
    expect(labels).toContain("Faithfulness");
    expect(labels).toContain("Pass rate");
    const flaggedCard = cards.find((c) => c.label === "Flagged")!;
    expect(flaggedCard.display).toBe("1 / 6");
    expect(flaggedCard.tone).toBe("bad");
  });
});
