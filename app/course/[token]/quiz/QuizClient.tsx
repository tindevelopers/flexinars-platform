"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { QuizState } from "../actions";

interface QuizQuestion {
  id: string;
  position: number;
  question_text: string;
}

const WATCHED_KEY = (t: string) => `gf_video_watched_${t}`;

export default function QuizClient({
  token,
  attemptNumber,
  passingScore,
  questions,
  submitAction,
}: {
  token: string;
  attemptNumber: number;
  passingScore: number;
  questions: QuizQuestion[];
  submitAction: (
    token: string,
    prev: QuizState,
    formData: FormData
  ) => Promise<QuizState>;
}) {
  const router = useRouter();
  const boundAction = useMemo(() => submitAction.bind(null, token), [submitAction, token]);
  const [state, formAction, pending] = useActionState<QuizState, FormData>(
    boundAction,
    { ok: false }
  );

  const [ready, setReady] = useState(false);
  const [answers, setAnswers] = useState<Record<string, "true" | "false">>({});
  const [view, setView] = useState<"form" | "results">("form");
  const [currentAttempt, setCurrentAttempt] = useState(attemptNumber);

  // Video gate guard — bounce back to the landing page if not yet watched.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(WATCHED_KEY(token)) === "true") {
      setReady(true);
    } else {
      router.replace(`/course/${token}`);
    }
  }, [token, router]);

  useEffect(() => {
    if (state.submitted) setView("results");
  }, [state.submitted]);

  const allAnswered = questions.every((q) => answers[q.id]);

  function retake() {
    setAnswers({});
    setView("form");
    setCurrentAttempt((n) => n + 1);
  }

  if (!ready) {
    return (
      <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
        Loading…
      </p>
    );
  }

  // ----- Results view -----
  if (view === "results" && state.results) {
    const passed = state.passed;
    return (
      <div className="space-y-6">
        <div
          className={[
            "rounded-lg border p-5 shadow-sm",
            passed
              ? "border-green-200 bg-green-50"
              : "border-orange-200 bg-orange-50",
          ].join(" ")}
        >
          <p className="text-lg font-bold text-slate-900">
            You scored {state.correctCount}/{state.total} ({state.score}%)
          </p>
          {passed ? (
            <p className="mt-1 text-sm font-medium text-green-700">
              Congratulations! You passed.
            </p>
          ) : (
            <p className="mt-1 text-sm font-medium text-orange-700">
              You did not reach the passing score of {passingScore}%. Please
              review the rationales and try again.
            </p>
          )}
        </div>

        <ol className="space-y-4">
          {state.results.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="mb-3 font-medium text-slate-900">
                {r.position}. {r.question_text}
              </p>
              <div className="space-y-1 text-sm">
                <p
                  className={
                    r.is_correct
                      ? "font-medium text-green-700"
                      : "font-medium text-red-600"
                  }
                >
                  Your answer: {r.learner_answer ? "True" : "False"}{" "}
                  {r.is_correct ? "✓" : "✗"}
                </p>
                {!r.is_correct && (
                  <p className="font-medium text-green-700">
                    Correct answer: {r.correct_answer ? "True" : "False"}
                  </p>
                )}
                <p className="italic text-slate-600">{r.rationale}</p>
              </div>
            </li>
          ))}
        </ol>

        {passed ? (
          <Link
            href={`/course/${token}/evaluation`}
            className="inline-block rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Continue to Course Evaluation →
          </Link>
        ) : (
          <button
            type="button"
            onClick={retake}
            className="inline-block rounded-md bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
          >
            Retake Quiz
          </button>
        )}
      </div>
    );
  }

  // ----- Quiz form -----
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Knowledge Check</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          Attempt #{currentAttempt}
        </span>
      </div>

      <form action={formAction} className="space-y-4">
        {questions.map((q) => (
          <fieldset
            key={q.id}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <legend className="sr-only">Question {q.position}</legend>
            <p className="mb-3 font-medium text-slate-900">
              {q.position}. {q.question_text}
            </p>
            <div className="flex gap-6">
              {(["true", "false"] as const).map((val) => (
                <label
                  key={val}
                  className="flex cursor-pointer items-center gap-2 text-sm text-slate-800"
                >
                  <input
                    type="radio"
                    name={`q_${q.id}`}
                    value={val}
                    checked={answers[q.id] === val}
                    onChange={() =>
                      setAnswers((a) => ({ ...a, [q.id]: val }))
                    }
                    className="h-4 w-4 accent-blue-600"
                  />
                  {val === "true" ? "True" : "False"}
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        {state.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={!allAnswered || pending}
          className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Submitting…" : "Submit Quiz"}
        </button>
        {!allAnswered && (
          <p className="text-xs text-slate-500">
            Please answer all {questions.length} questions to submit.
          </p>
        )}
      </form>
    </div>
  );
}
