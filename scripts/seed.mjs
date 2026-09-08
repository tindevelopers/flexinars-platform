/**
 * Idempotent seed: one Global Flexinars tenant, one sample course with T/F
 * questions, and a few demo enrollments across statuses (so the dashboard and
 * learner list render meaningful data). Safe to re-run.
 *
 * Usage: node scripts/seed.mjs
 */
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import dotenv from "dotenv";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(root, ".env.local"), quiet: true });

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  // 1) Tenant
  let tenant = (
    await client.query("SELECT id FROM tenants WHERE name = $1 LIMIT 1", [
      "Global Flexinars Inc.",
    ])
  ).rows[0];
  if (!tenant) {
    tenant = (
      await client.query(
        `INSERT INTO tenants (name, domain, status, plan, region)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        ["Global Flexinars Inc.", "globalflexinars.com", "active", "pro", "us-east"]
      )
    ).rows[0];
    console.log("created tenant", tenant.id);
  } else {
    console.log("tenant exists", tenant.id);
  }
  const tenantId = tenant.id;

  // 2) Course
  let course = (
    await client.query(
      "SELECT id FROM courses WHERE tenant_id = $1 AND title = $2 LIMIT 1",
      [tenantId, "Bruxism Reframed: A Modern Clinical Approach"]
    )
  ).rows[0];
  if (!course) {
    course = (
      await client.query(
        `INSERT INTO courses (tenant_id, title, provider, speaker, topic, video_url, video_platform, ce_credits, passing_score)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [
          tenantId,
          "Bruxism Reframed: A Modern Clinical Approach",
          "Global Flexinars Inc.",
          "Dr. Jane Mercer, DDS",
          "Bruxism & Occlusal Health",
          "https://share.synthesia.io/embed/sample-bruxism-reframed",
          "synthesia",
          1.0,
          60,
        ]
      )
    ).rows[0];
    const questions = [
      ["Bruxism is exclusively caused by dental malocclusion.", false, "Bruxism is multifactorial; sleep and stress factors play a major role."],
      ["Sleep bruxism is considered a centrally mediated sleep-related movement disorder.", true, "Current evidence classifies sleep bruxism as centrally mediated."],
      ["Occlusal splints permanently cure bruxism.", false, "Splints protect dentition and manage symptoms but do not cure bruxism."],
    ];
    for (let i = 0; i < questions.length; i++) {
      const [q, ans, rat] = questions[i];
      await client.query(
        `INSERT INTO course_questions (course_id, position, question_text, correct_answer, rationale)
         VALUES ($1,$2,$3,$4,$5)`,
        [course.id, i + 1, q, ans, rat]
      );
    }
    console.log("created course + questions", course.id);
  } else {
    console.log("course exists", course.id);
  }
  const courseId = course.id;

  // 3) Demo enrollments across statuses
  const demo = [
    ["Dr. Alan Pierce", "DDS", "alan.pierce@example.com", "New York, NY", "passed"],
    ["Dr. Maria Gomez", "DMD", "maria.gomez@example.com", "Austin, TX", "in_progress"],
    ["Dr. Wei Chen", "DDS, MS", "wei.chen@example.com", "San Jose, CA", "invited"],
    ["Dr. Sofia Rossi", "RDH", "sofia.rossi@example.com", "Miami, FL", "failed"],
  ];
  for (const [name, title, email, loc, status] of demo) {
    const exists = (
      await client.query(
        "SELECT id FROM enrollments WHERE course_id = $1 AND email = $2 LIMIT 1",
        [courseId, email]
      )
    ).rows[0];
    if (exists) continue;
    const invitedAt = status === "invited" ? "now()" : "now() - interval '10 days'";
    const completedAt =
      status === "passed" || status === "failed" ? ", now() - interval '2 days'" : ", NULL";
    const enr = (
      await client.query(
        `INSERT INTO enrollments (tenant_id, course_id, clinician_name, professional_title, email, location, status, invited_at, completed_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7, ${invitedAt} ${completedAt})
         RETURNING id`,
        [tenantId, courseId, name, title, email, loc, status]
      )
    ).rows[0];
    // Quiz attempt for passed/failed
    if (status === "passed" || status === "failed") {
      const score = status === "passed" ? 90 : 40;
      await client.query(
        `INSERT INTO quiz_attempts (enrollment_id, attempt_number, score, passed, submitted_at)
         VALUES ($1,1,$2,$3, now() - interval '2 days')`,
        [enr.id, score, status === "passed"]
      );
    }
    console.log("created enrollment", email, status);
  }

  console.log("seed complete");
}

main()
  .then(() => client.end())
  .catch((e) => {
    console.error(e.message);
    client.end();
    process.exit(1);
  });
