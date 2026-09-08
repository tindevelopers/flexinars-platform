"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { withTransaction } from "@/lib/db";
import { getDefaultTenantId } from "@/lib/queries";

const QUESTION_COUNT = 5;

export interface CourseFormState {
  ok: boolean;
  error?: string;
}

interface ParsedQuestion {
  question_text: string;
  correct_answer: boolean;
  rationale: string;
}

interface ParsedCourse {
  title: string;
  speaker: string;
  topic: string;
  video_url: string;
  video_platform: string;
  ce_credits: number;
  passing_score: number;
  is_active: boolean;
  questions: ParsedQuestion[];
}

function parseForm(formData: FormData): { data?: ParsedCourse; error?: string } {
  const title = String(formData.get("title") ?? "").trim();
  const speaker = String(formData.get("speaker") ?? "").trim();
  const topic = String(formData.get("topic") ?? "").trim();
  const video_url = String(formData.get("video_url") ?? "").trim();
  const video_platform = String(formData.get("video_platform") ?? "synthesia").trim();
  const ce_credits = parseFloat(String(formData.get("ce_credits") ?? "1"));
  const passing_score = parseInt(String(formData.get("passing_score") ?? "60"), 10);
  const is_active = formData.get("is_active") === "on" || formData.get("is_active") === "true";

  if (!title) return { error: "Title is required." };
  if (!speaker) return { error: "Speaker is required." };
  if (!topic) return { error: "Topic is required." };
  if (!video_url) return { error: "Video URL is required." };
  if (!["synthesia", "mux"].includes(video_platform))
    return { error: "Video platform must be synthesia or mux." };
  if (Number.isNaN(ce_credits) || ce_credits < 0)
    return { error: "CE credits must be a non-negative number." };
  if (Number.isNaN(passing_score) || passing_score < 0 || passing_score > 100)
    return { error: "Passing score must be between 0 and 100." };

  const questions: ParsedQuestion[] = [];
  for (let i = 1; i <= QUESTION_COUNT; i++) {
    const question_text = String(formData.get(`q${i}_text`) ?? "").trim();
    const correctRaw = String(formData.get(`q${i}_correct`) ?? "").trim();
    const rationale = String(formData.get(`q${i}_rationale`) ?? "").trim();
    if (!question_text)
      return { error: `Question ${i}: question text is required.` };
    if (correctRaw !== "true" && correctRaw !== "false")
      return { error: `Question ${i}: select the correct answer (True/False).` };
    if (!rationale)
      return { error: `Question ${i}: rationale is required.` };
    questions.push({
      question_text,
      correct_answer: correctRaw === "true",
      rationale,
    });
  }

  return {
    data: {
      title,
      speaker,
      topic,
      video_url,
      video_platform,
      ce_credits,
      passing_score,
      is_active,
      questions,
    },
  };
}

export async function createCourse(
  _prev: CourseFormState,
  formData: FormData
): Promise<CourseFormState> {
  const { data, error } = parseForm(formData);
  if (error || !data) return { ok: false, error };

  const tenantId = await getDefaultTenantId();
  if (!tenantId)
    return { ok: false, error: "No tenant found. Seed a tenant first." };

  try {
    await withTransaction(async (client) => {
      const res = await client.query<{ id: string }>(
        `INSERT INTO courses
          (tenant_id, title, provider, speaker, topic, video_url, video_platform,
           ce_credits, passing_score, is_active)
         VALUES ($1,$2,'Global Flexinars Inc.',$3,$4,$5,$6,$7,$8,$9)
         RETURNING id`,
        [
          tenantId,
          data.title,
          data.speaker,
          data.topic,
          data.video_url,
          data.video_platform,
          data.ce_credits,
          data.passing_score,
          data.is_active,
        ]
      );
      const courseId = res.rows[0].id;
      for (let i = 0; i < data.questions.length; i++) {
        const q = data.questions[i];
        await client.query(
          `INSERT INTO course_questions
            (course_id, position, question_text, correct_answer, rationale)
           VALUES ($1,$2,$3,$4,$5)`,
          [courseId, i + 1, q.question_text, q.correct_answer, q.rationale]
        );
      }
    });
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? `Could not create course: ${err.message}`
          : "Could not create course.",
    };
  }

  revalidatePath("/courses");
  revalidatePath("/learners");
  redirect("/courses");
}

export async function updateCourse(
  courseId: string,
  _prev: CourseFormState,
  formData: FormData
): Promise<CourseFormState> {
  const { data, error } = parseForm(formData);
  if (error || !data) return { ok: false, error };

  try {
    await withTransaction(async (client) => {
      await client.query(
        `UPDATE courses SET
           title = $2, speaker = $3, topic = $4, video_url = $5,
           video_platform = $6, ce_credits = $7, passing_score = $8,
           is_active = $9, updated_at = now()
         WHERE id = $1`,
        [
          courseId,
          data.title,
          data.speaker,
          data.topic,
          data.video_url,
          data.video_platform,
          data.ce_credits,
          data.passing_score,
          data.is_active,
        ]
      );
      // Replace all questions to keep positions consistent.
      await client.query(`DELETE FROM course_questions WHERE course_id = $1`, [
        courseId,
      ]);
      for (let i = 0; i < data.questions.length; i++) {
        const q = data.questions[i];
        await client.query(
          `INSERT INTO course_questions
            (course_id, position, question_text, correct_answer, rationale)
           VALUES ($1,$2,$3,$4,$5)`,
          [courseId, i + 1, q.question_text, q.correct_answer, q.rationale]
        );
      }
    });
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? `Could not update course: ${err.message}`
          : "Could not update course.",
    };
  }

  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}/edit`);
  revalidatePath("/learners");
  redirect("/courses");
}
