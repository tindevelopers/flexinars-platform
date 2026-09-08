"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/reports", label: "Overview" },
  { href: "/reports/completions", label: "Completions" },
  { href: "/reports/evaluations", label: "Evaluations" },
  { href: "/reports/quiz-analysis", label: "Quiz Analysis" },
];

/**
 * Horizontal sub-navigation shown at the top of every reports page. Keeps the
 * global sidebar simple (a single "Reports" entry) while giving quick access to
 * the four report views.
 */
export default function ReportsNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-white/[0.03]">
      {TABS.map((tab) => {
        const active =
          tab.href === "/reports"
            ? pathname === "/reports"
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.06]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
