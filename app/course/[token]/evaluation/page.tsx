import { redirect } from "next/navigation";
import { getEnrollmentByToken, hasEvaluation } from "@/lib/queries";
import Stepper from "../../_components/Stepper";
import CourseInfoCard from "../../_components/CourseInfoCard";
import InvalidLink from "../../_components/InvalidLink";
import EvaluationClient from "./EvaluationClient";
import { submitEvaluation } from "../actions";

export default async function EvaluationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const enrollment = await getEnrollmentByToken(token);

  if (!enrollment) return <InvalidLink />;
  if (enrollment.status !== "passed") redirect(`/course/${token}/quiz`);
  if (await hasEvaluation(enrollment.id)) redirect(`/course/${token}/complete`);

  return (
    <>
      <Stepper current={3} />
      <CourseInfoCard enrollment={enrollment} showClinician />
      <EvaluationClient token={token} submitAction={submitEvaluation} />
    </>
  );
}
