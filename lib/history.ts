// Reading stored runs from eval-history (github.com/egnaro9/eval-history).
//
// The dashboard's other three sources — the bundled sample, the localStorage
// handoff from rag-eval-lab, and a file upload — are all local. This one is a
// real network call to a real Postgres-backed service, which brings two
// problems the local sources don't have:
//
// 1. **It's on a free tier that sleeps.** First request after ~15 minutes idle
//    takes ~30-50s to wake. Silence for 50s reads as "this app is broken", so
//    callers get told a wake is in progress rather than left with a spinner.
// 2. **It's untrusted input.** A network response gets the same runtime
//    validation as an uploaded file — `parseEvalRun` — not a cast. The types
//    below describe what we *expect*; they don't make it so.

export const HISTORY_API =
  process.env.NEXT_PUBLIC_EVAL_HISTORY_URL ?? "https://eval-history.onrender.com";

/** A row from `GET /runs` — the list shape: metrics flattened into columns. */
export interface StoredRun {
  id: string;
  name: string;
  created_at: string;
  faithfulness: number;
  precision_at_k: number;
  recall_at_k: number;
  citation_rate: number;
  flagged_cases: number;
  n_cases: number;
  git_sha: string | null;
  label: string | null;
}

export class HistoryError extends Error {}

function isStoredRun(v: unknown): v is StoredRun {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return typeof r.id === "string" && typeof r.name === "string" &&
    typeof r.created_at === "string" && typeof r.faithfulness === "number";
}

async function get(path: string, signal?: AbortSignal): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`${HISTORY_API}${path}`, { signal, headers: { accept: "application/json" } });
  } catch (e) {
    if ((e as Error)?.name === "AbortError") throw e;
    // Network-level failure: offline, CORS, DNS, or the service never woke.
    throw new HistoryError("couldn't reach eval-history — it may still be waking up");
  }
  if (!res.ok) throw new HistoryError(`eval-history returned ${res.status}`);
  return res.json();
}

/** Stored runs, newest first. Validated, not cast. */
export async function fetchRuns(limit = 20, signal?: AbortSignal): Promise<StoredRun[]> {
  const data = await get(`/runs?limit=${limit}`, signal);
  if (!Array.isArray(data)) throw new HistoryError("expected a list of runs");
  const runs = data.filter(isStoredRun);
  if (runs.length !== data.length) {
    throw new HistoryError("eval-history returned a run in an unexpected shape");
  }
  return runs;
}

/**
 * One stored run, in `eval_run.json` shape.
 *
 * Deliberately `/runs/{id}/eval_run` and not `/runs/{id}`: the latter is the
 * storage shape (`precision_at_k` as a column), which `parseEvalRun` rejects.
 * The API hands back exactly what was POSTed, so the dashboard needs no adapter
 * and no second parser to keep in sync with the first.
 */
export async function fetchRunAsEvalRun(id: string, signal?: AbortSignal): Promise<unknown> {
  return get(`/runs/${encodeURIComponent(id)}/eval_run`, signal);
}

/** Nudge the free tier awake. Fire-and-forget; failure is not interesting. */
export function wake(): void {
  fetch(`${HISTORY_API}/health`).catch(() => {});
}
