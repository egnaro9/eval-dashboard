import { describe, expect, it } from "vitest";
import { ParseError, parseEvalRun } from "@/lib/schema";
import sample from "@/lib/sample.json";

describe("parseEvalRun", () => {
  it("parses the bundled sample run", () => {
    const run = parseEvalRun(sample);
    expect(run.run).toBe("rag-eval-lab");
    expect(run.cases).toHaveLength(6);
    expect(run.metrics.flagged_cases).toBe(1);
  });

  it("preserves the planted-hallucination flag and note", () => {
    const run = parseEvalRun(sample);
    const flagged = run.cases.filter((c) => c.flagged);
    expect(flagged).toHaveLength(1);
    expect(flagged[0].note).toContain("PLANTED");
    expect(flagged[0].scores.faithfulness).toBeLessThan(0.6);
  });

  it("rejects non-objects", () => {
    expect(() => parseEvalRun(null)).toThrow(ParseError);
    expect(() => parseEvalRun(42)).toThrow(ParseError);
  });

  it("rejects a run missing metrics", () => {
    expect(() => parseEvalRun({ run: "x", cases: [] })).toThrow(/metrics/);
  });

  it("rejects a metric that is not numeric", () => {
    const bad = {
      run: "x",
      cases: [],
      metrics: {
        "precision@k": "high",
        "recall@k": 1,
        citation_rate: 1,
        faithfulness: 1,
        flagged_cases: 0,
        n_cases: 0,
      },
    };
    expect(() => parseEvalRun(bad)).toThrow(/precision@k/);
  });
});
