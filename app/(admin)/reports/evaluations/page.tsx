import ReportsNav from "../_components/ReportsNav";
import EvaluationsClient from "./EvaluationsClient";
import {
  getLikertSummary,
  getSectionCSummary,
  getEvaluationRecords,
  type LikertSummary,
  type SectionCSummary,
  type EvaluationRecord,
} from "../../../../lib/queries";

export const dynamic = "force-dynamic";

export default async function EvaluationsPage() {
  let likert: LikertSummary[] = [];
  let sectionC: SectionCSummary | null = null;
  let records: EvaluationRecord[] = [];
  let error: string | null = null;

  try {
    [likert, sectionC, records] = await Promise.all([
      getLikertSummary(),
      getSectionCSummary(),
      getEvaluationRecords(),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load evaluations";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Evaluation Responses
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Aggregated learning-objective &amp; content/speaker ratings, knowledge
            shift and individual feedback.
          </p>
        </div>
        <a
          href="/api/reports/evaluations/export"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          Export Evaluations CSV
        </a>
      </div>

      <ReportsNav />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          Could not load evaluations: {error}
        </div>
      ) : (
        <EvaluationsClient
          likert={likert}
          sectionC={sectionC}
          records={records}
        />
      )}
    </div>
  );
}
