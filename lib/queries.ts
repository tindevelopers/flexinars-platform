import "server-only";
import { query } from "./db";

export type EnrollmentStatus = "invited" | "in_progress" | "passed" | "failed";

export interface EnrollmentRow {
  id: string;
  clinician_name: string;
  professional_title: string;
  email: string;
  location: string | null;
  status: EnrollmentStatus;
  invited_at: string | null;
  completed_at: string | null;
  course_id: string;
  course_title: string;
  speaker: string;
  invite_token: string;
}

export interface CourseOption {
  id: string;
  title: string;
  speaker: string;
  topic: string;
  tenant_id: string;
}

export interface TenantRow {
  id: string;
  name: string;
  domain: string;
  status: string;
  plan: string;
  region: string;
  created_at: string;
  enrollment_count: number;
  course_count: number;
}

export interface DashboardStats {
  totalEnrollments: number;
  passedThisMonth: number;
  pending: number;
  averageQuizScore: number | null;
}

/** Paginated + filterable enrollment list joined with course info. */
export async function getEnrollments(opts: {
  status?: string;
  courseId?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ rows: EnrollmentRow[]; total: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 10));
  const offset = (page - 1) * pageSize;

  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.status && opts.status !== "all") {
    params.push(opts.status);
    where.push(`e.status = $${params.length}`);
  }
  if (opts.courseId && opts.courseId !== "all") {
    params.push(opts.courseId);
    where.push(`e.course_id = $${params.length}`);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const totalRows = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM enrollments e ${whereSql}`,
    params
  );
  const total = parseInt(totalRows[0]?.count ?? "0", 10);

  const rows = await query<EnrollmentRow>(
    `SELECT e.id, e.clinician_name, e.professional_title, e.email, e.location,
            e.status, e.invited_at, e.completed_at, e.course_id, e.invite_token,
            c.title AS course_title, c.speaker
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     ${whereSql}
     ORDER BY e.created_at DESC
     LIMIT ${pageSize} OFFSET ${offset}`,
    params
  );
  return { rows, total };
}

/** Active courses for the invite dropdown / filters. */
export async function getCourses(): Promise<CourseOption[]> {
  return query<CourseOption>(
    `SELECT id, title, speaker, topic, tenant_id
     FROM courses
     WHERE is_active = true
     ORDER BY title ASC`
  );
}

export interface CourseListRow {
  id: string;
  title: string;
  speaker: string;
  topic: string;
  ce_credits: string; // NUMERIC returned as string by pg
  is_active: boolean;
  question_count: number;
  enrollment_count: number;
}

/** Full course catalog with question + enrollment counts (course management list). */
export async function getCoursesList(): Promise<CourseListRow[]> {
  return query<CourseListRow>(
    `SELECT c.id, c.title, c.speaker, c.topic, c.ce_credits, c.is_active,
            COALESCE(q.cnt, 0)::int AS question_count,
            COALESCE(e.cnt, 0)::int AS enrollment_count
     FROM courses c
     LEFT JOIN (SELECT course_id, COUNT(*) cnt FROM course_questions GROUP BY course_id) q
       ON q.course_id = c.id
     LEFT JOIN (SELECT course_id, COUNT(*) cnt FROM enrollments GROUP BY course_id) e
       ON e.course_id = c.id
     ORDER BY c.created_at DESC`
  );
}

export interface CourseQuestion {
  id?: string;
  position: number;
  question_text: string;
  correct_answer: boolean;
  rationale: string;
}

export interface CourseDetail {
  id: string;
  tenant_id: string;
  title: string;
  provider: string;
  speaker: string;
  topic: string;
  video_url: string;
  video_platform: string;
  ce_credits: string;
  passing_score: number;
  is_active: boolean;
  questions: CourseQuestion[];
}

/** One course plus its ordered questions (course edit page). */
export async function getCourseById(id: string): Promise<CourseDetail | null> {
  const courses = await query<Omit<CourseDetail, "questions">>(
    `SELECT id, tenant_id, title, provider, speaker, topic, video_url,
            video_platform, ce_credits, passing_score, is_active
     FROM courses WHERE id = $1`,
    [id]
  );
  if (courses.length === 0) return null;
  const questions = await query<CourseQuestion>(
    `SELECT id, position, question_text, correct_answer, rationale
     FROM course_questions WHERE course_id = $1 ORDER BY position ASC`,
    [id]
  );
  return { ...courses[0], questions };
}

// ---------------------------------------------------------------------------
// Participant-facing (public, token-gated) queries
// ---------------------------------------------------------------------------

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ParticipantEnrollment {
  id: string;
  tenant_id: string;
  clinician_name: string;
  professional_title: string;
  email: string;
  location: string | null;
  date_completed: string | null;
  status: EnrollmentStatus;
  completed_at: string | null;
  invite_token: string;
  // joined course fields
  course_id: string;
  course_title: string;
  provider: string;
  speaker: string;
  topic: string;
  video_url: string;
  video_platform: string;
  passing_score: number;
  ce_credits: string;
}

/**
 * Look up an enrollment by its invite token (a UUID). Returns null for an
 * invalid/non-UUID token or when no enrollment matches, so callers can render
 * a clear "invalid link" page rather than a login redirect.
 */
export async function getEnrollmentByToken(
  token: string
): Promise<ParticipantEnrollment | null> {
  if (!token || !UUID_RE.test(token)) return null;
  const rows = await query<ParticipantEnrollment>(
    `SELECT e.id, e.tenant_id, e.clinician_name, e.professional_title, e.email,
            e.location, to_char(e.date_completed, 'YYYY-MM-DD') AS date_completed,
            e.status, e.completed_at, e.invite_token, e.course_id,
            c.title AS course_title, c.provider, c.speaker, c.topic,
            c.video_url, c.video_platform, c.passing_score, c.ce_credits
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     WHERE e.invite_token = $1`,
    [token]
  );
  return rows[0] ?? null;
}

/** Ordered T/F quiz questions for a course (participant quiz). */
export async function getCourseQuestions(
  courseId: string
): Promise<CourseQuestion[]> {
  return query<CourseQuestion>(
    `SELECT id, position, question_text, correct_answer, rationale
     FROM course_questions WHERE course_id = $1 ORDER BY position ASC`,
    [courseId]
  );
}

/** Number of quiz attempts already recorded for an enrollment. */
export async function getQuizAttemptCount(
  enrollmentId: string
): Promise<number> {
  const rows = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM quiz_attempts WHERE enrollment_id = $1`,
    [enrollmentId]
  );
  return parseInt(rows[0]?.count ?? "0", 10);
}

/** Most recent quiz attempt (for the completion screen). */
export async function getLatestQuizAttempt(
  enrollmentId: string
): Promise<{ score: number; passed: boolean; attempt_number: number } | null> {
  const rows = await query<{
    score: number;
    passed: boolean;
    attempt_number: number;
  }>(
    `SELECT score, passed, attempt_number
     FROM quiz_attempts WHERE enrollment_id = $1
     ORDER BY submitted_at DESC LIMIT 1`,
    [enrollmentId]
  );
  return rows[0] ?? null;
}

/** Whether a course evaluation has already been submitted for an enrollment. */
export async function hasEvaluation(enrollmentId: string): Promise<boolean> {
  const rows = await query<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM course_evaluations WHERE enrollment_id = $1
     ) AS exists`,
    [enrollmentId]
  );
  return rows[0]?.exists ?? false;
}

/** Resolve the default (Global Flexinars) tenant id for new courses. */
export async function getDefaultTenantId(): Promise<string | null> {
  const rows = await query<{ id: string }>(
    `SELECT id FROM tenants ORDER BY created_at ASC LIMIT 1`
  );
  return rows[0]?.id ?? null;
}

/** Tenants with enrollment / course counts. */
export async function getTenants(): Promise<TenantRow[]> {
  return query<TenantRow>(
    `SELECT t.id, t.name, t.domain, t.status, t.plan, t.region, t.created_at,
            COALESCE(e.cnt, 0)::int AS enrollment_count,
            COALESCE(co.cnt, 0)::int AS course_count
     FROM tenants t
     LEFT JOIN (SELECT tenant_id, COUNT(*) cnt FROM enrollments GROUP BY tenant_id) e
       ON e.tenant_id = t.id
     LEFT JOIN (SELECT tenant_id, COUNT(*) cnt FROM courses GROUP BY tenant_id) co
       ON co.tenant_id = t.id
     ORDER BY t.created_at ASC`
  );
}

/** Dashboard KPI stats derived from the CE tables. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const rows = await query<{
    total_enrollments: string;
    passed_this_month: string;
    pending: string;
    avg_score: string | null;
  }>(
    `SELECT
       (SELECT COUNT(*) FROM enrollments)::text AS total_enrollments,
       (SELECT COUNT(*) FROM enrollments
          WHERE status = 'passed'
            AND completed_at >= date_trunc('month', now()))::text AS passed_this_month,
       (SELECT COUNT(*) FROM enrollments
          WHERE status IN ('invited', 'in_progress'))::text AS pending,
       (SELECT ROUND(AVG(score))::text FROM quiz_attempts) AS avg_score`
  );
  const r = rows[0];
  return {
    totalEnrollments: parseInt(r?.total_enrollments ?? "0", 10),
    passedThisMonth: parseInt(r?.passed_this_month ?? "0", 10),
    pending: parseInt(r?.pending ?? "0", 10),
    averageQuizScore: r?.avg_score != null ? parseInt(r.avg_score, 10) : null,
  };
}
