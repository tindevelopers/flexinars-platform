import React from "react";

type Status = "invited" | "in_progress" | "passed" | "failed" | string;

const STYLES: Record<string, string> = {
  invited:
    "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400",
  in_progress:
    "bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-500/10 dark:text-yellow-400",
  passed:
    "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400",
  failed:
    "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400",
};

const LABELS: Record<string, string> = {
  invited: "Invited",
  in_progress: "In Progress",
  passed: "Passed",
  failed: "Failed",
};

/** Colored status pill for enrollment / generic statuses. */
export default function StatusBadge({ status }: { status: Status }) {
  const style =
    STYLES[status] ??
    "bg-gray-50 text-gray-600 ring-gray-500/20 dark:bg-gray-500/10 dark:text-gray-400";
  const label = LABELS[status] ?? status;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      {label}
    </span>
  );
}
