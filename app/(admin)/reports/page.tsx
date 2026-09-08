import Link from "next/link";
import StatCard from "../../../components/StatCard";
import ReportsNav from "./_components/ReportsNav";
import {
  getReportSummary,
  getScoreDistribution,
  getKnowledgeShift,
  type ReportSummary,
  type ScoreBucket,
  type KnowledgeShift,
} from "../../../lib/queries";

export const dynamic = "force-dynamic";

const NAV_CARDS = [
  {
    href: "/reports/completions",
    title: "Completion Records",
    desc: "Compliance-ready table of every passed learner, with CSV export.",
  },
  {
    href: "/reports/evaluations",
    title: "Evaluation Responses",
    desc: "Likert averages, knowledge shift and individual feedback.",
  },
  {
    href: "/reports/quiz-analysis",
    title: "Quiz Analysis",
    desc: "Per-question correct rates and most-missed items.",
  },
];

export default async function ReportsPage() {
  let summary: ReportSummary = {
    totalCompletions: 0,
    passRate: null,
    averageScore: null,
    averageAttemptsToPass: null,
    evaluationsSubmitted: 0,
    commercialBiasReports: 0,
  };
  let distribution: ScoreBucket[] = [];
  let knowledge: KnowledgeShift[] = [];
  let error: string | null = null;

  try {
    [summary, distribution, knowledge] = await Promise.all([
      getReportSummary(),
      getScoreDistribution(),
      getKnowledgeShift(),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load report data";
  }

  const maxBucket = Math.max(1, ...distribution.map((b) => b.count));
  const maxKnowledge = Math.max(
    1,
    ...knowledge.map((k) => Math.max(k.before, k.after))
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Reports
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          CE completion, evaluation and quiz analytics for compliance
          record-keeping.
        </p>
      </header>

      <ReportsNav />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          Could not load report data: {error}
        </div>
      ) : null}

      {/* KPI cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total Completions"
          value={summary.totalCompletions}
          hint="Enrollments with status = passed"
        />
        <StatCard
          label="Pass Rate"
          value={summary.passRate == null ? "—" : `${summary.passRate}%`}
          hint="Passed attempts / all submitted attempts"
        />
        <StatCard
          label="Average Quiz Score"
          value={
            summary.averageScore == null ? "—" : `${summary.averageScore}%`
          }
          hint="Across all quiz attempts"
        />
        <StatCard
          label="Avg. Attempts to Pass"
          value={
            summary.averageAttemptsToPass == null
              ? "—"
              : summary.averageAttemptsToPass
          }
          hint="Mean attempt number of passing attempts"
        />
        <StatCard
          label="Evaluations Submitted"
          value={summary.evaluationsSubmitted}
          hint="Completed course evaluations"
        />
        <StatCard
          label="Commercial Bias Reports"
          value={summary.commercialBiasReports}
          hint="Evaluations flagging perceived bias"
        />
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Score distribution */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Score Distribution
          </h2>
          <p className="mb-4 text-xs text-gray-400">
            Quiz attempts by score bucket
          </p>
          <div className="space-y-3">
            {distribution.map((b) => (
              <div key={b.label} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-xs text-gray-500">
                  {b.label}
                </span>
                <div className="h-6 flex-1 overflow-hidden rounded bg-gray-100 dark:bg-white/[0.06]">
                  <div
                    className="flex h-full items-center justify-end rounded bg-blue-500 px-2 text-[11px] font-medium text-white"
                    style={{
                      width: `${Math.max(
                        b.count === 0 ? 0 : 6,
                        (b.count / maxBucket) * 100
                      )}%`,
                    }}
                  >
                    {b.count > 0 ? b.count : ""}
                  </div>
                </div>
                {b.count === 0 ? (
                  <span className="w-6 text-right text-xs text-gray-400">0</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* Knowledge shift */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Knowledge Shift
          </h2>
          <p className="mb-4 text-xs text-gray-400">
            Self-reported knowledge before vs. after (from evaluations)
          </p>
          <div className="mb-3 flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm bg-gray-400" />
              Before
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm bg-green-500" />
              After
            </span>
          </div>
          <div className="space-y-3">
            {knowledge.map((k) => (
              <div key={k.level}>
                <span className="text-xs text-gray-500">{k.label}</span>
                <div className="mt-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-3 flex-1 overflow-hidden rounded bg-gray-100 dark:bg-white/[0.06]">
                      <div
                        className="h-full rounded bg-gray-400"
                        style={{ width: `${(k.before / maxKnowledge) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-xs text-gray-400">
                      {k.before}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 flex-1 overflow-hidden rounded bg-gray-100 dark:bg-white/[0.06]">
                      <div
                        className="h-full rounded bg-green-500"
                        style={{ width: `${(k.after / maxKnowledge) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-xs text-gray-400">
                      {k.after}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick nav cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {NAV_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-blue-400 hover:bg-blue-50/40 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-blue-500/50 dark:hover:bg-blue-500/[0.06]"
          >
            <h3 className="text-base font-semibold text-gray-800 group-hover:text-blue-700 dark:text-white/90 dark:group-hover:text-blue-400">
              {card.title}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {card.desc}
            </p>
            <span className="mt-3 inline-block text-sm font-medium text-blue-600 dark:text-blue-400">
              View →
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
