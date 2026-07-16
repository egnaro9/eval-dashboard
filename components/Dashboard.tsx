"use client";

import { useMemo, useState } from "react";
import { flaggedCases, summaryCards } from "@/lib/metrics";
import { parseEvalRun, type EvalRun } from "@/lib/schema";
import { CaseTable } from "./CaseTable";
import { FlaggedBanner } from "./FlaggedBanner";
import { MetricCard } from "./MetricCard";

export function Dashboard({ initialRun }: { initialRun: EvalRun }) {
  const [run, setRun] = useState<EvalRun>(initialRun);
  const [error, setError] = useState<string | null>(null);

  const cards = useMemo(() => summaryCards(run), [run]);
  const flagged = useMemo(() => flaggedCases(run), [run]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = parseEvalRun(JSON.parse(await file.text()));
      setRun(parsed);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "could not parse file");
    }
  }

  return (
    <main className="dashboard">
      <header>
        <div>
          <h1>RAG Eval Dashboard</h1>
          <p className="subtitle">
            run: <code>{run.run}</code> · {run.metrics.n_cases} cases
          </p>
        </div>
        <label className="upload">
          Load eval_run.json
          <input type="file" accept="application/json,.json" onChange={onUpload} />
        </label>
      </header>

      {error && <div className="banner bad" role="alert">Couldn’t load file: {error}</div>}

      <FlaggedBanner flagged={flagged} />

      <section className="cards-grid">
        {cards.map((c) => (
          <MetricCard key={c.label} card={c} />
        ))}
      </section>

      <h2>Cases</h2>
      <CaseTable cases={run.cases} />

      <footer>
        Schema: <a href="https://github.com/egnaro9/rag-eval-lab">rag-eval-lab</a>. Drop in your
        own <code>eval_run.json</code> to visualize it.
      </footer>
    </main>
  );
}
