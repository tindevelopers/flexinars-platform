import "server-only";
import { createNeonAuth } from "@neondatabase/auth/next/server";

/**
 * Neon Managed Better Auth — server instance.
 *
 * Exposes:
 *  - auth.handler()      → mounted at app/api/auth/[...path]/route.ts
 *  - auth.middleware()   → used by middleware.ts to protect admin routes
 *  - Better Auth server methods (getSession, etc.)
 *
 * Configuration comes from environment variables (never hard-coded):
 *  - NEON_AUTH_BASE_URL       Base URL of the Neon Auth instance
 *  - NEON_AUTH_COOKIE_SECRET  >=32-char secret used to sign session cookies
 */
export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
});
