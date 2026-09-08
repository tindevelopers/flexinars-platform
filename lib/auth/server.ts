import "server-only";
import { createNeonAuth } from "@neondatabase/auth/next/server";

/**
 * Neon Managed Better Auth — server instance.
 *
 * Lazily instantiated so that Next.js does not call createNeonAuth()
 * at module-evaluation time during static page collection (where env
 * vars like NEON_AUTH_COOKIE_SECRET are not yet injected by the runtime).
 * All call-sites should use `getAuth()` instead of `auth` directly.
 *
 * Configuration comes from environment variables (never hard-coded):
 *  - NEON_AUTH_BASE_URL       Base URL of the Neon Auth instance
 *  - NEON_AUTH_COOKIE_SECRET  >=32-char secret used to sign session cookies
 */

let _auth: ReturnType<typeof createNeonAuth> | undefined;

export function getAuth() {
  if (!_auth) {
    _auth = createNeonAuth({
      baseUrl: process.env.NEON_AUTH_BASE_URL!,
      cookies: {
        secret: process.env.NEON_AUTH_COOKIE_SECRET!,
      },
    });
  }
  return _auth;
}

/** @deprecated Use getAuth() to avoid build-time instantiation errors */
export const auth = new Proxy({} as ReturnType<typeof createNeonAuth>, {
  get(_target, prop) {
    return getAuth()[prop as keyof ReturnType<typeof createNeonAuth>];
  },
});
