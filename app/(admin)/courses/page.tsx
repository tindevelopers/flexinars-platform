import Link from "next/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHeadCell,
} from "@tindevelopers/platform-ui";
import { getCoursesList } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  let courses: Awaited<ReturnType<typeof getCoursesList>> = [];
  let error: string | null = null;
  try {
    courses = await getCoursesList();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load courses.";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Courses
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Manage CE courses and their quiz questions. {courses.length} total.
          </p>
        </div>
        <Link
          href="/courses/new"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create Course
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {!error && courses.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
          No courses yet. Click <strong>Create Course</strong> to add one.
        </div>
      )}

      {!error && courses.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>Title</TableHeadCell>
                <TableHeadCell>Speaker</TableHeadCell>
                <TableHeadCell>Topic</TableHeadCell>
                <TableHeadCell>CE Credits</TableHeadCell>
                <TableHeadCell>Questions</TableHeadCell>
                <TableHeadCell>Enrollments</TableHeadCell>
                <TableHeadCell>Active</TableHeadCell>
                <TableHeadCell>Actions</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {c.title}
                    </span>
                  </TableCell>
                  <TableCell>{c.speaker}</TableCell>
                  <TableCell>
                    <span className="line-clamp-1 max-w-xs">{c.topic}</span>
                  </TableCell>
                  <TableCell>{Number(c.ce_credits).toFixed(1)}</TableCell>
                  <TableCell>{c.question_count}</TableCell>
                  <TableCell>{c.enrollment_count}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        c.is_active
                          ? "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400"
                          : "bg-gray-50 text-gray-600 ring-gray-500/20 dark:bg-gray-500/10 dark:text-gray-400"
                      }`}
                    >
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/courses/${c.id}/edit`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      Edit
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
