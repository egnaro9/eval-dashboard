import type { Card } from "@/lib/metrics";

export function MetricCard({ card }: { card: Card }) {
  return (
    <div className={`card tone-${card.tone}`} data-testid="metric-card">
      <div className="card-label">{card.label}</div>
      <div className="card-value">{card.display}</div>
    </div>
  );
}
