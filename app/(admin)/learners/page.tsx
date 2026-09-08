import LearnersClient from "./LearnersClient";
import { getEnrollments, getCourses } from "../../../lib/queries";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function LearnersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; course?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status ?? "all";
  const courseId = sp.course ?? "all";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  let enrollments: Awaited<ReturnType<typeof getEnrollments>> = {
    rows: [],
    total: 0,
  };
  let courses: Awaited<ReturnType<typeof getCourses>> = [];
  let error: string | null = null;

  try {
    [enrollments, courses] = await Promise.all([
      getEnrollments({ status, courseId, page, pageSize: PAGE_SIZE }),
      getCourses(),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load learners";
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Learners
        </h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          Could not load learners: {error}
        </div>
      </div>
    );
  }

  return (
    <LearnersClient
      enrollments={enrollments.rows}
      courses={courses}
      total={enrollments.total}
      page={page}
      pageSize={PAGE_SIZE}
      status={status}
      courseId={courseId}
    />
  );
}
