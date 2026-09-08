import { getEnrollmentByToken, getLatestQuizAttempt } from "@/lib/queries";
import Stepper from "../../_components/Stepper";
import InvalidLink from "../../_components/InvalidLink";

export default async function CompletePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const enrollment = await getEnrollmentByToken(token);
  if (!enrollment) return <InvalidLink />;

  const attempt = await getLatestQuizAttempt(enrollment.id);

  return (
    <>
      <Stepper current={4} />
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">
          ✓
        </div>
        <h1 className="mb-2 text-xl font-bold text-slate-900">
          Thank you. Your course evaluation for {enrollment.course_title} has
          been submitted successfully.
        </h1>

        <div className="mx-auto mt-6 max-w-md space-y-2 rounded-md bg-slate-50 p-5 text-left text-sm">
          <Row label="Clinician" value={enrollment.clinician_name} />
          <Row label="Course" value={enrollment.course_title} />
          {attempt && (
            <>
              <Row
                label="Quiz Score"
                value={`${attempt.score}%`}
              />
              <Row
                label="Result"
                value={attempt.passed ? "Passed ✓" : "Not passed"}
              />
            </>
          )}
        </div>

        <p className="mx-auto mt-6 max-w-md rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Note: No CE certificate is issued during this pre-application trial.
        </p>

        <p className="mt-8 text-xs font-medium text-slate-400">
          Global Flexinars Inc. | CE That Travels With You
        </p>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="text-right text-slate-900">{value}</span>
    </div>
  );
}
