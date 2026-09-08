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

  // 1) Tenants — idempotent upsert with Phase 5 branding (subdomain/slug/brand).
  //    Match an existing row by name first (pre-Phase-5 rows have NULL
  //    subdomain, so ON CONFLICT (subdomain) would not catch them and could
  //    create a duplicate); otherwise insert, with ON CONFLICT (subdomain) as a
  //    safety net for fresh databases.
  async function upsertTenant({ name, slug, subdomain, brand_color, logo_url = null }) {
    const existing = (
      await client.query("SELECT id FROM tenants WHERE name = $1 LIMIT 1", [name])
    ).rows[0];
    if (existing) {
      await client.query(
        `UPDATE tenants
           SET slug = $2, subdomain = $3, brand_color = $4, logo_url = $5, updated_at = now()
         WHERE id = $1`,
        [existing.id, slug, subdomain, brand_color, logo_url]
      );
      console.log("updated tenant", name, existing.id);
      return existing.id;
    }
    const row = (
      await client.query(
        `INSERT INTO tenants (name, domain, status, plan, region, slug, subdomain, brand_color, logo_url)
         VALUES ($1,$2,'active','pro','us-east',$3,$4,$5,$6)
         ON CONFLICT (subdomain) DO UPDATE
           SET name = EXCLUDED.name, slug = EXCLUDED.slug,
               brand_color = EXCLUDED.brand_color, logo_url = EXCLUDED.logo_url,
               updated_at = now()
         RETURNING id`,
        [name, `${slug}.com`, slug, subdomain, brand_color, logo_url]
      )
    ).rows[0];
    console.log("created tenant", name, row.id);
    return row.id;
  }

  // Primary tenant — Global Flexinars Inc.
  const tenantId = await upsertTenant({
    name: "Global Flexinars Inc.",
    slug: "globalflexinars",
    subdomain: "globalflexinars",
    brand_color: "#1D4ED8", // clean blue — placeholder for their real brand
    logo_url: null, // no logo yet — the UI falls back to the tenant name
  });

  // Second, isolated tenant — smoke test for multi-tenancy. It gets its own row
  // and intentionally shares NO courses or learners with Global Flexinars.
  const demoTenantId = await upsertTenant({
    name: "Demo Dental CE",
    slug: "demo-dental",
    subdomain: "demo",
    brand_color: "#059669", // emerald
    logo_url: null,
  });
  console.log("demo tenant (no courses/learners)", demoTenantId);

  // 2) Course — "Bruxism Reframed" (real spec content). Idempotent: match any
  //    existing Bruxism Reframed course for this tenant and update it in place,
  //    otherwise insert. Then reset the 5 T/F questions to the exact spec text.
  const COURSE = {
    title:
      "Bruxism Reframed: From Occlusion to Central Physiology (Sleep & Awake)",
    provider: "Global Flexinars Inc.",
    speaker: "Dr. Igor Pesun",
    topic:
      "Bruxism Reframed: From Occlusion to Central Physiology (Sleep & Awake)",
    video_url: "https://share.synthesia.io/235b7e80-5208-4063-806a-a8d8ffb97bc8",
    video_platform: "synthesia",
    ce_credits: 1.0,
    passing_score: 60,
    is_active: true,
  };

  const QUESTIONS = [
    [
      "Bruxism is primarily caused by occlusal interferences.",
      false,
      "Current literature describes bruxism as primarily centrally mediated rather than initiated by occlusal interferences. Occlusion influences how forces are distributed, but it is not considered the primary driver of bruxism.",
    ],
    [
      "Sleep bruxism and awake bruxism are distinct behaviors with different underlying mechanisms.",
      true,
      "Sleep bruxism is associated with central nervous system activity and sleep arousals, while awake bruxism is more behavioral and associated with stress, awareness, and waking jaw-muscle activity.",
    ],
    [
      "Bruxism is always pathological and requires clinical intervention.",
      false,
      "Bruxism is not necessarily a disorder. Depending on the individual and clinical context, it may be innocuous, represent a risk factor, or have potentially protective physiologic associations. Management should be based on clinical consequences and risk.",
    ],
    [
      "A single clinical examination is sufficient to accurately determine a patient's current bruxism activity.",
      false,
      "Bruxism activity can vary considerably over time. Tooth wear is cumulative, patient reports may be unreliable, and a single clinical examination provides only a snapshot. Assessment should incorporate history, clinical findings, risk factors, and repeated evaluation when appropriate.",
    ],
    [
      "In restorative and implant treatment planning, the primary goal is to eliminate bruxism through occlusal adjustment.",
      false,
      "Occlusal adjustment does not eliminate the centrally mediated activity responsible for bruxism. The restorative goal is to manage biomechanical risk through treatment planning, material selection, occlusal design, load distribution, and protective strategies when indicated.",
    ],
  ];

  let course = (
    await client.query(
      "SELECT id FROM courses WHERE tenant_id = $1 AND title ILIKE 'Bruxism Reframed%' LIMIT 1",
      [tenantId]
    )
  ).rows[0];

  if (!course) {
    course = (
      await client.query(
        `INSERT INTO courses (tenant_id, title, provider, speaker, topic, video_url, video_platform, ce_credits, passing_score, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [
          tenantId,
          COURSE.title,
          COURSE.provider,
          COURSE.speaker,
          COURSE.topic,
          COURSE.video_url,
          COURSE.video_platform,
          COURSE.ce_credits,
          COURSE.passing_score,
          COURSE.is_active,
        ]
      )
    ).rows[0];
    console.log("created Bruxism course", course.id);
  } else {
    await client.query(
      `UPDATE courses SET title=$2, provider=$3, speaker=$4, topic=$5,
         video_url=$6, video_platform=$7, ce_credits=$8, passing_score=$9,
         is_active=$10, updated_at=now()
       WHERE id=$1`,
      [
        course.id,
        COURSE.title,
        COURSE.provider,
        COURSE.speaker,
        COURSE.topic,
        COURSE.video_url,
        COURSE.video_platform,
        COURSE.ce_credits,
        COURSE.passing_score,
        COURSE.is_active,
      ]
    );
    console.log("updated Bruxism course", course.id);
  }
  const courseId = course.id;

  // Reset questions to the exact 5-question spec (idempotent).
  await client.query("DELETE FROM course_questions WHERE course_id = $1", [
    courseId,
  ]);
  for (let i = 0; i < QUESTIONS.length; i++) {
    const [q, ans, rat] = QUESTIONS[i];
    await client.query(
      `INSERT INTO course_questions (course_id, position, question_text, correct_answer, rationale)
       VALUES ($1,$2,$3,$4,$5)`,
      [courseId, i + 1, q, ans, rat]
    );
  }
  console.log("seeded 5 quiz questions for course", courseId);

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
