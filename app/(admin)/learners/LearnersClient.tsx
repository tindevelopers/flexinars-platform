"use client";

import React, { useActionState, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Button,
  Modal,
  Input,
  Label,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHeadCell,
  useModal,
} from "@tindevelopers/platform-ui";
import StatusBadge from "../../../components/StatusBadge";
import { createInvite, type InviteFormState } from "./actions";
import type { EnrollmentRow, CourseOption } from "../../../lib/queries";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "invited", label: "Invited" },
  { value: "in_progress", label: "In Progress" },
  { value: "passed", label: "Passed" },
  { value: "failed", label: "Failed" },
];

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const selectClass =
  "h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function LearnersClient({
  enrollments,
  courses,
  total,
  page,
  pageSize,
  status,
  courseId,
}: {
  enrollments: EnrollmentRow[];
  courses: CourseOption[];
  total: number;
  page: number;
  pageSize: number;
  status: string;
  courseId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen, openModal, closeModal } = useModal();
  const [state, formAction, pending] = useActionState<
    InviteFormState | null,
    FormData
  >(createInvite, null);
  const [selectedCourse, setSelectedCourse] = useState<string>(
    courses[0]?.id ?? ""
  );

  // Close modal + refresh table after a successful invite.
  useEffect(() => {
    if (state?.ok) {
      const t = setTimeout(() => {
        closeModal();
        router.refresh();
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [state, closeModal, router]);

  function applyFilter(next: { status?: string; course?: string; page?: number }) {
    const params = new URLSearchParams();
    const s = next.status ?? status;
    const c = next.course ?? courseId;
    const p = next.page ?? 1;
    if (s && s !== "all") params.set("status", s);
    if (c && c !== "all") params.set("course", c);
    if (p > 1) params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Learners
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            All enrollments across courses. {total} total.
          </p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          Invite Learner
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Status</span>
          <select
            className={selectClass}
            value={status}
            onChange={(e) => applyFilter({ status: e.target.value, page: 1 })}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Course</span>
          <select
            className={selectClass}
            value={courseId}
            onChange={(e) => applyFilter({ course: e.target.value, page: 1 })}
          >
            <option value="all">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeadCell>Clinician</TableHeadCell>
              <TableHeadCell>Title</TableHeadCell>
              <TableHeadCell>Email</TableHeadCell>
              <TableHeadCell>Course</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Invited</TableHeadCell>
              <TableHeadCell>Completed</TableHeadCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.length === 0 ? (
              <TableRow>
                <TableCell className="px-5 py-6 text-center text-gray-500">
                  No enrollments match these filters.
                </TableCell>
              </TableRow>
            ) : (
              enrollments.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="px-5 py-4 font-medium text-gray-800 dark:text-white/90">
                    {e.clinician_name}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500">
                    {e.professional_title}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500">
                    {e.email}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500">
                    {e.course_title}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <StatusBadge status={e.status} />
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500">
                    {formatDate(e.invited_at)}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500">
                    {formatDate(e.completed_at)}
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
            onClick={() => applyFilter({ page: page - 1 })}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => applyFilter({ page: page + 1 })}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Invite modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-lg p-6 sm:p-8">
        <h2 className="mb-1 text-xl font-semibold text-gray-800 dark:text-white/90">
          Invite Learner
        </h2>
        <p className="mb-5 text-sm text-gray-500">
          Creates an enrollment and emails a unique course invite link.
        </p>

        {state ? (
          <div
            className={`mb-4 rounded-lg p-3 text-sm ${
              state.ok
                ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
            }`}
          >
            {state.message}
          </div>
        ) : null}

        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="clinician_name">Clinician Name</Label>
            <Input id="clinician_name" name="clinician_name" placeholder="Dr. Jane Doe" />
          </div>
          <div>
            <Label htmlFor="professional_title">Professional Title</Label>
            <Input id="professional_title" name="professional_title" placeholder="DDS" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="jane@example.com" />
          </div>
          <div>
            <Label htmlFor="location">Location (optional)</Label>
            <Input id="location" name="location" placeholder="City, State" />
          </div>
          <div>
            <Label htmlFor="course_id">Course</Label>
            <select
              id="course_id"
              name="course_id"
              className={`${selectClass} w-full`}
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              {courses.length === 0 ? (
                <option value="">No courses available</option>
              ) : (
                courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} — {c.speaker}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/[0.03]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Sending…" : "Send Invite"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
