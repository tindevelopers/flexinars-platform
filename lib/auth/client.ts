"use client";
import { createAuthClient } from "@neondatabase/auth";

/**
 * Neon Managed Better Auth — browser client instance.
 *
 * IMPORTANT: the client must talk to THIS app's own origin so requests go
 * through the same-origin /api/auth proxy (app/api/auth/[...path]/route.ts),
 * which forwards to the Neon Auth instance and sets the session cookie on our
 * own domain — the cookie the middleware reads. Better Auth automatically
 * appends the `/api/auth` base path when the URL has no path component, so we
 * pass the bare app origin (never the raw Neon URL, which carries a path and
 * would be used as-is, setting cookies cross-origin where middleware can't see
 * them).
 */
function resolveOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export const authClient = createAuthClient(resolveOrigin());
