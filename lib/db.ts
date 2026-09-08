import "server-only";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

/**
 * Server-only Postgres (Neon) connection pool.
 *
 * A single pool is reused across hot reloads in dev by stashing it on
 * globalThis. DATABASE_URL is read from the environment (.env.local) and is
 * never exposed to the client.
 */
declare global {
  // eslint-disable-next-line no-var
  var __gfPgPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — check .env.local");
  }
  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30_000,
  });
}

export const pool: Pool = global.__gfPgPool ?? createPool();
if (process.env.NODE_ENV !== "production") {
  global.__gfPgPool = pool;
}

/** Run a parameterized query and return typed rows. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const res = await pool.query<T>(text, params as never);
  return res.rows;
}

/**
 * Run a set of statements inside a single transaction. Commits on success,
 * rolls back on any thrown error, and always releases the client.
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
