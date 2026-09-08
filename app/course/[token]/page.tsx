import { getEnrollmentByToken } from "@/lib/queries";
import Stepper from "../_components/Stepper";
import CourseInfoCard from "../_components/CourseInfoCard";
import InvalidLink from "../_components/InvalidLink";
import CourseLanding from "./CourseLanding";
import { saveClinicianInfo } from "./actions";

export default async function CourseLandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const enrollment = await getEnrollmentByToken(token);

  if (!enrollment) return <InvalidLink />;

  // Extract the Synthesia video id from the stored share URL so we can build
  // the /embeds/videos/ iframe src. Falls back to the raw url if no match.
  const videoId =
    enrollment.video_url.match(/([0-9a-f-]{36})/i)?.[1] ?? enrollment.video_url;
  const gateSeconds = parseInt(
    process.env.NEXT_PUBLIC_VIDEO_GATE_SECONDS ?? "300",
    10
  );

  return (
    <>
      <Stepper current={1} />
      <CourseInfoCard enrollment={enrollment} />
      <CourseLanding
        token={token}
        gateSeconds={Number.isFinite(gateSeconds) ? gateSeconds : 300}
        videoId={videoId}
        defaults={{
          clinician_name: enrollment.clinician_name ?? "",
          professional_title: enrollment.professional_title ?? "",
          location: enrollment.location ?? "",
          date_completed: enrollment.date_completed ?? "",
        }}
        saveAction={saveClinicianInfo}
      />
    </>
  );
}
