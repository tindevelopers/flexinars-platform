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
