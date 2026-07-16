import { beforeEach, describe, expect, it } from "vitest";
import { HANDOFF_KEY, takeHandoff } from "@/lib/handoff";
import sample from "@/lib/sample.json";

function setLocation(search: string) {
  // jsdom lets us rewrite the query string via history.
  window.history.replaceState({}, "", "/" + search);
}

describe("takeHandoff", () => {
  beforeEach(() => {
    window.localStorage.clear();
    setLocation("");
  });

  it("returns null with no ?from param", () => {
    window.localStorage.setItem(HANDOFF_KEY, JSON.stringify(sample));
    expect(takeHandoff()).toBeNull();
  });

  it("returns null when ?from is present but nothing was stored", () => {
    setLocation("?from=rag-eval-lab");
    expect(takeHandoff()).toBeNull();
  });

  it("reads a stored run and reports its source", () => {
    window.localStorage.setItem(HANDOFF_KEY, JSON.stringify(sample));
    setLocation("?from=rag-eval-lab");
    const h = takeHandoff();
    expect(h?.source).toBe("rag-eval-lab");
    expect((h?.raw as { run: string }).run).toBe("rag-eval-lab");
  });

  it("is read-once — a stale run never reappears", () => {
    window.localStorage.setItem(HANDOFF_KEY, JSON.stringify(sample));
    setLocation("?from=rag-eval-lab");
    expect(takeHandoff()).not.toBeNull();
    expect(window.localStorage.getItem(HANDOFF_KEY)).toBeNull();
    expect(takeHandoff()).toBeNull();
  });

  it("survives malformed stored JSON", () => {
    window.localStorage.setItem(HANDOFF_KEY, "{not json");
    setLocation("?from=rag-eval-lab");
    expect(takeHandoff()).toBeNull();
  });
});
