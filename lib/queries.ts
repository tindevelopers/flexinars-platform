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

// ---------------------------------------------------------------------------
// Reporting (admin, Phase 4)
// ---------------------------------------------------------------------------

export interface ReportSummary {
  totalCompletions: number;
  passRate: number | null; // % of submitted attempts that passed
  averageScore: number | null; // avg score across all attempts
  averageAttemptsToPass: number | null; // avg attempt_number where passed
  evaluationsSubmitted: number;
  commercialBiasReports: number;
}

/** Headline KPI numbers for the reports summary dashboard. */
export async function getReportSummary(): Promise<ReportSummary> {
  const rows = await query<{
    total_completions: string;
    total_attempts: string;
    passed_attempts: string;
    avg_score: string | null;
    avg_attempts_to_pass: string | null;
    evaluations_submitted: string;
    commercial_bias_reports: string;
  }>(
    `SELECT
       (SELECT COUNT(*) FROM enrollments WHERE status = 'passed')::text AS total_completions,
       (SELECT COUNT(*) FROM quiz_attempts)::text AS total_attempts,
       (SELECT COUNT(*) FROM quiz_attempts WHERE passed = true)::text AS passed_attempts,
       (SELECT ROUND(AVG(score), 1)::text FROM quiz_attempts) AS avg_score,
       (SELECT ROUND(AVG(attempt_number), 2)::text FROM quiz_attempts WHERE passed = true) AS avg_attempts_to_pass,
       (SELECT COUNT(*) FROM course_evaluations)::text AS evaluations_submitted,
       (SELECT COUNT(*) FROM course_evaluations WHERE perceived_commercial_bias = true)::text AS commercial_bias_reports`
  );
  const r = rows[0];
  const totalAttempts = parseInt(r?.total_attempts ?? "0", 10);
  const passedAttempts = parseInt(r?.passed_attempts ?? "0", 10);
  return {
    totalCompletions: parseInt(r?.total_completions ?? "0", 10),
    passRate:
      totalAttempts > 0
        ? Math.round((passedAttempts / totalAttempts) * 1000) / 10
        : null,
    averageScore: r?.avg_score != null ? parseFloat(r.avg_score) : null,
    averageAttemptsToPass:
      r?.avg_attempts_to_pass != null
        ? parseFloat(r.avg_attempts_to_pass)
        : null,
    evaluationsSubmitted: parseInt(r?.evaluations_submitted ?? "0", 10),
    commercialBiasReports: parseInt(r?.commercial_bias_reports ?? "0", 10),
  };
}

export interface ScoreBucket {
  label: string;
  count: number;
}

/** Quiz score distribution across five 20-point buckets. */
export async function getScoreDistribution(): Promise<ScoreBucket[]> {
  const rows = await query<{ bucket: number; count: string }>(
    `SELECT width_bucket(score, 0, 100, 5) AS bucket, COUNT(*)::text AS count
     FROM quiz_attempts
     GROUP BY bucket`
  );
  // width_bucket returns 1..5 for 0-20,20-40,...,80-100; a score of exactly
  // 100 lands in bucket 6 — fold it back into the top bucket.
  const counts = [0, 0, 0, 0, 0];
  for (const row of rows) {
    const b = row.bucket;
    const idx = b >= 6 ? 4 : b - 1;
    if (idx >= 0 && idx < 5) counts[idx] += parseInt(row.count, 10);
  }
  const labels = ["0–20%", "20–40%", "40–60%", "60–80%", "80–100%"];
  return labels.map((label, i) => ({ label, count: counts[i] }));
}

export interface KnowledgeShift {
  level: string;
  label: string;
  before: number;
  after: number;
}

/** Counts of knowledge_before vs knowledge_after by level (novice…proficient). */
export async function getKnowledgeShift(): Promise<KnowledgeShift[]> {
  const levels = [
    { level: "none", label: "None" },
    { level: "novice", label: "Novice" },
    { level: "competent", label: "Competent" },
    { level: "proficient", label: "Proficient" },
  ];
  const beforeRows = await query<{ v: string; count: string }>(
    `SELECT knowledge_before AS v, COUNT(*)::text AS count
     FROM course_evaluations WHERE knowledge_before IS NOT NULL GROUP BY knowledge_before`
  );
  const afterRows = await query<{ v: string; count: string }>(
    `SELECT knowledge_after AS v, COUNT(*)::text AS count
     FROM course_evaluations WHERE knowledge_after IS NOT NULL GROUP BY knowledge_after`
  );
  const beforeMap = new Map(beforeRows.map((r) => [r.v, parseInt(r.count, 10)]));
  const afterMap = new Map(afterRows.map((r) => [r.v, parseInt(r.count, 10)]));
  return levels.map((l) => ({
    level: l.level,
    label: l.label,
    before: beforeMap.get(l.level) ?? 0,
    after: afterMap.get(l.level) ?? 0,
  }));
}

export interface CompletionRow {
  enrollment_id: string;
  clinician_name: string;
  professional_title: string;
  email: string;
  location: string | null;
  course_title: string;
  speaker: string;
  topic: string;
  ce_credits: string;
  date_completed: string | null;
  quiz_score: number | null;
  total_attempts: number;
  evaluation_submitted: boolean;
  evaluation_submitted_at: string | null;
  knowledge_before: string | null;
  knowledge_after: string | null;
  new_information: boolean | null;
  overall_speaker_rating: string | null;
  would_take_again: boolean | null;
  would_recommend: boolean | null;
}

const COMPLETION_SORT_COLUMNS: Record<string, string> = {
  date_completed: "date_completed",
  clinician_name: "e.clinician_name",
  score: "quiz_score",
};

/**
 * All PASSED enrollments joined with course, best passing quiz attempt and
 * evaluation summary. Supports course + date-range filtering, sorting and
 * (optional) pagination. Pass `paginate: false` to return every row (CSV).
 */
export async function getCompletions(opts: {
  courseId?: string;
  from?: string;
  to?: string;
  sort?: string;
  dir?: string;
  page?: number;
  pageSize?: number;
  paginate?: boolean;
}): Promise<{ rows: CompletionRow[]; total: number }> {
  const where: string[] = ["e.status = 'passed'"];
  const params: unknown[] = [];
  if (opts.courseId && opts.courseId !== "all") {
    params.push(opts.courseId);
    where.push(`e.course_id = $${params.length}`);
  }
  if (opts.from) {
    params.push(opts.from);
    where.push(`e.date_completed >= $${params.length}`);
  }
  if (opts.to) {
    params.push(opts.to);
    where.push(`e.date_completed <= $${params.length}`);
  }
  const whereSql = `WHERE ${where.join(" AND ")}`;

  const sortCol =
    COMPLETION_SORT_COLUMNS[opts.sort ?? "date_completed"] ?? "date_completed";
  const dir = (opts.dir ?? "desc").toLowerCase() === "asc" ? "ASC" : "DESC";

  // Best passing attempt score + total attempts, per enrollment.
  const baseSelect = `
    SELECT e.id AS enrollment_id, e.clinician_name, e.professional_title,
           e.email, e.location,
           c.title AS course_title, c.speaker, c.topic, c.ce_credits,
           to_char(e.date_completed, 'YYYY-MM-DD') AS date_completed,
           qa.best_score AS quiz_score,
           COALESCE(qa.attempts, 0)::int AS total_attempts,
           (ev.id IS NOT NULL) AS evaluation_submitted,
           to_char(ev.submitted_at, 'YYYY-MM-DD') AS evaluation_submitted_at,
           ev.knowledge_before, ev.knowledge_after, ev.new_information,
           ev.overall_speaker_rating, ev.would_take_again, ev.would_recommend
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    LEFT JOIN (
      SELECT enrollment_id,
             MAX(score) FILTER (WHERE passed) AS best_score,
             COUNT(*) AS attempts
      FROM quiz_attempts GROUP BY enrollment_id
    ) qa ON qa.enrollment_id = e.id
    LEFT JOIN course_evaluations ev ON ev.enrollment_id = e.id
    ${whereSql}`;

  const totalRows = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM enrollments e ${whereSql}`,
    params
  );
  const total = parseInt(totalRows[0]?.count ?? "0", 10);

  let sql = `${baseSelect} ORDER BY ${sortCol} ${dir} NULLS LAST, e.clinician_name ASC`;
  if (opts.paginate !== false) {
    const page = Math.max(1, opts.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 25));
    const offset = (page - 1) * pageSize;
    sql += ` LIMIT ${pageSize} OFFSET ${offset}`;
  }
  const rows = await query<CompletionRow>(sql, params);
  return { rows, total };
}

export interface LikertSummary {
  section: string;
  item_key: string;
  item_text: string;
  count: number;
  average: number | null;
  dist: number[]; // index 0..4 => responses 1..5
}

/** Aggregated Likert stats (avg, count, 1–5 distribution) per evaluation item. */
export async function getLikertSummary(): Promise<LikertSummary[]> {
  const rows = await query<{
    section: string;
    item_key: string;
    item_text: string;
    count: string;
    average: string | null;
    r1: string;
    r2: string;
    r3: string;
    r4: string;
    r5: string;
  }>(
    `SELECT section, item_key,
            MAX(item_text) AS item_text,
            COUNT(*)::text AS count,
            ROUND(AVG(response), 2)::text AS average,
            COUNT(*) FILTER (WHERE response = 1)::text AS r1,
            COUNT(*) FILTER (WHERE response = 2)::text AS r2,
            COUNT(*) FILTER (WHERE response = 3)::text AS r3,
            COUNT(*) FILTER (WHERE response = 4)::text AS r4,
            COUNT(*) FILTER (WHERE response = 5)::text AS r5
     FROM evaluation_responses
     GROUP BY section, item_key
     ORDER BY section, item_key`
  );
  return rows.map((r) => ({
    section: r.section,
    item_key: r.item_key,
    item_text: r.item_text,
    count: parseInt(r.count, 10),
    average: r.average != null ? parseFloat(r.average) : null,
    dist: [
      parseInt(r.r1, 10),
      parseInt(r.r2, 10),
      parseInt(r.r3, 10),
      parseInt(r.r4, 10),
      parseInt(r.r5, 10),
    ],
  }));
}

export interface CategoryCount {
  value: string;
  count: number;
}

export interface SectionCSummary {
  knowledgeBefore: CategoryCount[];
  knowledgeAfter: CategoryCount[];
  speakerRating: CategoryCount[];
  newInformation: { yes: number; no: number };
  wouldTakeAgain: { yes: number; no: number };
  wouldRecommend: { yes: number; no: number };
  total: number;
}

/** Distributions for the scalar Section C evaluation fields. */
export async function getSectionCSummary(): Promise<SectionCSummary> {
  const catCount = async (col: string): Promise<CategoryCount[]> => {
    const rows = await query<{ value: string; count: string }>(
      `SELECT ${col} AS value, COUNT(*)::text AS count
       FROM course_evaluations WHERE ${col} IS NOT NULL GROUP BY ${col}`
    );
    return rows.map((r) => ({ value: r.value, count: parseInt(r.count, 10) }));
  };
  const boolCount = async (col: string): Promise<{ yes: number; no: number }> => {
    const rows = await query<{ yes: string; no: string }>(
      `SELECT COUNT(*) FILTER (WHERE ${col} = true)::text AS yes,
              COUNT(*) FILTER (WHERE ${col} = false)::text AS no
       FROM course_evaluations`
    );
    return {
      yes: parseInt(rows[0]?.yes ?? "0", 10),
      no: parseInt(rows[0]?.no ?? "0", 10),
    };
  };
  const totalRows = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM course_evaluations`
  );
  const [knowledgeBefore, knowledgeAfter, speakerRating, newInformation, wouldTakeAgain, wouldRecommend] =
    await Promise.all([
      catCount("knowledge_before"),
      catCount("knowledge_after"),
      catCount("overall_speaker_rating"),
      boolCount("new_information"),
      boolCount("would_take_again"),
      boolCount("would_recommend"),
    ]);
  return {
    knowledgeBefore,
    knowledgeAfter,
    speakerRating,
    newInformation,
    wouldTakeAgain,
    wouldRecommend,
    total: parseInt(totalRows[0]?.count ?? "0", 10),
  };
}

export interface EvaluationRecord {
  id: string;
  enrollment_id: string;
  clinician_name: string;
  course_title: string;
  submitted_at: string | null;
  knowledge_before: string | null;
  knowledge_after: string | null;
  new_information: boolean | null;
  overall_speaker_rating: string | null;
  would_take_again: boolean | null;
  would_recommend: boolean | null;
  perceived_commercial_bias: boolean | null;
  commercial_bias_explanation: string | null;
  most_valuable_concept: string | null;
  clinical_application: string | null;
  needs_more_detail: string | null;
  enjoyed_most: string | null;
  additional_topics: string | null;
  additional_comments: string | null;
}

/** Individual evaluation submissions with free-text fields (newest first). */
export async function getEvaluationRecords(opts?: {
  courseId?: string;
}): Promise<EvaluationRecord[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts?.courseId && opts.courseId !== "all") {
    params.push(opts.courseId);
    where.push(`e.course_id = $${params.length}`);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return query<EvaluationRecord>(
    `SELECT ev.id, ev.enrollment_id, e.clinician_name, c.title AS course_title,
            to_char(ev.submitted_at, 'YYYY-MM-DD') AS submitted_at,
            ev.knowledge_before, ev.knowledge_after, ev.new_information,
            ev.overall_speaker_rating, ev.would_take_again, ev.would_recommend,
            ev.perceived_commercial_bias, ev.commercial_bias_explanation,
            ev.most_valuable_concept, ev.clinical_application, ev.needs_more_detail,
            ev.enjoyed_most, ev.additional_topics, ev.additional_comments
     FROM course_evaluations ev
     JOIN enrollments e ON e.id = ev.enrollment_id
     JOIN courses c ON c.id = e.course_id
     ${whereSql}
     ORDER BY ev.submitted_at DESC NULLS LAST`,
    params
  );
}

export interface EvaluationExportRow extends EvaluationRecord {
  responses: Record<string, number>; // item_key -> response
}

/** Evaluation records plus a flattened map of the 14 Likert responses (CSV). */
export async function getEvaluationsForExport(): Promise<EvaluationExportRow[]> {
  const records = await getEvaluationRecords();
  const respRows = await query<{
    evaluation_id: string;
    item_key: string;
    response: number;
  }>(
    `SELECT evaluation_id, item_key, response FROM evaluation_responses`
  );
  const byEval = new Map<string, Record<string, number>>();
  for (const r of respRows) {
    const m = byEval.get(r.evaluation_id) ?? {};
    m[r.item_key] = r.response;
    byEval.set(r.evaluation_id, m);
  }
  return records.map((rec) => ({
    ...rec,
    responses: byEval.get(rec.id) ?? {},
  }));
}

export interface QuizQuestionStat {
  question_id: string;
  position: number;
  question_text: string;
  correct_answer: boolean;
  correct_count: number;
  incorrect_count: number;
  total: number;
  correct_rate: number | null; // %
}

/** Per-question correct/incorrect counts and rate across all quiz answers. */
export async function getQuizAnalysis(): Promise<{
  questions: QuizQuestionStat[];
  totalSubmissions: number;
}> {
  const rows = await query<{
    question_id: string;
    position: number;
    question_text: string;
    correct_answer: boolean;
    correct_count: string;
    incorrect_count: string;
  }>(
    `SELECT q.id AS question_id, q.position, q.question_text, q.correct_answer,
            COUNT(*) FILTER (WHERE a.is_correct)::text AS correct_count,
            COUNT(*) FILTER (WHERE NOT a.is_correct)::text AS incorrect_count
     FROM course_questions q
     LEFT JOIN quiz_answers a ON a.question_id = q.id
     GROUP BY q.id, q.position, q.question_text, q.correct_answer
     ORDER BY q.position ASC`
  );
  const questions: QuizQuestionStat[] = rows.map((r) => {
    const correct = parseInt(r.correct_count, 10);
    const incorrect = parseInt(r.incorrect_count, 10);
    const total = correct + incorrect;
    return {
      question_id: r.question_id,
      position: r.position,
      question_text: r.question_text,
      correct_answer: r.correct_answer,
      correct_count: correct,
      incorrect_count: incorrect,
      total,
      correct_rate: total > 0 ? Math.round((correct / total) * 1000) / 10 : null,
    };
  });
  const submRows = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM quiz_attempts`
  );
  return {
    questions,
    totalSubmissions: parseInt(submRows[0]?.count ?? "0", 10),
  };
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
