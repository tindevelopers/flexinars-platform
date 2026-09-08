"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import type { CourseFormState } from "./actions";
import type { CourseDetail } from "@/lib/queries";

type Action = (
  prev: CourseFormState,
  formData: FormData,
) => Promise<CourseFormState>;

interface CourseFormProps {
  action: Action;
  course?: CourseDetail;
  submitLabel: string;
  heading: string;
}

const EMPTY_STATE: CourseFormState = { ok: false };

const labelClass =
  "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300";
const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white";

export default function CourseForm({
  action,
  course,
  submitLabel,
  heading,
}: CourseFormProps) {
  const [state, formAction, pending] = useActionState(action, EMPTY_STATE);

  const q = (i: number) => course?.questions.find((x) => x.position === i);

  return (
    <form action={formAction} className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {heading}
        </h1>
        <div className="flex gap-3">
          <Link
            href="/courses"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/[0.03]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Saving…" : submitLabel}
          </button>
        </div>
      </div>

      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {state.error}
        </div>
      )}

      {/* Course details */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-5 text-lg font-medium text-gray-900 dark:text-white">
          Course details
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="title" className={labelClass}>
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              defaultValue={course?.title ?? ""}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="provider" className={labelClass}>
              Provider
            </label>
            <input
              id="provider"
              name="provider"
              type="text"
              readOnly
              value="Global Flexinars Inc."
              className={`${inputClass} cursor-not-allowed bg-gray-100 dark:bg-gray-800/60`}
            />
          </div>

          <div>
            <label htmlFor="speaker" className={labelClass}>
              Speaker
            </label>
            <input
              id="speaker"
              name="speaker"
              type="text"
              required
              defaultValue={course?.speaker ?? ""}
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="topic" className={labelClass}>
              Topic
            </label>
            <input
              id="topic"
              name="topic"
              type="text"
              required
              defaultValue={course?.topic ?? ""}
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="video_url" className={labelClass}>
              Video URL
            </label>
            <input
              id="video_url"
              name="video_url"
              type="text"
              required
              placeholder="https://share.synthesia.io/… or MUX URL"
              defaultValue={course?.video_url ?? ""}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="video_platform" className={labelClass}>
              Video platform
            </label>
            <select
              id="video_platform"
              name="video_platform"
              defaultValue={course?.video_platform ?? "synthesia"}
              className={inputClass}
            >
              <option value="synthesia">synthesia</option>
              <option value="mux">mux</option>
            </select>
          </div>

          <div>
            <label htmlFor="ce_credits" className={labelClass}>
              CE credits
            </label>
            <input
              id="ce_credits"
              name="ce_credits"
              type="number"
              step="0.5"
              min="0"
              required
              defaultValue={course?.ce_credits ?? "1.0"}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="passing_score" className={labelClass}>
              Passing score (%)
            </label>
            <input
              id="passing_score"
              name="passing_score"
              type="number"
              min="0"
              max="100"
              required
              defaultValue={course?.passing_score ?? 60}
              className={inputClass}
            />
          </div>

          <div className="flex items-center gap-3 pt-7">
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              defaultChecked={course?.is_active ?? true}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="is_active"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Course is active
            </label>
          </div>
        </div>
      </section>

      {/* Quiz questions */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">
          Quiz questions
        </h2>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          Exactly 5 True/False questions. Each needs a correct answer and a
          rationale shown to the learner after submission.
        </p>

        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map((i) => {
            const existing = q(i);
            return (
              <div
                key={i}
                className="rounded-xl border border-gray-200 p-5 dark:border-gray-800"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    {i}
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Question {i}
                  </span>
                </div>

                <div className="mb-4">
                  <label htmlFor={`q${i}_text`} className={labelClass}>
                    Question text
                  </label>
                  <textarea
                    id={`q${i}_text`}
                    name={`q${i}_text`}
                    rows={2}
                    required
                    defaultValue={existing?.question_text ?? ""}
                    className={inputClass}
                  />
                </div>

                <div className="mb-4">
                  <span className={labelClass}>Correct answer</span>
                  <div className="flex gap-6">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="radio"
                        name={`q${i}_correct`}
                        value="true"
                        required
                        defaultChecked={existing?.correct_answer === true}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      True
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="radio"
                        name={`q${i}_correct`}
                        value="false"
                        defaultChecked={existing?.correct_answer === false}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      False
                    </label>
                  </div>
                </div>

                <div>
                  <label htmlFor={`q${i}_rationale`} className={labelClass}>
                    Rationale
                  </label>
                  <textarea
                    id={`q${i}_rationale`}
                    name={`q${i}_rationale`}
                    rows={3}
                    required
                    defaultValue={existing?.rationale ?? ""}
                    className={inputClass}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Link
          href="/courses"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/[0.03]"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
