"use client";

import { useEffect, useRef, useState } from "react";
import { fetchRuns, wake, HistoryError, type StoredRun } from "@/lib/history";

/**
 * Runs stored in eval-history, loadable into the dashboard.
 *
 * The honest-UX bit: the API is on a free tier that sleeps, so the first click
 * can take ~50s. That's stated up front rather than hidden behind a spinner —
 * a reader who thinks it's broken doesn't wait, and doesn't come back.
 */
export function HistoryPicker({ onPick }: { onPick: (id: string, label: string) => void }) {
  const [runs, setRuns] = useState<StoredRun[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);

  async function load() {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setLoading(true); setError(null); setSlow(false);
    // If it's still going after 3s it's almost certainly a cold start; say so.
    const slowTimer = setTimeout(() => setSlow(true), 3000);
    wake();
    try {
      setRuns(await fetchRuns(20, ctrl.signal));
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      setError(e instanceof HistoryError ? e.message : "something went wrong");
    } finally {
      clearTimeout(slowTimer);
      setLoading(false); setSlow(false);
    }
  }

  return (
    <section className="history">
      <div className="history-head">
        <h2>Stored runs</h2>
        <button onClick={load} disabled={loading}>
          {loading ? "Loading…" : runs ? "Refresh" : "Load from eval-history"}
        </button>
      </div>

      {!runs && !loading && !error && (
        <p className="history-note">
          These come from <a href="https://github.com/egnaro9/eval-history">eval-history</a> — a live
          FastAPI + Postgres service. rag-eval-lab&rsquo;s CI posts its eval runs there, tagged with the
          commit that produced them.
        </p>
      )}

      {slow && (
        <p className="history-note wake" role="status">
          Waking the service — it&rsquo;s on a free tier that sleeps after 15 minutes idle, so this takes
          ~30&ndash;50s the first time. Nothing is broken.
        </p>
      )}

      {error && (
        <p className="history-note bad" role="alert">
          {error}. The dashboard still works — the run below is bundled with the page.
        </p>
      )}

      {runs && runs.length === 0 && <p className="history-note">No runs stored yet.</p>}

      {runs && runs.length > 0 && (
        <ul className="history-list">
          {runs.map((r) => (
            <li key={r.id}>
              <button onClick={() => onPick(r.id, r.label ?? r.name)}>
                <span className="hl-when">{new Date(r.created_at).toLocaleString()}</span>
                <span className="hl-label">{r.label ?? r.name}</span>
                {r.git_sha && <code className="hl-sha">{r.git_sha}</code>}
                <span className="hl-faith">faithfulness {r.faithfulness.toFixed(3)}</span>
                {r.flagged_cases > 0 && (
                  <span className="hl-flagged">{r.flagged_cases} flagged</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
