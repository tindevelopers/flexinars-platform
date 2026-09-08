import CompletionsClient from "./CompletionsClient";
import { getCompletions, getCourses } from "../../../../lib/queries";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function CompletionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    course?: string;
    from?: string;
    to?: string;
    sort?: string;
    dir?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const courseId = sp.course ?? "all";
  const from = sp.from ?? "";
  const to = sp.to ?? "";
  const sort = sp.sort ?? "date_completed";
  const dir = sp.dir ?? "desc";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  let data: Awaited<ReturnType<typeof getCompletions>> = { rows: [], total: 0 };
  let courses: Awaited<ReturnType<typeof getCourses>> = [];
  let error: string | null = null;

  try {
    [data, courses] = await Promise.all([
      getCompletions({
        courseId,
        from: from || undefined,
        to: to || undefined,
        sort,
        dir,
        page,
        pageSize: PAGE_SIZE,
      }),
      getCourses(),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load completions";
  }

  return (
    <CompletionsClient
      rows={data.rows}
      total={data.total}
      courses={courses}
      page={page}
      pageSize={PAGE_SIZE}
      courseId={courseId}
      from={from}
      to={to}
      sort={sort}
      dir={dir}
      error={error}
    />
  );
}
