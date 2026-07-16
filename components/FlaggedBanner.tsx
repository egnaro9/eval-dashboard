import type { EvalCase } from "@/lib/schema";

export function FlaggedBanner({ flagged }: { flagged: EvalCase[] }) {
  if (flagged.length === 0) {
    return (
      <div className="banner ok" data-testid="flagged-banner">
        ✓ No hallucinations detected — every answer is grounded in its retrieved context.
      </div>
    );
  }
  return (
    <div className="banner bad" data-testid="flagged-banner">
      🚩 {flagged.length} hallucination{flagged.length > 1 ? "s" : ""} detected —{" "}
      {flagged.map((c) => `“${c.q}”`).join(", ")}
    </div>
  );
}
