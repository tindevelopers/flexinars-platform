import StatCard from "../../components/StatCard";
import { getDashboardStats } from "../../lib/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let stats = {
    totalEnrollments: 0,
    passedThisMonth: 0,
    pending: 0,
    averageQuizScore: null as number | null,
  };
  let error: string | null = null;
  try {
    stats = await getDashboardStats();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load stats";
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Dashboard
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Global Flexinars CE Platform — learner &amp; course overview.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          Could not load dashboard stats: {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Enrollments" value={stats.totalEnrollments} />
        <StatCard
          label="Passed This Month"
          value={stats.passedThisMonth}
          hint="Status = passed, completed this calendar month"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          hint="Invited or in progress"
        />
        <StatCard
          label="Average Quiz Score"
          value={
            stats.averageQuizScore == null ? "—" : `${stats.averageQuizScore}%`
          }
          hint="Across all quiz attempts"
        />
      </section>
    </div>
  );
}
