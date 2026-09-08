"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHeadCell,
  Button,
} from "@tindevelopers/platform-ui";
import ReportsNav from "../_components/ReportsNav";
import { formatDate } from "../_components/format";
import type { CompletionRow, CourseOption } from "../../../../lib/queries";

const selectClass =
  "h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";
const inputClass = selectClass;

function YesNoBadge({ value }: { value: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        value
          ? "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400"
          : "bg-gray-50 text-gray-600 ring-gray-500/20 dark:bg-gray-500/10 dark:text-gray-400"
      }`}
    >
      {value ? "Yes" : "No"}
    </span>
  );
}

function SortHeader({
  label,
  col,
  sort,
  dir,
  onSort,
}: {
  label: string;
  col: string;
  sort: string;
  dir: string;
  onSort: (col: string) => void;
}) {
  const active = sort === col;
  return (
    <TableHeadCell>
      <button
        type="button"
        onClick={() => onSort(col)}
        className="inline-flex items-center gap-1 hover:text-blue-600"
      >
        {label}
        <span className="text-[10px] text-gray-400">
          {active ? (dir === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </button>
    </TableHeadCell>
  );
}

export default function CompletionsClient({
  rows,
  total,
  courses,
  page,
  pageSize,
  courseId,
  from,
  to,
  sort,
  dir,
  error,
}: {
  rows: CompletionRow[];
  total: number;
  courses: CourseOption[];
  page: number;
  pageSize: number;
  courseId: string;
  from: string;
  to: string;
  sort: string;
  dir: string;
  error: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function apply(next: {
    course?: string;
    from?: string;
    to?: string;
    sort?: string;
    dir?: string;
    page?: number;
  }) {
    const params = new URLSearchParams();
    const c = next.course ?? courseId;
    const f = next.from ?? from;
    const t = next.to ?? to;
    const s = next.sort ?? sort;
    const d = next.dir ?? dir;
    const p = next.page ?? 1;
    if (c && c !== "all") params.set("course", c);
    if (f) params.set("from", f);
    if (t) params.set("to", t);
    if (s && s !== "date_completed") params.set("sort", s);
    if (d && d !== "desc") params.set("dir", d);
    if (p > 1) params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  function onSort(col: string) {
    if (sort === col) {
      apply({ sort: col, dir: dir === "asc" ? "desc" : "asc", page: 1 });
    } else {
      apply({ sort: col, dir: "asc", page: 1 });
    }
  }

  // The CSV export mirrors the active course + date-range filters.
  const exportParams = new URLSearchParams();
  if (courseId && courseId !== "all") exportParams.set("course", courseId);
  if (from) exportParams.set("from", from);
  if (to) exportParams.set("to", to);
  const exportHref = `/api/reports/completions/export${
    exportParams.toString() ? `?${exportParams.toString()}` : ""
  }`;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Completion Records
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            All passed learners. {total} total.
          </p>
        </div>
        <a
          href={exportHref}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          Export to CSV
        </a>
      </div>

      <ReportsNav />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          Could not load completions: {error}
        </div>
      ) : null}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Course</span>
          <select
            className={selectClass}
            value={courseId}
            onChange={(e) => apply({ course: e.target.value, page: 1 })}
          >
            <option value="all">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Completed from</span>
          <input
            type="date"
            className={inputClass}
            value={from}
            onChange={(e) => apply({ from: e.target.value, page: 1 })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Completed to</span>
          <input
            type="date"
            className={inputClass}
            value={to}
            onChange={(e) => apply({ to: e.target.value, page: 1 })}
          />
        </div>
        {courseId !== "all" || from || to ? (
          <button
            type="button"
            onClick={() => router.push(pathname)}
            className="h-11 rounded-lg border border-gray-300 px-4 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader
                label="Clinician"
                col="clinician_name"
                sort={sort}
                dir={dir}
                onSort={onSort}
              />
              <TableHeadCell>Title</TableHeadCell>
              <TableHeadCell>Email</TableHeadCell>
              <TableHeadCell>Location</TableHeadCell>
              <TableHeadCell>Course</TableHeadCell>
              <SortHeader
                label="Completed"
                col="date_completed"
                sort={sort}
                dir={dir}
                onSort={onSort}
              />
              <SortHeader
                label="Score"
                col="score"
                sort={sort}
                dir={dir}
                onSort={onSort}
              />
              <TableHeadCell>Attempts</TableHeadCell>
              <TableHeadCell>Evaluation</TableHeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell className="px-5 py-6 text-center text-gray-500">
                  No completion records match these filters.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.enrollment_id}>
                  <TableCell className="px-5 py-4 font-medium text-gray-800 dark:text-white/90">
                    {r.clinician_name}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500">
                    {r.professional_title}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500">
                    {r.email}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500">
                    {r.location ?? "—"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500">
                    {r.course_title}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500">
                    {formatDate(r.date_completed)}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500">
                    {r.quiz_score == null ? "—" : `${r.quiz_score}%`}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500">
                    {r.total_attempts}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <YesNoBadge value={r.evaluation_submitted} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => apply({ page: page - 1 })}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => apply({ page: page + 1 })}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
