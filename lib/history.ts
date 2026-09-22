// Reading stored runs from eval-history (github.com/egnaro9/eval-history).
//
// The dashboard's other three sources — the bundled sample, the localStorage
// handoff from rag-eval-lab, and a file upload — are all local. This one is a
// real network call, which brings two problems the local sources don't have:
//
// 1. **The host moved.** The Postgres-backed service was retired; its read
//    routes are now static files that mirror the old API paths with a `.json`
//    suffix (eval-history's `tools/export_static.py`). Nothing sleeps any more,
//    so there is no wake to announce, but the paths need translating.
// 2. **It's untrusted input.** A network response gets the same runtime
//    validation as an uploaded file — `parseEvalRun` — not a cast. The types
//    below describe what we *expect*; they don't make it so.

export const HISTORY_API =
  process.env.NEXT_PUBLIC_EVAL_HISTORY_URL ?? "https://erikhill.dev/eval-history";

/** The static archive has no query string, so paths are translated for it. */
export const IS_ARCHIVE =
  HISTORY_API.endsWith(".json") || HISTORY_API.includes("/eval-history");

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
  // The archive exports the full list as one file; the live API took ?limit=.
  const data = await get(IS_ARCHIVE ? "/runs.json" : `/runs?limit=${limit}`, signal);
  if (!Array.isArray(data)) throw new HistoryError("expected a list of runs");
  const rows = IS_ARCHIVE
    ? [...data]
        .sort((a, b) =>
          String((b as StoredRun)?.created_at ?? "").localeCompare(String((a as StoredRun)?.created_at ?? "")))
        .slice(0, limit)
    : data;
  const runs = rows.filter(isStoredRun);
  if (runs.length !== rows.length) {
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
  const path = `/runs/${encodeURIComponent(id)}/eval_run`;
  return get(IS_ARCHIVE ? `${path}.json` : path, signal);
}

/**
 * Nudge a sleeping deployment awake. Fire-and-forget; failure is not
 * interesting. Static files never sleep, so against the archive this is a
 * deliberate no-op rather than a request that would 404.
 */
export function wake(): void {
  if (IS_ARCHIVE) return;
  fetch(`${HISTORY_API}/health`).catch(() => {});
}
