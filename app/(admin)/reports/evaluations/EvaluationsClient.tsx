"use client";

import React, { useState } from "react";
import type {
  LikertSummary,
  SectionCSummary,
  EvaluationRecord,
  CategoryCount,
} from "../../../../lib/queries";
import {
  KNOWLEDGE_LABELS,
  SPEAKER_RATING_LABELS,
  knowledgeLabel,
  speakerLabel,
  yesNo,
  formatDate,
} from "../_components/format";

// 1..5 response colors (Strongly Disagree → Strongly Agree).
const SEG_COLORS = [
  "bg-red-500",
  "bg-orange-400",
  "bg-yellow-400",
  "bg-lime-500",
  "bg-green-600",
];
const SCALE_LABELS = [
  "Strongly Disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly Agree",
];

const SECTION_LABELS: Record<string, string> = {
  learning_objective: "Section A — Learning Objectives",
  content_speaker: "Section B — Course Content & Speaker",
};

function DistBar({ dist, total }: { dist: number[]; total: number }) {
  if (total === 0) {
    return <div className="h-4 w-full rounded bg-gray-100 dark:bg-white/[0.06]" />;
  }
  return (
    <div className="flex h-4 w-full overflow-hidden rounded">
      {dist.map((n, i) =>
        n > 0 ? (
          <div
            key={i}
            className={SEG_COLORS[i]}
            style={{ width: `${(n / total) * 100}%` }}
            title={`${SCALE_LABELS[i]}: ${n}`}
          />
        ) : null
      )}
    </div>
  );
}

function LikertTable({
  title,
  items,
}: {
  title: string;
  items: LikertSummary[];
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
        {title}
      </h3>
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 dark:bg-white/[0.03]">
            <tr>
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="w-20 px-4 py-3 text-center font-medium">Avg</th>
              <th className="w-16 px-4 py-3 text-center font-medium">N</th>
              <th className="w-56 px-4 py-3 font-medium">Distribution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-gray-500"
                >
                  No responses yet.
                </td>
              </tr>
            ) : (
              items.map((it) => (
                <tr key={it.item_key}>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {it.item_text}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-800 dark:text-white/90">
                    {it.average == null ? "—" : it.average.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">
                    {it.count}
                  </td>
                  <td className="px-4 py-3">
                    <DistBar dist={it.dist} total={it.count} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoryBars({
  data,
  total,
  labels,
}: {
  data: CategoryCount[];
  total: number;
  labels: Record<string, string>;
}) {
  // Preserve a stable order matching the label map.
  const order = Object.keys(labels);
  const map = new Map(data.map((d) => [d.value, d.count]));
  return (
    <div className="space-y-2">
      {order.map((key) => {
        const count = map.get(key) ?? 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-xs text-gray-500">
              {labels[key]}
            </span>
            <div className="h-4 flex-1 overflow-hidden rounded bg-gray-100 dark:bg-white/[0.06]">
              <div
                className="h-full rounded bg-blue-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-16 shrink-0 text-right text-xs text-gray-500">
              {count} ({pct}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}

function YesNoBars({
  yes,
  no,
}: {
  yes: number;
  no: number;
}) {
  const total = yes + no;
  const rows = [
    { label: "Yes", count: yes, color: "bg-green-500" },
    { label: "No", count: no, color: "bg-gray-400" },
  ];
  return (
    <div className="space-y-2">
      {rows.map((r) => {
        const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
        return (
          <div key={r.label} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-xs text-gray-500">
              {r.label}
            </span>
            <div className="h-4 flex-1 overflow-hidden rounded bg-gray-100 dark:bg-white/[0.06]">
              <div
                className={`h-full rounded ${r.color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-16 shrink-0 text-right text-xs text-gray-500">
              {r.count} ({pct}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SummaryCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
        {title}
      </h3>
      {children}
    </div>
  );
}

function FreeText({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
        {value}
      </p>
    </div>
  );
}

function RecordRow({ rec }: { rec: EvaluationRecord }) {
  const [open, setOpen] = useState(false);
  const hasFreeText =
    rec.most_valuable_concept ||
    rec.clinical_application ||
    rec.needs_more_detail ||
    rec.enjoyed_most ||
    rec.additional_topics ||
    rec.additional_comments ||
    rec.commercial_bias_explanation;
  return (
    <div className="border-b border-gray-100 last:border-0 dark:border-gray-800">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/[0.03]"
      >
        <span className="flex-1">
          <span className="font-medium text-gray-800 dark:text-white/90">
            {rec.clinician_name}
          </span>
          <span className="ml-2 text-sm text-gray-500">{rec.course_title}</span>
        </span>
        <span className="text-sm text-gray-400">
          {formatDate(rec.submitted_at)}
        </span>
        {rec.perceived_commercial_bias ? (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400">
            Bias flagged
          </span>
        ) : null}
        <span className="text-xs text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open ? (
        <div className="space-y-4 bg-gray-50 px-4 py-4 dark:bg-white/[0.02]">
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-gray-500">
                Knowledge Before
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                {knowledgeLabel(rec.knowledge_before)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">
                Knowledge After
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                {knowledgeLabel(rec.knowledge_after)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Speaker Rating</p>
              <p className="text-gray-700 dark:text-gray-300">
                {speakerLabel(rec.overall_speaker_rating)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">New Information</p>
              <p className="text-gray-700 dark:text-gray-300">
                {yesNo(rec.new_information)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Would Take Again</p>
              <p className="text-gray-700 dark:text-gray-300">
                {yesNo(rec.would_take_again)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Would Recommend</p>
              <p className="text-gray-700 dark:text-gray-300">
                {yesNo(rec.would_recommend)}
              </p>
            </div>
          </div>
          {hasFreeText ? (
            <div className="space-y-3 border-t border-gray-200 pt-3 dark:border-gray-700">
              <FreeText
                label="Most valuable concept"
                value={rec.most_valuable_concept}
              />
              <FreeText
                label="Clinical application"
                value={rec.clinical_application}
              />
              <FreeText
                label="Needs more detail"
                value={rec.needs_more_detail}
              />
              <FreeText label="Enjoyed most" value={rec.enjoyed_most} />
              <FreeText
                label="Additional topics"
                value={rec.additional_topics}
              />
              <FreeText
                label="Additional comments"
                value={rec.additional_comments}
              />
              <FreeText
                label="Commercial bias explanation"
                value={rec.commercial_bias_explanation}
              />
            </div>
          ) : (
            <p className="text-sm text-gray-400">No free-text responses.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function EvaluationsClient({
  likert,
  sectionC,
  records,
}: {
  likert: LikertSummary[];
  sectionC: SectionCSummary | null;
  records: EvaluationRecord[];
}) {
  const [query, setQuery] = useState("");
  const sectionA = likert.filter((l) => l.section === "learning_objective");
  const sectionB = likert.filter((l) => l.section === "content_speaker");

  const filtered = records.filter((r) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      r.clinician_name.toLowerCase().includes(q) ||
      r.course_title.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Likert summaries */}
      <section className="space-y-5">
        <LikertTable
          title={SECTION_LABELS.learning_objective}
          items={sectionA}
        />
        <LikertTable title={SECTION_LABELS.content_speaker} items={sectionB} />
        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
          {SCALE_LABELS.map((label, i) => (
            <span key={label} className="flex items-center gap-1.5">
              <span
                className={`inline-block h-3 w-3 rounded-sm ${SEG_COLORS[i]}`}
              />
              {i + 1} — {label}
            </span>
          ))}
        </div>
      </section>

      {/* Section C summary */}
      {sectionC ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Section C — Overall Assessment ({sectionC.total} evaluations)
          </h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SummaryCard title="Knowledge Before">
              <CategoryBars
                data={sectionC.knowledgeBefore}
                total={sectionC.total}
                labels={KNOWLEDGE_LABELS}
              />
            </SummaryCard>
            <SummaryCard title="Knowledge After">
              <CategoryBars
                data={sectionC.knowledgeAfter}
                total={sectionC.total}
                labels={KNOWLEDGE_LABELS}
              />
            </SummaryCard>
            <SummaryCard title="Overall Speaker Rating">
              <CategoryBars
                data={sectionC.speakerRating}
                total={sectionC.total}
                labels={SPEAKER_RATING_LABELS}
              />
            </SummaryCard>
            <SummaryCard title="Presented New Information">
              <YesNoBars
                yes={sectionC.newInformation.yes}
                no={sectionC.newInformation.no}
              />
            </SummaryCard>
            <SummaryCard title="Would Take This Course Again">
              <YesNoBars
                yes={sectionC.wouldTakeAgain.yes}
                no={sectionC.wouldTakeAgain.no}
              />
            </SummaryCard>
            <SummaryCard title="Would Recommend to a Colleague">
              <YesNoBars
                yes={sectionC.wouldRecommend.yes}
                no={sectionC.wouldRecommend.no}
              />
            </SummaryCard>
          </div>
        </section>
      ) : null}

      {/* Individual records */}
      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Individual Evaluations ({records.length})
          </h2>
          <input
            type="text"
            placeholder="Filter by clinician or course…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-72 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </div>
        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-500">
              {records.length === 0
                ? "No evaluations submitted yet."
                : "No evaluations match your filter."}
            </p>
          ) : (
            filtered.map((rec) => <RecordRow key={rec.id} rec={rec} />)
          )}
        </div>
      </section>
    </div>
  );
}
