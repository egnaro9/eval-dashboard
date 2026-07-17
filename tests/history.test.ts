// The API client's job is to distrust the network. These pin the failure modes,
// because a live free-tier service fails in more ways than it succeeds.
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchRunAsEvalRun,
  fetchRuns,
  HistoryError,
  HISTORY_API,
} from "@/lib/history";

const RUN = {
  id: "abc123", name: "rag-eval-lab", created_at: "2026-07-17T04:12:10Z",
  faithfulness: 0.917, precision_at_k: 0.333, recall_at_k: 1, citation_rate: 1,
  flagged_cases: 1, n_cases: 6, git_sha: "f5bf5b1", label: "a real commit",
};

function mockFetch(impl: (url: string) => Partial<Response> | Promise<never>) {
  const spy = vi.fn(async (url: RequestInfo | URL) => impl(String(url)) as Response);
  vi.stubGlobal("fetch", spy);
  return spy;
}

afterEach(() => vi.unstubAllGlobals());

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });

describe("fetchRuns", () => {
  it("returns validated runs", async () => {
    mockFetch(() => ok([RUN]));
    await expect(fetchRuns()).resolves.toEqual([RUN]);
  });

  it("asks the right endpoint with the limit", async () => {
    const spy = mockFetch(() => ok([]));
    await fetchRuns(5);
    expect(spy.mock.calls[0][0]).toBe(`${HISTORY_API}/runs?limit=5`);
  });

  it("rejects a run in an unexpected shape rather than passing it on", async () => {
    // A silently-changed API is the failure this exists to catch: without the
    // check, `faithfulness` arrives undefined and the UI renders NaN.
    mockFetch(() => ok([{ ...RUN, faithfulness: "high" }]));
    await expect(fetchRuns()).rejects.toBeInstanceOf(HistoryError);
  });

  it("rejects a non-list", async () => {
    mockFetch(() => ok({ runs: [] }));
    await expect(fetchRuns()).rejects.toBeInstanceOf(HistoryError);
  });

  it("turns a network failure into a message about waking, not a raw throw", async () => {
    // This is what a sleeping free tier actually looks like from the browser.
    mockFetch(() => Promise.reject(new TypeError("Failed to fetch")));
    await expect(fetchRuns()).rejects.toThrow(/waking up/);
  });

  it("surfaces an HTTP error status", async () => {
    mockFetch(() => ({ ok: false, status: 503, json: async () => ({}) }));
    await expect(fetchRuns()).rejects.toThrow(/503/);
  });

  it("lets an abort propagate untouched, so a cancelled load isn't an error", async () => {
    const err = new Error("aborted"); err.name = "AbortError";
    mockFetch(() => Promise.reject(err));
    await expect(fetchRuns()).rejects.toThrow("aborted");
  });
});

describe("fetchRunAsEvalRun", () => {
  it("uses /eval_run — the storage shape would fail parseEvalRun", async () => {
    const spy = mockFetch(() => ok({ run: "x", metrics: {}, cases: [] }));
    await fetchRunAsEvalRun("abc123");
    expect(spy.mock.calls[0][0]).toBe(`${HISTORY_API}/runs/abc123/eval_run`);
  });

  it("escapes the id rather than pasting it into a URL", async () => {
    const spy = mockFetch(() => ok({}));
    await fetchRunAsEvalRun("a/../b");
    expect(spy.mock.calls[0][0]).toBe(`${HISTORY_API}/runs/a%2F..%2Fb/eval_run`);
  });
});
