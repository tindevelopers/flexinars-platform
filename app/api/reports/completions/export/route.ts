import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/server";
import { getCompletions } from "@/lib/queries";
import { buildCsv, todayStamp } from "@/lib/csv";
import {
  KNOWLEDGE_LABELS,
  SPEAKER_RATING_LABELS,
} from "@/app/(admin)/reports/_components/format";

/** CSV variants that emit "" (not "—") for missing values. */
const kLabel = (v: string | null) => (v ? KNOWLEDGE_LABELS[v] ?? v : "");
const sLabel = (v: string | null) => (v ? SPEAKER_RATING_LABELS[v] ?? v : "");
const yn = (v: boolean | null) => (v === null || v === undefined ? "" : v ? "Yes" : "No");

export const dynamic = "force-dynamic";

const HEADERS = [
  "Clinician Name",
  "Professional Title",
  "Email",
  "Location",
  "Course Title",
  "Speaker",
  "Topic",
  "CE Credits",
  "Date Completed",
  "Quiz Score (%)",
  "Total Attempts",
  "Evaluation Submitted (Yes/No)",
  "Evaluation Submitted Date",
  "Knowledge Before",
  "Knowledge After",
  "New Information (Yes/No)",
  "Speaker Rating",
  "Would Take Again (Yes/No)",
  "Would Recommend (Yes/No)",
];

export async function GET(req: NextRequest) {
  // Protect the download: require a valid admin session.
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const courseId = sp.get("course") ?? "all";
  const from = sp.get("from") ?? undefined;
  const to = sp.get("to") ?? undefined;

  const { rows } = await getCompletions({
    courseId,
    from: from || undefined,
    to: to || undefined,
    paginate: false,
  });

  const dataRows = rows.map((r) => [
    r.clinician_name,
    r.professional_title,
    r.email,
    r.location ?? "",
    r.course_title,
    r.speaker,
    r.topic,
    r.ce_credits,
    r.date_completed ?? "",
    r.quiz_score ?? "",
    r.total_attempts,
    r.evaluation_submitted ? "Yes" : "No",
    r.evaluation_submitted_at ?? "",
    kLabel(r.knowledge_before),
    kLabel(r.knowledge_after),
    yn(r.new_information),
    sLabel(r.overall_speaker_rating),
    yn(r.would_take_again),
    yn(r.would_recommend),
  ]);

  const csv = buildCsv(HEADERS, dataRows);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="globalflexinars-completions-${todayStamp()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
