/**
 * Migration runner — applies every .sql file in ../migrations (sorted) against
 * DATABASE_URL from .env.local, tracking applied files in a schema_migrations table.
 *
 * Usage: node scripts/run-migrations.mjs
 * Idempotent: already-applied files are skipped; each file runs inside a transaction.
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Load .env.local (fallback to .env)
dotenv.config({ path: join(root, ".env.local") });
dotenv.config({ path: join(root, ".env") });

const { DATABASE_URL } = process.env;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set (check .env.local).");
  process.exit(1);
}

const migrationsDir = join(root, "migrations");
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const { rows } = await client.query("SELECT filename FROM schema_migrations");
  const applied = new Set(rows.map((r) => r.filename));

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip  ${file} (already applied)`);
      continue;
    }
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (filename) VALUES ($1)",
        [file]
      );
      await client.query("COMMIT");
      console.log(`apply ${file} OK`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`FAIL  ${file}: ${err.message}`);
      throw err;
    }
  }

  // Report the CE tables now present
  const ceTables = [
    "courses",
    "course_questions",
    "enrollments",
    "quiz_attempts",
    "quiz_answers",
    "course_evaluations",
    "evaluation_responses",
  ];
  const present = await client.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = ANY($1)
     ORDER BY table_name`,
    [ceTables]
  );
  console.log("\nCE tables present:", present.rows.map((r) => r.table_name).join(", "));
}

main()
  .then(() => client.end())
  .catch((e) => {
    console.error(e.message);
    client.end();
    process.exit(1);
  });
