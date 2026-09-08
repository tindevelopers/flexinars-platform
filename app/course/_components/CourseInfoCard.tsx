import type { ParticipantEnrollment } from "@/lib/queries";

/**
 * Read-only course info card shown at the top of every participant step.
 * Delivery Format is fixed for the self-instructional video CE format.
 */
export default function CourseInfoCard({
  enrollment,
  showClinician = false,
}: {
  enrollment: ParticipantEnrollment;
  showClinician?: boolean;
}) {
  const rows: [string, string][] = [
    ["Provider", enrollment.provider],
    ["Speaker", enrollment.speaker],
    ["Topic", enrollment.topic],
    ["Delivery Format", "Self-Instructional – Video"],
  ];

  return (
    <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h1 className="mb-4 text-lg font-bold text-slate-900">
        {enrollment.course_title}
      </h1>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-col">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {label}
            </dt>
            <dd className="text-sm text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>

      {showClinician && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            <div className="flex flex-col">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Clinician
              </dt>
              <dd className="text-sm text-slate-800">
                {enrollment.clinician_name}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Professional Title
              </dt>
              <dd className="text-sm text-slate-800">
                {enrollment.professional_title}
              </dd>
            </div>
            {enrollment.location && (
              <div className="flex flex-col">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Location
                </dt>
                <dd className="text-sm text-slate-800">{enrollment.location}</dd>
              </div>
            )}
            {enrollment.date_completed && (
              <div className="flex flex-col">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Date Completed
                </dt>
                <dd className="text-sm text-slate-800">
                  {enrollment.date_completed}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </section>
  );
}
