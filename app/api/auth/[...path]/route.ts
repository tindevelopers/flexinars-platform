import { auth } from "@/lib/auth/server";

/**
 * Neon Auth API route handler.
 * Proxies all client auth requests (sign-in, sign-up, session, sign-out, etc.)
 * to the Neon Auth instance under /api/auth/*.
 */
export const { GET, POST } = auth.handler();
