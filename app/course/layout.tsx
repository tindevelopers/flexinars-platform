import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Global Flexinars — Continuing Education",
  description:
    "Complete your Global Flexinars continuing-education course: watch the video, pass the quiz, and submit your evaluation.",
};

/**
 * Clean, public, mobile-responsive layout for the participant (clinician) CE
 * experience. Deliberately free of the admin shell — no sidebar, no auth
 * chrome. Access to these pages is gated by the invite token in the URL.
 */
export default function CourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Global Flexinars
            </span>
            <span className="text-xs font-medium text-blue-600">
              CE That Travels With You
            </span>
          </div>
          <span className="hidden text-xs font-medium uppercase tracking-wide text-slate-400 sm:block">
            Continuing Education
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6 text-center text-xs text-slate-500">
          © 2026 Global Flexinars Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
