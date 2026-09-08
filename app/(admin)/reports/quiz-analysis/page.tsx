import ReportsNav from "../_components/ReportsNav";
import StatCard from "../../../../components/StatCard";
import { getQuizAnalysis, type QuizQuestionStat } from "../../../../lib/queries";

export const dynamic = "force-dynamic";

function rateColor(rate: number | null): string {
  if (rate == null) return "bg-gray-300";
  if (rate >= 80) return "bg-green-500";
  if (rate >= 60) return "bg-lime-500";
  if (rate >= 40) return "bg-yellow-400";
  return "bg-red-500";
}

export default async function QuizAnalysisPage() {
  let questions: QuizQuestionStat[] = [];
  let totalSubmissions = 0;
  let error: string | null = null;

  try {
    const data = await getQuizAnalysis();
    questions = data.questions;
    totalSubmissions = data.totalSubmissions;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load quiz analysis";
  }

  const answered = questions.filter((q) => q.total > 0);
  const mostMissed =
    answered.length > 0
      ? answered.reduce((a, b) =>
          (a.correct_rate ?? 100) <= (b.correct_rate ?? 100) ? a : b
        )
      : null;
  const bestUnderstood =
    answered.length > 0
      ? answered.reduce((a, b) =>
          (a.correct_rate ?? 0) >= (b.correct_rate ?? 0) ? a : b
        )
      : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Quiz Analysis
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Per-question performance across all quiz attempts.
        </p>
      </header>

      <ReportsNav />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          Could not load quiz analysis: {error}
        </div>
      ) : null}

      {/* Summary */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Quiz Submissions"
          value={totalSubmissions}
          hint="All recorded quiz attempts"
        />
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Best Understood
          </p>
          {bestUnderstood ? (
            <>
              <p className="mt-2 text-lg font-bold text-green-600 dark:text-green-400">
                Q{bestUnderstood.position} — {bestUnderstood.correct_rate}%
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-gray-400">
                {bestUnderstood.question_text}
              </p>
            </>
          ) : (
            <p className="mt-2 text-3xl font-bold text-gray-300">—</p>
          )}
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Most Missed</p>
          {mostMissed ? (
            <>
              <p className="mt-2 text-lg font-bold text-red-600 dark:text-red-400">
                Q{mostMissed.position} — {mostMissed.correct_rate}%
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-gray-400">
                {mostMissed.question_text}
              </p>
            </>
          ) : (
            <p className="mt-2 text-3xl font-bold text-gray-300">—</p>
          )}
        </div>
      </section>

      {/* Per-question table */}
      <section className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 dark:bg-white/[0.03]">
            <tr>
              <th className="w-12 px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Question</th>
              <th className="w-24 px-4 py-3 text-center font-medium">Answer</th>
              <th className="w-20 px-4 py-3 text-center font-medium">Correct</th>
              <th className="w-24 px-4 py-3 text-center font-medium">
                Incorrect
              </th>
              <th className="w-56 px-4 py-3 font-medium">Correct Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {questions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No quiz questions found.
                </td>
              </tr>
            ) : (
              questions.map((q) => (
                <tr key={q.question_id}>
                  <td className="px-4 py-4 font-medium text-gray-800 dark:text-white/90">
                    {q.position}
                  </td>
                  <td className="px-4 py-4 text-gray-700 dark:text-gray-300">
                    {q.question_text}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        q.correct_answer
                          ? "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400"
                          : "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400"
                      }`}
                    >
                      {q.correct_answer ? "True" : "False"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-green-600 dark:text-green-400">
                    {q.correct_count}
                  </td>
                  <td className="px-4 py-4 text-center text-red-600 dark:text-red-400">
                    {q.incorrect_count}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-3 flex-1 overflow-hidden rounded bg-gray-100 dark:bg-white/[0.06]">
                        <div
                          className={`h-full rounded ${rateColor(
                            q.correct_rate
                          )}`}
                          style={{ width: `${q.correct_rate ?? 0}%` }}
                        />
                      </div>
                      <span className="w-14 shrink-0 text-right text-xs font-medium text-gray-600 dark:text-gray-300">
                        {q.correct_rate == null ? "—" : `${q.correct_rate}%`}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
