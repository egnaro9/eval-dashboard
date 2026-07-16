import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CaseTable } from "@/components/CaseTable";
import { Dashboard } from "@/components/Dashboard";
import { FlaggedBanner } from "@/components/FlaggedBanner";
import { flaggedCases } from "@/lib/metrics";
import { parseEvalRun } from "@/lib/schema";
import sample from "@/lib/sample.json";

const run = parseEvalRun(sample);

describe("FlaggedBanner", () => {
  it("warns when there are flagged cases", () => {
    render(<FlaggedBanner flagged={flaggedCases(run)} />);
    expect(screen.getByTestId("flagged-banner").textContent).toMatch(/hallucination/i);
  });

  it("reassures when there are none", () => {
    render(<FlaggedBanner flagged={[]} />);
    expect(screen.getByTestId("flagged-banner").textContent).toMatch(/No hallucinations/i);
  });
});

describe("CaseTable", () => {
  it("renders a row per case and marks the flagged one", () => {
    render(<CaseTable cases={run.cases} />);
    expect(screen.getAllByTestId("case-row")).toHaveLength(6);
    const flaggedRows = screen
      .getAllByTestId("case-row")
      .filter((r) => r.className.includes("row-flagged"));
    expect(flaggedRows).toHaveLength(1);
  });
});

describe("Dashboard", () => {
  it("renders the run name and all six metric cards", () => {
    render(<Dashboard initialRun={run} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/RAG Eval Dashboard/);
    expect(screen.getAllByTestId("metric-card")).toHaveLength(6);
  });
});
