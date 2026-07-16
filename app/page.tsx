import { Dashboard } from "@/components/Dashboard";
import { parseEvalRun } from "@/lib/schema";
import sample from "@/lib/sample.json";

// Validate the bundled sample at build time; the dashboard is interactive from there.
const initialRun = parseEvalRun(sample);

export default function Page() {
  return <Dashboard initialRun={initialRun} />;
}
