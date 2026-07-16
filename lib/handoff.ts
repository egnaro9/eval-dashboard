// Cross-project handoff: rag-eval-lab -> eval-dashboard.
//
// Both demos are served from egnaro9.github.io, so they share an origin and
// can pass a run through localStorage. rag-eval-lab writes the eval it just
// produced in the browser, then links here with ?from=rag-eval-lab; we pick it
// up and render it. That makes the pipeline real and clickable instead of a
// diagram: produce a run in one project, visualize it in the other.
//
// The key is namespaced and read-once — a stale run shouldn't silently
// reappear on a later visit.

export const HANDOFF_KEY = "ragevallab:eval_run";
export const HANDOFF_PARAM = "from";

export interface Handoff {
  raw: unknown;
  source: string;
}

/** Read a handed-off run, if this page was opened by one. Clears it after reading. */
export function takeHandoff(): Handoff | null {
  if (typeof window === "undefined") return null;
  const source = new URLSearchParams(window.location.search).get(HANDOFF_PARAM);
  if (!source) return null;
  try {
    const stored = window.localStorage.getItem(HANDOFF_KEY);
    if (!stored) return null;
    window.localStorage.removeItem(HANDOFF_KEY); // read-once
    return { raw: JSON.parse(stored), source };
  } catch {
    return null;
  }
}
