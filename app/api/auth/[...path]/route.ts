import { getAuth } from "@/lib/auth/server";

/**
 * Neon Auth API route handler.
 * Proxies all client auth requests (sign-in, sign-up, session, sign-out, etc.)
 * to the Neon Auth instance under /api/auth/*.
 *
 * The Neon Auth instance is created lazily inside each handler (via getAuth())
 * so that createNeonAuth() is never called at module-evaluation time. During
 * Next.js "Collecting page data" (build), env vars like NEON_AUTH_COOKIE_SECRET
 * are not injected, so eagerly calling auth.handler() at import time throws
 * "Missing required config: cookies.secret" and fails the build.
 */

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, ctx: RouteCtx) {
  return getAuth().handler().GET(request, ctx);
}

export async function POST(request: Request, ctx: RouteCtx) {
  return getAuth().handler().POST(request, ctx);
}
