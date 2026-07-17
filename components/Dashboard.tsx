"use client";

import { useEffect, useMemo, useState } from "react";
import { takeHandoff } from "@/lib/handoff";
import { fetchRunAsEvalRun, HistoryError } from "@/lib/history";
import { flaggedCases, summaryCards } from "@/lib/metrics";
import { parseEvalRun, type EvalRun } from "@/lib/schema";
import { CaseTable } from "./CaseTable";
import { FlaggedBanner } from "./FlaggedBanner";
import { HistoryPicker } from "./HistoryPicker";
import { MetricCard } from "./MetricCard";

export function Dashboard({ initialRun }: { initialRun: EvalRun }) {
  const [run, setRun] = useState<EvalRun>(initialRun);
  const [error, setError] = useState<string | null>(null);
  const [handedOff, setHandedOff] = useState<string | null>(null);
  const [fromHistory, setFromHistory] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // If rag-eval-lab sent us a run it just produced in the browser, render that
  // instead of the bundled sample. Same origin, so it comes via localStorage.
  useEffect(() => {
    const h = takeHandoff();
    if (!h) return;
    try {
      setRun(parseEvalRun(h.raw));
      setHandedOff(h.source);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "could not parse the handed-off run");
    }
  }, []);

  const cards = useMemo(() => summaryCards(run), [run]);
  const flagged = useMemo(() => flaggedCases(run), [run]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = parseEvalRun(JSON.parse(await file.text()));
      setRun(parsed);
      setHandedOff(null);
      setFromHistory(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "could not parse file");
    }
  }

  /** Load a run out of the live service. Same validator as an uploaded file:
   *  the network is not a more trustworthy source than a stranger's disk. */
  async function onPickFromHistory(id: string, label: string) {
    try {
      const parsed = parseEvalRun(await fetchRunAsEvalRun(id));
      setRun(parsed);
      setHandedOff(null);
      setFromHistory(label);
      setShowHistory(false);   // it did its job; get out of the way
      setError(null);
    } catch (err) {
      setError(
        err instanceof HistoryError
          ? err.message
          : err instanceof Error
            ? `stored run didn't match the schema: ${err.message}`
            : "could not load that run",
      );
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
        {/* Both buttons answer the same question — where does this run come from?
            — so they live together. The pink one reaches a real server; the
            colour is eval-history's everywhere it appears. */}
        <div className="sources">
          <button
            className={`source-btn eh${showHistory ? " on" : ""}`}
            onClick={() => setShowHistory((v) => !v)}
            aria-expanded={showHistory}
          >
            {showHistory ? "Hide stored runs" : "Load from eval-history"}
          </button>
          <label className="upload">
            Load eval_run.json
            <input type="file" accept="application/json,.json" onChange={onUpload} />
          </label>
        </div>
      </header>

      {showHistory && <HistoryPicker onPick={onPickFromHistory} />}

      {handedOff && (
        <div className="banner handoff">
          ⇢ This run was just produced by{" "}
          <a href="https://egnaro9.github.io/rag-eval-lab/">{handedOff}</a> in your browser and
          handed straight to this dashboard — nothing round-tripped through a server.
        </div>
      )}

      {fromHistory && (
        <div className="banner handoff">
          ⇢ Loaded from{" "}
          <a href="https://github.com/egnaro9/eval-history">eval-history</a> — a live FastAPI +
          Postgres service: <strong>{fromHistory}</strong>. This one did round-trip through a server.
        </div>
      )}

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
        Schema: <a href="https://github.com/egnaro9/rag-eval-lab">rag-eval-lab</a> — or{" "}
        <a href="https://egnaro9.github.io/rag-eval-lab/">generate a fresh run in your browser</a>{" "}
        and send it here. You can also drop in your own <code>eval_run.json</code>.
      </footer>
    </main>
  );
}
