import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getEvaluationsForExport } from "@/lib/queries";
import { buildCsv, todayStamp } from "@/lib/csv";
import {
  KNOWLEDGE_LABELS,
  SPEAKER_RATING_LABELS,
} from "@/app/(admin)/reports/_components/format";

export const dynamic = "force-dynamic";

// The 14 Likert item keys, in display order (Section A then Section B).
const LIKERT_KEYS = [
  "lo_1",
  "lo_2",
  "lo_3",
  "lo_4",
  "lo_5",
  "cs_1",
  "cs_2",
  "cs_3",
  "cs_4",
  "cs_5",
  "cs_6",
  "cs_7",
  "cs_8",
  "cs_9",
];

const kLabel = (v: string | null) => (v ? KNOWLEDGE_LABELS[v] ?? v : "");
const sLabel = (v: string | null) => (v ? SPEAKER_RATING_LABELS[v] ?? v : "");
const yn = (v: boolean | null) =>
  v === null || v === undefined ? "" : v ? "Yes" : "No";

const HEADERS = [
  "Clinician Name",
  "Course Title",
  "Submitted Date",
  "Knowledge Before",
  "Knowledge After",
  "New Information (Yes/No)",
  "Speaker Rating",
  "Would Take Again (Yes/No)",
  "Would Recommend (Yes/No)",
  "Perceived Commercial Bias (Yes/No)",
  "Commercial Bias Explanation",
  "Most Valuable Concept",
  "Clinical Application",
  "Needs More Detail",
  "Enjoyed Most",
  "Additional Topics",
  "Additional Comments",
  ...LIKERT_KEYS,
];

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await getEvaluationsForExport();
  const dataRows = rows.map((r) => [
    r.clinician_name,
    r.course_title,
    r.submitted_at ?? "",
    kLabel(r.knowledge_before),
    kLabel(r.knowledge_after),
    yn(r.new_information),
    sLabel(r.overall_speaker_rating),
    yn(r.would_take_again),
    yn(r.would_recommend),
    yn(r.perceived_commercial_bias),
    r.commercial_bias_explanation ?? "",
    r.most_valuable_concept ?? "",
    r.clinical_application ?? "",
    r.needs_more_detail ?? "",
    r.enjoyed_most ?? "",
    r.additional_topics ?? "",
    r.additional_comments ?? "",
    ...LIKERT_KEYS.map((k) => r.responses[k] ?? ""),
  ]);

  const csv = buildCsv(HEADERS, dataRows);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="globalflexinars-evaluations-${todayStamp()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
