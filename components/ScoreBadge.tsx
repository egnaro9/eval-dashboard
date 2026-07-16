import { formatPct, toneForScore } from "@/lib/metrics";

export function ScoreBadge({ value }: { value: number }) {
  return (
    <span className={`badge tone-${toneForScore(value)}`} data-testid="score-badge">
      {formatPct(value, 0)}
    </span>
  );
}
