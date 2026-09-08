import { redirect } from "next/navigation";
import {
  getEnrollmentByToken,
  getCourseQuestions,
  getQuizAttemptCount,
  hasEvaluation,
} from "@/lib/queries";
import Stepper from "../../_components/Stepper";
import CourseInfoCard from "../../_components/CourseInfoCard";
import InvalidLink from "../../_components/InvalidLink";
import QuizClient from "./QuizClient";
import { submitQuiz } from "../actions";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const enrollment = await getEnrollmentByToken(token);

  if (!enrollment) return <InvalidLink />;
  // Only bounce fully-finished participants (passed AND evaluated) to the
  // completion screen. A freshly-passed learner must stay here so the
  // client-side results view (rationales + "Continue to Evaluation") can show —
  // the quiz server action re-renders this page, so redirecting purely on
  // "passed" would skip the results display.
  if (enrollment.status === "passed" && (await hasEvaluation(enrollment.id))) {
    redirect(`/course/${token}/complete`);
  }

  const questions = await getCourseQuestions(enrollment.course_id);
  const attemptNumber = (await getQuizAttemptCount(enrollment.id)) + 1;

  return (
    <>
      <Stepper current={2} />
      <CourseInfoCard enrollment={enrollment} showClinician />
      <QuizClient
        token={token}
        attemptNumber={attemptNumber}
        passingScore={enrollment.passing_score ?? 60}
        questions={questions.map((q) => ({
          id: q.id!,
          position: q.position,
          question_text: q.question_text,
        }))}
        submitAction={submitQuiz}
      />
    </>
  );
}
