"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { query, withTransaction } from "@/lib/db";
import {
  getEnrollmentByToken,
  getCourseQuestions,
  getQuizAttemptCount,
  hasEvaluation,
} from "@/lib/queries";
import {
  LEARNING_OBJECTIVES,
  CONTENT_SPEAKER,
} from "../_components/evaluationItems";

// ---------------------------------------------------------------------------
// Step 1 — Save clinician info (unlocks the video)
// ---------------------------------------------------------------------------

export interface SaveClinicianState {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function saveClinicianInfo(
  token: string,
  _prev: SaveClinicianState,
  formData: FormData
): Promise<SaveClinicianState> {
  const enrollment = await getEnrollmentByToken(token);
  if (!enrollment) return { ok: false, error: "Invalid or expired link." };

  const clinicianName = String(formData.get("clinician_name") ?? "").trim();
  const professionalTitle = String(
    formData.get("professional_title") ?? ""
  ).trim();
  const location = String(formData.get("location") ?? "").trim();
  const dateCompleted = String(formData.get("date_completed") ?? "").trim();

  const fieldErrors: Record<string, string> = {};
  if (!clinicianName) fieldErrors.clinician_name = "Clinician name is required.";
  if (!professionalTitle)
    fieldErrors.professional_title = "Professional title is required.";
  if (!location) fieldErrors.location = "Location is required.";
  if (!dateCompleted) fieldErrors.date_completed = "Date completed is required.";
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "Please complete all required fields.", fieldErrors };
  }

  const newStatus = enrollment.status === "invited" ? "in_progress" : enrollment.status;

  await query(
    `UPDATE enrollments
     SET clinician_name = $1,
         professional_title = $2,
         location = $3,
         date_completed = $4,
         status = $5,
         updated_at = now()
     WHERE id = $6`,
    [clinicianName, professionalTitle, location, dateCompleted, newStatus, enrollment.id]
  );

  revalidatePath(`/course/${token}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Step 2 — Submit quiz (scores, records attempt, returns per-question results)
// ---------------------------------------------------------------------------

export interface QuizQuestionResult {
  id: string;
  position: number;
  question_text: string;
  correct_answer: boolean;
  rationale: string;
  learner_answer: boolean;
  is_correct: boolean;
}

export interface QuizState {
  ok: boolean;
  error?: string;
  submitted?: boolean;
  score?: number; // percentage 0-100
  correctCount?: number;
  total?: number;
  passed?: boolean;
  attemptNumber?: number;
  results?: QuizQuestionResult[];
}

export async function submitQuiz(
  token: string,
  _prev: QuizState,
  formData: FormData
): Promise<QuizState> {
  const enrollment = await getEnrollmentByToken(token);
  if (!enrollment) return { ok: false, error: "Invalid or expired link." };

  const questions = await getCourseQuestions(enrollment.course_id);
  if (questions.length === 0)
    return { ok: false, error: "No quiz questions found for this course." };

  // Read + validate every answer before scoring.
  const answers = new Map<string, boolean>();
  for (const q of questions) {
    const raw = formData.get(`q_${q.id}`);
    if (raw !== "true" && raw !== "false") {
      return { ok: false, error: "Please answer all questions before submitting." };
    }
    answers.set(q.id!, raw === "true");
  }

  let correctCount = 0;
  const results: QuizQuestionResult[] = questions.map((q) => {
    const learner = answers.get(q.id!)!;
    const isCorrect = learner === q.correct_answer;
    if (isCorrect) correctCount++;
    return {
      id: q.id!,
      position: q.position,
      question_text: q.question_text,
      correct_answer: q.correct_answer,
      rationale: q.rationale,
      learner_answer: learner,
      is_correct: isCorrect,
    };
  });

  const total = questions.length;
  const score = Math.round((correctCount / total) * 100);
  const passingScore = enrollment.passing_score ?? 60;
  const passed = score >= passingScore;
  const attemptNumber = (await getQuizAttemptCount(enrollment.id)) + 1;

  await withTransaction(async (client) => {
    const attemptRows = await client.query<{ id: string }>(
      `INSERT INTO quiz_attempts (enrollment_id, attempt_number, score, passed)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [enrollment.id, attemptNumber, score, passed]
    );
    const attemptId = attemptRows.rows[0].id;

    for (const r of results) {
      await client.query(
        `INSERT INTO quiz_answers (attempt_id, question_id, answer, is_correct)
         VALUES ($1, $2, $3, $4)`,
        [attemptId, r.id, r.learner_answer, r.is_correct]
      );
    }

    if (passed) {
      await client.query(
        `UPDATE enrollments SET status = 'passed', completed_at = now(), updated_at = now()
         WHERE id = $1`,
        [enrollment.id]
      );
    } else {
      await client.query(
        `UPDATE enrollments SET status = 'in_progress', updated_at = now() WHERE id = $1`,
        [enrollment.id]
      );
    }
  });

  revalidatePath(`/course/${token}/quiz`);
  return {
    ok: true,
    submitted: true,
    score,
    correctCount,
    total,
    passed,
    attemptNumber,
    results,
  };
}

// ---------------------------------------------------------------------------
// Step 3 — Submit course evaluation
// ---------------------------------------------------------------------------

export interface EvaluationState {
  ok: boolean;
  error?: string;
}

function parseYesNo(v: FormDataEntryValue | null): boolean | null {
  if (v === "yes") return true;
  if (v === "no") return false;
  return null;
}

export async function submitEvaluation(
  token: string,
  _prev: EvaluationState,
  formData: FormData
): Promise<EvaluationState> {
  const enrollment = await getEnrollmentByToken(token);
  if (!enrollment) return { ok: false, error: "Invalid or expired link." };
  if (enrollment.status !== "passed")
    return { ok: false, error: "You must pass the quiz before submitting the evaluation." };
  if (await hasEvaluation(enrollment.id)) redirect(`/course/${token}/complete`);

  // Likert responses (Sections A + B) — all required, 1..5.
  const likert: { section: string; key: string; text: string; response: number }[] = [];
  for (const item of LEARNING_OBJECTIVES) {
    const n = parseInt(String(formData.get(item.key) ?? ""), 10);
    if (!(n >= 1 && n <= 5))
      return { ok: false, error: "Please rate every statement in Section A." };
    likert.push({ section: "learning_objective", key: item.key, text: item.text, response: n });
  }
  for (const item of CONTENT_SPEAKER) {
    const n = parseInt(String(formData.get(item.key) ?? ""), 10);
    if (!(n >= 1 && n <= 5))
      return { ok: false, error: "Please rate every statement in Section B." };
    likert.push({ section: "content_speaker", key: item.key, text: item.text, response: n });
  }

  // Section C scalars — required.
  const knowledgeBefore = String(formData.get("knowledge_before") ?? "");
  const knowledgeAfter = String(formData.get("knowledge_after") ?? "");
  const newInformation = parseYesNo(formData.get("new_information"));
  const overallSpeakerRating = String(formData.get("overall_speaker_rating") ?? "");
  const wouldTakeAgain = parseYesNo(formData.get("would_take_again"));
  const wouldRecommend = parseYesNo(formData.get("would_recommend"));

  const KNOWLEDGE = ["none", "novice", "competent", "proficient"];
  const RATINGS = ["poor", "below_average", "average", "above_average", "excellent"];
  if (!KNOWLEDGE.includes(knowledgeBefore) || !KNOWLEDGE.includes(knowledgeAfter))
    return { ok: false, error: "Please rate your knowledge before and after the course." };
  if (newInformation === null || wouldTakeAgain === null || wouldRecommend === null)
    return { ok: false, error: "Please answer all Yes/No questions in Section C." };
  if (!RATINGS.includes(overallSpeakerRating))
    return { ok: false, error: "Please provide an overall rating of the speaker." };

  // Optional free-text (Section C + E).
  const mostValuableConcept = String(formData.get("most_valuable_concept") ?? "").trim() || null;
  const clinicalApplication = String(formData.get("clinical_application") ?? "").trim() || null;
  const needsMoreDetail = String(formData.get("needs_more_detail") ?? "").trim() || null;
  const enjoyedMost = String(formData.get("enjoyed_most") ?? "").trim() || null;
  const additionalTopics = String(formData.get("additional_topics") ?? "").trim() || null;
  const additionalComments = String(formData.get("additional_comments") ?? "").trim() || null;

  // Section D — commercial bias (default No) + conditional explanation.
  const perceivedBias = parseYesNo(formData.get("perceived_commercial_bias")) ?? false;
  const biasExplanation = perceivedBias
    ? String(formData.get("commercial_bias_explanation") ?? "").trim() || null
    : null;

  await withTransaction(async (client) => {
    const evalRows = await client.query<{ id: string }>(
      `INSERT INTO course_evaluations (
         enrollment_id, knowledge_before, knowledge_after, new_information,
         overall_speaker_rating, would_take_again, would_recommend,
         most_valuable_concept, clinical_application, needs_more_detail,
         perceived_commercial_bias, commercial_bias_explanation,
         enjoyed_most, additional_topics, additional_comments
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING id`,
      [
        enrollment.id,
        knowledgeBefore,
        knowledgeAfter,
        newInformation,
        overallSpeakerRating,
        wouldTakeAgain,
        wouldRecommend,
        mostValuableConcept,
        clinicalApplication,
        needsMoreDetail,
        perceivedBias,
        biasExplanation,
        enjoyedMost,
        additionalTopics,
        additionalComments,
      ]
    );
    const evaluationId = evalRows.rows[0].id;

    for (const r of likert) {
      await client.query(
        `INSERT INTO evaluation_responses (evaluation_id, section, item_key, item_text, response)
         VALUES ($1,$2,$3,$4,$5)`,
        [evaluationId, r.section, r.key, r.text, r.response]
      );
    }
  });

  revalidatePath(`/course/${token}/complete`);
  redirect(`/course/${token}/complete`);
}
