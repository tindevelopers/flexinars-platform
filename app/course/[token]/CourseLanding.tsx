"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { SaveClinicianState } from "./actions";

interface Defaults {
  clinician_name: string;
  professional_title: string;
  location: string;
  date_completed: string;
}

const SAVE_KEY = (t: string) => `gf_saved_${t}`;
const WATCHED_KEY = (t: string) => `gf_video_watched_${t}`;

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function CourseLanding({
  token,
  gateSeconds,
  videoId,
  defaults,
  saveAction,
}: {
  token: string;
  gateSeconds: number;
  videoId: string;
  defaults: Defaults;
  saveAction: (
    token: string,
    prev: SaveClinicianState,
    formData: FormData
  ) => Promise<SaveClinicianState>;
}) {
  const boundAction = useMemo(() => saveAction.bind(null, token), [saveAction, token]);
  const [state, formAction, pending] = useActionState<SaveClinicianState, FormData>(
    boundAction,
    { ok: false }
  );

  const [revealed, setRevealed] = useState(false);
  const [watched, setWatched] = useState(false);
  const [remaining, setRemaining] = useState(gateSeconds);
  const [dateValue, setDateValue] = useState(defaults.date_completed);

  // Restore prior progress from localStorage after mount (avoids hydration mismatch).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const alreadyWatched = window.localStorage.getItem(WATCHED_KEY(token)) === "true";
    const alreadySaved = window.localStorage.getItem(SAVE_KEY(token)) === "true";
    if (alreadyWatched) {
      setRevealed(true);
      setWatched(true);
      setRemaining(0);
    } else if (alreadySaved) {
      setRevealed(true);
    }
    if (!dateValue) {
      setDateValue(new Date().toISOString().slice(0, 10));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // When the save action succeeds, reveal the video and remember it.
  useEffect(() => {
    if (state.ok) {
      setRevealed(true);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SAVE_KEY(token), "true");
      }
    }
  }, [state.ok, token]);

  // Countdown gate — runs once the video is revealed and not yet fully watched.
  useEffect(() => {
    if (!revealed || watched) return;
    if (remaining <= 0) {
      setWatched(true);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(WATCHED_KEY(token), "true");
      }
      return;
    }
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [revealed, watched, remaining, token]);

  const fieldErr = state.fieldErrors ?? {};
  const pct = gateSeconds > 0 ? ((gateSeconds - remaining) / gateSeconds) * 100 : 100;

  return (
    <div className="space-y-6">
      {/* Clinician info form */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-slate-900">
          Your Information
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Please confirm your details before watching the course video. All
          fields are required.
        </p>

        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Clinician Name"
              name="clinician_name"
              defaultValue={defaults.clinician_name}
              error={fieldErr.clinician_name}
              disabled={revealed}
            />
            <Field
              label="Professional Title"
              name="professional_title"
              defaultValue={defaults.professional_title}
              error={fieldErr.professional_title}
              disabled={revealed}
            />
            <Field
              label="Location Taking Course From"
              name="location"
              defaultValue={defaults.location}
              error={fieldErr.location}
              disabled={revealed}
            />
            <div className="flex flex-col">
              <label
                htmlFor="date_completed"
                className="mb-1 text-sm font-medium text-slate-700"
              >
                Date Completed
              </label>
              <input
                id="date_completed"
                name="date_completed"
                type="date"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                disabled={revealed}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
              />
              {fieldErr.date_completed && (
                <span className="mt-1 text-xs text-red-600">
                  {fieldErr.date_completed}
                </span>
              )}
            </div>
          </div>

          {state.error && !state.ok && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}

          {!revealed && (
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save & Watch Video"}
            </button>
          )}
          {revealed && (
            <p className="text-sm font-medium text-green-700">
              ✓ Information saved. You may watch the video below.
            </p>
          )}
        </form>
      </section>

      {/* Video section */}
      {revealed && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-slate-900">
            Course Video
          </h2>
          <iframe
            src={`https://share.synthesia.io/embeds/videos/${videoId}`}
            loading="lazy"
            title="Bruxism Reframed"
            allowFullScreen
            allow="encrypted-media; fullscreen;"
            style={{
              width: "100%",
              aspectRatio: "16 / 9",
              border: "none",
              borderRadius: "8px",
            }}
          />

          <div className="mt-5">
            {!watched ? (
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                  <span>Please watch the full video.</span>
                  <span className="font-medium text-slate-800">
                    Quiz unlocks in {fmt(remaining)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-1000 ease-linear"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <button
                  type="button"
                  disabled
                  className="mt-4 cursor-not-allowed rounded-md bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-400"
                >
                  Proceed to Quiz →
                </button>
              </div>
            ) : (
              <div>
                <p className="mb-3 text-sm font-medium text-green-700">
                  ✓ Video complete. You may now proceed to the quiz.
                </p>
                <Link
                  href={`/course/${token}/quiz`}
                  className="inline-block rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Proceed to Quiz →
                </Link>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  error,
  disabled,
}: {
  label: string;
  name: string;
  defaultValue: string;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <label htmlFor={name} className="mb-1 text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        defaultValue={defaultValue}
        disabled={disabled}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
      />
      {error && <span className="mt-1 text-xs text-red-600">{error}</span>}
    </div>
  );
}
