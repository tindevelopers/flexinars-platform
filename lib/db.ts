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

/**
 * Lazily resolve the pool. createPool() (which reads DATABASE_URL) is only
 * invoked on the first query at request time — never at module-evaluation
 * time. This keeps the Next.js build's "Collecting page data" step from
 * throwing when DATABASE_URL is not injected during that phase.
 */
function getPool(): Pool {
  if (!global.__gfPgPool) {
    global.__gfPgPool = createPool();
  }
  return global.__gfPgPool;
}

/**
 * Back-compat accessor. Any property access proxies to the lazily-created
 * pool, so existing `pool.connect()` / `pool.query()` call-sites keep working
 * without eager instantiation at import time.
 */
export const pool: Pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const p = getPool();
    const value = p[prop as keyof Pool];
    return typeof value === "function" ? value.bind(p) : value;
  },
});

/** Run a parameterized query and return typed rows. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const res = await getPool().query<T>(text, params as never);
  return res.rows;
}

/**
 * Run a set of statements inside a single transaction. Commits on success,
 * rolls back on any thrown error, and always releases the client.
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
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
