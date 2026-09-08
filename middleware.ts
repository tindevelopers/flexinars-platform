import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/server";

/**
 * Middleware responsibilities:
 *  1. Multi-tenant hardening — resolve the tenant subdomain from the Host header
 *     and forward it downstream as the `x-tenant-subdomain` request header so
 *     server components can brand the page without re-parsing the host. It is
 *     also mirrored onto the response for debugging/observability.
 *  2. Auth protection — every matched (admin) route is protected by Neon Auth;
 *     unauthenticated requests are redirected to /login. The matcher below
 *     excludes Next.js internals, static assets, the auth API routes, /login,
 *     and the token-gated participant experience under /course/* so those remain
 *     reachable without a session.
 *
 * Neon Auth remains the sole auth provider — we only wrap its middleware to
 * inject the tenant header; all protection/redirect behaviour is unchanged.
 */
// Lazily created on first request so createNeonAuth() is never invoked at
// module-evaluation time (build-time "Collecting page data" has no env vars,
// which would otherwise throw "Missing required config: cookies.secret").
let _authMiddleware: ReturnType<typeof auth.middleware> | undefined;
function getAuthMiddleware() {
  if (!_authMiddleware) {
    _authMiddleware = auth.middleware({ loginUrl: "/login" });
  }
  return _authMiddleware;
}

/**
 * Extract the tenant subdomain from a raw Host header (may include a port).
 * `<sub>.localhost` is treated as a valid subdomain for local dev. Returns null
 * for bare hosts, IPs, and `www`. Kept in sync with parseSubdomain in
 * lib/tenant.ts (duplicated because this file runs in the edge runtime and
 * cannot import the server-only tenant module).
 */
function parseSubdomain(host: string | null): string | null {
  if (!host) return null;
  const hostname = host.split(":")[0].trim().toLowerCase();
  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0") {
    return null;
  }
  const parts = hostname.split(".");
  const isLocalhost = parts[parts.length - 1] === "localhost";
  const minParts = isLocalhost ? 2 : 3;
  if (parts.length < minParts) return null;
  const sub = parts[0];
  if (!sub || sub === "www") return null;
  return sub;
}

export default async function middleware(request: NextRequest) {
  const subdomain = parseSubdomain(request.headers.get("host"));

  // Forward the tenant subdomain as a request header. Neon Auth's middleware
  // copies request.headers onto its NextResponse.next({ request }) for allowed
  // requests, so injecting it here makes it visible to downstream server
  // components via headers().
  let forwarded: NextRequest = request;
  if (subdomain) {
    const headers = new Headers(request.headers);
    headers.set("x-tenant-subdomain", subdomain);
    forwarded = new NextRequest(request, { headers });
  }

  const response = await getAuthMiddleware()(forwarded);
  if (subdomain && response) {
    response.headers.set("x-tenant-subdomain", subdomain);
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|api/auth|course|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
