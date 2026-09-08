"use client";

import { useActionState, useMemo, useState } from "react";
import type { EvaluationState } from "../actions";
import {
  LEARNING_OBJECTIVES,
  CONTENT_SPEAKER,
  LIKERT_SCALE,
  KNOWLEDGE_LEVELS,
  SPEAKER_RATINGS,
  type LikertItem,
} from "../../_components/evaluationItems";

export default function EvaluationClient({
  token,
  submitAction,
}: {
  token: string;
  submitAction: (
    token: string,
    prev: EvaluationState,
    formData: FormData
  ) => Promise<EvaluationState>;
}) {
  const boundAction = useMemo(
    () => submitAction.bind(null, token),
    [submitAction, token]
  );
  const [state, formAction, pending] = useActionState<EvaluationState, FormData>(
    boundAction,
    { ok: false }
  );
  const [bias, setBias] = useState<"yes" | "no">("no");

  return (
    <form action={formAction} className="space-y-8">
      {/* Section A */}
      <Section
        title="Section A: Learning Objectives"
        subtitle="Please indicate the extent to which you agree with each statement after completing this course."
      >
        <ScaleLegend />
        <div className="space-y-3">
          {LEARNING_OBJECTIVES.map((item) => (
            <LikertRow key={item.key} item={item} />
          ))}
        </div>
      </Section>

      {/* Section B */}
      <Section
        title="Section B: Course Content & Speaker Evaluation"
        subtitle="Please rate each statement using the same scale."
      >
        <ScaleLegend />
        <div className="space-y-3">
          {CONTENT_SPEAKER.map((item) => (
            <LikertRow key={item.key} item={item} />
          ))}
        </div>
      </Section>

      {/* Section C */}
      <Section title="Section C: Learning & Practice Impact">
        <div className="space-y-5">
          <RadioGroup
            name="knowledge_before"
            label="Rate your knowledge of this topic BEFORE completing the course:"
            options={KNOWLEDGE_LEVELS}
          />
          <RadioGroup
            name="knowledge_after"
            label="Rate your knowledge of this topic AFTER completing the course:"
            options={KNOWLEDGE_LEVELS}
          />
          <RadioGroup
            name="new_information"
            label="Did this course provide new information that will enhance your practice?"
            options={YES_NO}
          />
          <RadioGroup
            name="overall_speaker_rating"
            label="Overall rating of the speaker:"
            options={SPEAKER_RATINGS}
          />
          <RadioGroup
            name="would_take_again"
            label="Would you take another CE course by this presenter?"
            options={YES_NO}
          />
          <RadioGroup
            name="would_recommend"
            label="Would you recommend this course to another dental professional?"
            options={YES_NO}
          />
          <TextArea
            name="most_valuable_concept"
            label="What was the most valuable concept or clinical takeaway from this course?"
            optional
          />
          <TextArea
            name="clinical_application"
            label="How do you anticipate applying what you learned about bruxism and occlusion to your clinical assessment and treatment planning?"
            optional
          />
          <TextArea
            name="needs_more_detail"
            label="Was there any area of the course that would benefit from additional detail or clarification?"
            optional
          />
        </div>
      </Section>

      {/* Section D */}
      <Section title="Section D: Educational Independence / Commercial Bias">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-800">
            Did you perceive any commercial bias or inappropriate promotion of a
            specific product, company, or proprietary service during this
            educational activity?
          </p>
          <div className="flex gap-6">
            {(["no", "yes"] as const).map((val) => (
              <label
                key={val}
                className="flex cursor-pointer items-center gap-2 text-sm text-slate-800"
              >
                <input
                  type="radio"
                  name="perceived_commercial_bias"
                  value={val}
                  checked={bias === val}
                  onChange={() => setBias(val)}
                  required
                  className="h-4 w-4 accent-blue-600"
                />
                {val === "yes" ? "Yes" : "No"}
              </label>
            ))}
          </div>
          {bias === "yes" && (
            <TextArea
              name="commercial_bias_explanation"
              label="If YES, please explain:"
            />
          )}
        </div>
      </Section>

      {/* Section E */}
      <Section title="Section E: General Feedback">
        <div className="space-y-5">
          <TextArea
            name="enjoyed_most"
            label="What did you enjoy most about the course?"
            optional
          />
          <TextArea
            name="additional_topics"
            label="What additional topics would you like Global Flexinars to offer?"
            optional
          />
          <TextArea
            name="additional_comments"
            label="Additional comments or suggestions:"
            optional
          />
        </div>
      </Section>

      {state.error && (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit Evaluation"}
      </button>
    </form>
  );
}

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-1 mb-4 text-sm text-slate-500">{subtitle}</p>}
      <div className={subtitle ? "" : "mt-4"}>{children}</div>
    </section>
  );
}

function ScaleLegend() {
  return (
    <p className="mb-4 text-xs text-slate-500">
      Scale: 1 = Strongly Disagree, 2 = Disagree, 3 = Neutral, 4 = Agree, 5 =
      Strongly Agree
    </p>
  );
}

function LikertRow({ item }: { item: LikertItem }) {
  return (
    <fieldset className="rounded-md border border-slate-100 bg-slate-50 p-3">
      <legend className="sr-only">{item.text}</legend>
      <p className="mb-2 text-sm text-slate-800">{item.text}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {LIKERT_SCALE.map((s) => (
          <label
            key={s.value}
            className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-700"
          >
            <input
              type="radio"
              name={item.key}
              value={s.value}
              required
              className="h-4 w-4 accent-blue-600"
            />
            <span className="font-medium">{s.value}</span>
            <span className="hidden sm:inline text-slate-500">{s.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function RadioGroup({
  name,
  label,
  options,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-slate-800">{label}</legend>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {options.map((o) => (
          <label
            key={o.value}
            className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              required
              className="h-4 w-4 accent-blue-600"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function TextArea({
  name,
  label,
  optional,
}: {
  name: string;
  label: string;
  optional?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <label htmlFor={name} className="mb-1 text-sm font-medium text-slate-800">
        {label}
        {optional && (
          <span className="ml-1 text-xs font-normal text-slate-400">
            (optional)
          </span>
        )}
      </label>
      <textarea
        id={name}
        name={name}
        rows={3}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}
