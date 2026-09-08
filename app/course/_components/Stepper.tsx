const STEPS = ["Watch Video", "Quiz", "Evaluation", "Complete"] as const;

/**
 * Horizontal progress indicator shown at the top of every participant step.
 * `current` is 1-based (1 = Watch Video … 4 = Complete).
 */
export default function Stepper({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <ol className="mb-8 flex items-center gap-2 sm:gap-3">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
              <span
                className={[
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  done
                    ? "bg-green-600 text-white"
                    : active
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-500",
                ].join(" ")}
              >
                {done ? "✓" : step}
              </span>
              <span
                className={[
                  "text-center text-[11px] font-medium sm:text-xs",
                  active
                    ? "text-blue-700"
                    : done
                      ? "text-green-700"
                      : "text-slate-400",
                ].join(" ")}
              >
                Step {step}: {label}
              </span>
            </div>
            {step < STEPS.length && (
              <span
                className={[
                  "hidden h-0.5 flex-1 rounded sm:block",
                  done ? "bg-green-600" : "bg-slate-200",
                ].join(" ")}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
