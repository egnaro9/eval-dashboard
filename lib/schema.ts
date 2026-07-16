// The shape of a rag-eval-lab eval run (see github.com/egnaro9/rag-eval-lab).
// Kept in sync by validating any loaded JSON against these types at runtime.

export interface Scores {
  "precision@k": number;
  "recall@k": number;
  citation: number;
  faithfulness: number;
}

export interface EvalCase {
  q: string;
  answer: string;
  retrieved: string[];
  citations: string[];
  scores: Scores;
  flagged: boolean;
  note: string;
}

export interface Metrics {
  "precision@k": number;
  "recall@k": number;
  citation_rate: number;
  faithfulness: number;
  flagged_cases: number;
  n_cases: number;
}

export interface EvalRun {
  run: string;
  metrics: Metrics;
  cases: EvalCase[];
}

export class ParseError extends Error {}

function num(obj: Record<string, unknown>, key: string, ctx: string): number {
  const v = obj[key];
  if (typeof v !== "number" || Number.isNaN(v)) {
    throw new ParseError(`${ctx}: expected numeric "${key}"`);
  }
  return v;
}

/** Validate untrusted JSON (e.g. an uploaded file) into a typed EvalRun. */
export function parseEvalRun(data: unknown): EvalRun {
  if (typeof data !== "object" || data === null) {
    throw new ParseError("eval run must be a JSON object");
  }
  const root = data as Record<string, unknown>;
  if (typeof root.run !== "string") throw new ParseError('missing "run" name');
  if (typeof root.metrics !== "object" || root.metrics === null) {
    throw new ParseError('missing "metrics"');
  }
  if (!Array.isArray(root.cases)) throw new ParseError('"cases" must be an array');

  const m = root.metrics as Record<string, unknown>;
  const metrics: Metrics = {
    "precision@k": num(m, "precision@k", "metrics"),
    "recall@k": num(m, "recall@k", "metrics"),
    citation_rate: num(m, "citation_rate", "metrics"),
    faithfulness: num(m, "faithfulness", "metrics"),
    flagged_cases: num(m, "flagged_cases", "metrics"),
    n_cases: num(m, "n_cases", "metrics"),
  };

  const cases: EvalCase[] = root.cases.map((c, i) => {
    if (typeof c !== "object" || c === null) {
      throw new ParseError(`cases[${i}] must be an object`);
    }
    const cc = c as Record<string, unknown>;
    const s = (cc.scores ?? {}) as Record<string, unknown>;
    return {
      q: String(cc.q ?? ""),
      answer: String(cc.answer ?? ""),
      retrieved: Array.isArray(cc.retrieved) ? cc.retrieved.map(String) : [],
      citations: Array.isArray(cc.citations) ? cc.citations.map(String) : [],
      scores: {
        "precision@k": num(s, "precision@k", `cases[${i}].scores`),
        "recall@k": num(s, "recall@k", `cases[${i}].scores`),
        citation: num(s, "citation", `cases[${i}].scores`),
        faithfulness: num(s, "faithfulness", `cases[${i}].scores`),
      },
      flagged: Boolean(cc.flagged),
      note: String(cc.note ?? ""),
    };
  });

  return { run: root.run, metrics, cases };
}
