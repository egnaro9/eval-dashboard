import type { EvalCase } from "@/lib/schema";
import { ScoreBadge } from "./ScoreBadge";

export function CaseTable({ cases }: { cases: EvalCase[] }) {
  return (
    <table className="cases" data-testid="case-table">
      <thead>
        <tr>
          <th>Question</th>
          <th>Answer</th>
          <th>Retrieved</th>
          <th>Faithful</th>
          <th>P@k</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {cases.map((c, i) => (
          <tr key={i} className={c.flagged ? "row-flagged" : undefined} data-testid="case-row">
            <td className="q">{c.q}</td>
            <td className="a">
              {c.answer}
              {c.note && <div className="note">{c.note}</div>}
            </td>
            <td className="retrieved">{c.retrieved.join(", ") || "—"}</td>
            <td><ScoreBadge value={c.scores.faithfulness} /></td>
            <td><ScoreBadge value={c.scores["precision@k"]} /></td>
            <td>
              {c.flagged ? (
                <span className="status flagged">🚩 flagged</span>
              ) : (
                <span className="status ok">✓ ok</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
